const net = require('net');

/**
 * Fetch stats from cgminer-compatible device (Avakon, etc.)
 * @param {string} ipAddress - IP address of the device
 * @param {number} port - RPC port (default 4028)
 * @returns {Promise<Object>} Miner statistics
 */
async function fetchCgminerStats(ipAddress, port = 4028) {
  return new Promise((resolve, reject) => {
    const client = new net.Socket();
    const timeout = 5000;
    
    let responseData = '';
    
    client.setTimeout(timeout);
    
    client.on('connect', () => {
      // Send stats command to cgminer
      const command = JSON.stringify({
        command: 'stats'
      }) + '\n';
      
      client.write(command);
    });
    
    client.on('data', (data) => {
      responseData += data.toString();
      
      // cgminer responses are typically complete when we get a newline
      if (responseData.includes('\n')) {
        client.destroy();
      }
    });
    
    client.on('close', () => {
      try {
        // Parse JSON response
        const lines = responseData.trim().split('\n');
        let parsedData = null;
        
        for (const line of lines) {
          try {
            const json = JSON.parse(line);
            if (json.STATUS && json.STATUS[0] && json.STATUS[0].STATUS === 'S') {
              parsedData = json;
              break;
            }
          } catch (e) {
            // Try next line
            continue;
          }
        }
        
        if (!parsedData) {
          // Try parsing the entire response
          try {
            parsedData = JSON.parse(responseData.trim());
          } catch (e) {
            // If that fails, try summary command
            return fetchCgminerSummary(ipAddress, port).then(resolve).catch(reject);
          }
        }
        
        const stats = parseCgminerStats(parsedData);
        resolve(stats);
      } catch (error) {
        // Fallback to summary command
        fetchCgminerSummary(ipAddress, port).then(resolve).catch(reject);
      }
    });
    
    client.on('error', (error) => {
      reject(new Error(`Failed to connect to cgminer: ${error.message}`));
    });
    
    client.on('timeout', () => {
      client.destroy();
      reject(new Error('Connection timeout'));
    });
    
    client.connect(port, ipAddress);
  });
}

/**
 * Fetch summary stats from cgminer (fallback)
 * @param {string} ipAddress - IP address of the device
 * @param {number} port - RPC port
 * @returns {Promise<Object>} Miner statistics
 */
function fetchCgminerSummary(ipAddress, port = 4028) {
  return new Promise((resolve, reject) => {
    const client = new net.Socket();
    const timeout = 5000;
    
    let responseData = '';
    
    client.setTimeout(timeout);
    
    client.on('connect', () => {
      // Send summary command
      const command = JSON.stringify({
        command: 'summary'
      }) + '\n';
      
      client.write(command);
    });
    
    client.on('data', (data) => {
      responseData += data.toString();
      
      if (responseData.includes('\n')) {
        client.destroy();
      }
    });
    
    client.on('close', () => {
      try {
        const lines = responseData.trim().split('\n');
        let parsedData = null;
        
        for (const line of lines) {
          try {
            const json = JSON.parse(line);
            if (json.SUMMARY && json.SUMMARY[0]) {
              parsedData = json;
              break;
            }
          } catch (e) {
            continue;
          }
        }
        
        if (!parsedData) {
          parsedData = JSON.parse(responseData.trim());
        }
        
        const stats = parseCgminerStats(parsedData);
        resolve(stats);
      } catch (error) {
        reject(new Error(`Failed to parse cgminer response: ${error.message}`));
      }
    });
    
    client.on('error', (error) => {
      reject(new Error(`Failed to connect to cgminer: ${error.message}`));
    });
    
    client.on('timeout', () => {
      client.destroy();
      reject(new Error('Connection timeout'));
    });
    
    client.connect(port, ipAddress);
  });
}

/**
 * Parse cgminer API response into common format
 * @param {Object} data - Raw API response
 * @returns {Object} Parsed stats
 */
function parseCgminerStats(data) {
  // cgminer API structure
  // SUMMARY array contains overall stats
  // STATS array contains per-device stats
  
  const summary = data.SUMMARY && data.SUMMARY[0] ? data.SUMMARY[0] : {};
  const stats = data.STATS && data.STATS[0] ? data.STATS[0] : {};
  
  // Hashrate is typically in GH/s
  const hashrate = summary['GHS 5s'] || summary['GHS av'] || summary['MHS 5s'] || summary['MHS av'] || 0;
  const hashrateUnit = summary['GHS 5s'] || summary['GHS av'] ? 'GH/s' : 'MH/s';
  
  // Power (may not be available in all cgminer versions)
  const power = summary['Power'] || stats['Power'] || 0;
  
  // Temperature (from stats, usually per-device)
  const temperature = stats['Temperature'] || stats['temp'] || summary['Temperature'] || 0;
  
  // Shares
  const sharesAccepted = summary['Accepted'] || stats['Accepted'] || 0;
  const sharesRejected = summary['Rejected'] || stats['Rejected'] || 0;
  
  // Difficulty
  const difficulty = summary['Difficulty Accepted'] || stats['Difficulty Accepted'] || 0;
  const bestDifficulty = summary['Best Share'] || stats['Best Share'] || difficulty || 0;
  
  // Device info
  const model = stats['Name'] || summary['Name'] || data['Type'] || 'Avakon/CGMiner';
  const deviceName = stats['Name'] || summary['Name'] || 'CGMiner Device';
  
  return {
    // Hashrate
    hashrate: hashrate,
    hashrateUnit: hashrateUnit,
    
    // Power
    power: power,
    powerUnit: 'W',
    
    // Temperature
    temperature: temperature,
    temperatureUnit: '°C',
    
    // Shares
    sharesAccepted: sharesAccepted,
    sharesRejected: sharesRejected,
    
    // Difficulty
    difficulty: difficulty,
    bestDifficulty: bestDifficulty,
    
    // Session stats
    sessionAccepted: sharesAccepted,
    sessionRejected: sharesRejected,
    
    // Efficiency
    efficiency: calculateEfficiency(power, hashrate),
    efficiencyUnit: 'J/TH',
    
    // Device info
    model: model,
    deviceName: deviceName,
    firmware: summary['Version'] || stats['Version'] || 'Unknown',
    
    // Status
    status: summary['Status'] || stats['Status'] || 'unknown',
    uptime: summary['Elapsed'] || stats['Elapsed'] || 0,
    
    // Raw data
    raw: data
  };
}

/**
 * Calculate efficiency (J/TH)
 * @param {number} power - Power in watts
 * @param {number} hashrate - Hashrate (needs to be converted to TH/s)
 * @returns {number} Efficiency in J/TH
 */
function calculateEfficiency(power, hashrate) {
  if (!power || !hashrate || hashrate === 0) {
    return 0;
  }
  
  // Convert hashrate to TH/s
  // If hashrate is in GH/s, divide by 1000
  // If in MH/s, divide by 1000000
  let hashrateTH = hashrate;
  if (hashrate < 1000) {
    // Likely in GH/s
    hashrateTH = hashrate / 1000;
  } else if (hashrate < 1000000) {
    // Likely in GH/s
    hashrateTH = hashrate / 1000;
  } else {
    // Already in TH/s or MH/s
    hashrateTH = hashrate / 1000000;
  }
  
  if (hashrateTH === 0) {
    return 0;
  }
  
  // Efficiency = Power (W) / Hashrate (TH/s) = J/TH
  return power / hashrateTH;
}

module.exports = {
  fetchCgminerStats
};
