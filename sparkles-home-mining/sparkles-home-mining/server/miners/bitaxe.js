const axios = require('axios');

/**
 * Fetch stats from Bitaxe AxeOS device
 * @param {string} ipAddress - IP address of the Bitaxe device
 * @returns {Promise<Object>} Miner statistics
 */
async function fetchBitaxeStats(ipAddress) {
  try {
    // Bitaxe AxeOS API endpoints (version 2.12.2)
    // Common endpoints: /api/status, /api/stats, /api/info
    const baseUrl = `http://${ipAddress}`;
    
    // Try multiple possible endpoints
    const endpoints = [
      '/api/status',
      '/api/stats',
      '/api/info',
      '/api'
    ];
    
    let stats = null;
    let deviceInfo = null;
    
    for (const endpoint of endpoints) {
      try {
        const response = await axios.get(`${baseUrl}${endpoint}`, {
          timeout: 5000,
          headers: {
            'Accept': 'application/json'
          }
        });
        
        if (response.data) {
          stats = response.data;
          break;
        }
      } catch (err) {
        // Continue to next endpoint
        continue;
      }
    }
    
    // If no stats found, try to get device info
    if (!stats) {
      try {
        const infoResponse = await axios.get(`${baseUrl}/api/info`, {
          timeout: 5000
        });
        deviceInfo = infoResponse.data;
      } catch (err) {
        // Ignore
      }
    }
    
    // Parse Bitaxe stats into common format
    return parseBitaxeStats(stats || deviceInfo || {});
  } catch (error) {
    throw new Error(`Failed to fetch Bitaxe stats: ${error.message}`);
  }
}

/**
 * Parse Bitaxe API response into common format
 * @param {Object} data - Raw API response
 * @returns {Object} Parsed stats
 */
function parseBitaxeStats(data) {
  // Bitaxe API structure may vary, so we'll handle common fields
  // Common fields: hashrate, temperature, power, accepted, rejected, difficulty, etc.
  
  const stats = {
    // Hashrate (in GH/s or TH/s)
    hashrate: data.hashrate || data.hash_rate || data.hash || 0,
    hashrateUnit: 'GH/s',
    
    // Power consumption (in watts)
    power: data.power || data.power_consumption || data.watts || 0,
    powerUnit: 'W',
    
    // Temperature (in Celsius)
    temperature: data.temperature || data.temp || data.t || 0,
    temperatureUnit: '°C',
    
    // Shares
    sharesAccepted: data.accepted || data.shares_accepted || data.accepted_shares || 0,
    sharesRejected: data.rejected || data.shares_rejected || data.rejected_shares || 0,
    
    // Difficulty
    difficulty: data.difficulty || data.diff || 0,
    bestDifficulty: data.best_difficulty || data.best_diff || data.difficulty || 0,
    
    // Session stats
    sessionAccepted: data.session_accepted || data.accepted || 0,
    sessionRejected: data.session_rejected || data.rejected || 0,
    
    // Efficiency (J/TH or W/TH)
    efficiency: calculateEfficiency(
      data.power || data.power_consumption || data.watts || 0,
      data.hashrate || data.hash_rate || data.hash || 0
    ),
    efficiencyUnit: 'J/TH',
    
    // Device info
    model: data.model || data.device_model || data.hardware || 'Bitaxe',
    deviceName: data.name || data.device_name || data.hostname || 'Bitaxe Device',
    firmware: data.firmware || data.version || data.fw_version || 'Unknown',
    
    // Status
    status: data.status || data.state || 'unknown',
    uptime: data.uptime || 0,
    
    // Raw data for debugging
    raw: data
  };
  
  return stats;
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
  
  // Convert hashrate to TH/s (assuming input is in GH/s)
  const hashrateTH = hashrate / 1000;
  
  if (hashrateTH === 0) {
    return 0;
  }
  
  // Efficiency = Power (W) / Hashrate (TH/s) = J/TH
  return power / hashrateTH;
}

module.exports = {
  fetchBitaxeStats
};
