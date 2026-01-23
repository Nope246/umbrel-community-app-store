const BaseMiner = require('./base');

/**
 * nano3S miner implementation (cgminer framework)
 */
class Nano3SMiner extends BaseMiner {
  constructor(config) {
    super(config);
  }
  
  async getStats() {
    try {
      // cgminer API uses JSON-RPC format
      const response = await this.makeRequest('/', 'POST', {
        command: 'summary',
        parameter: ''
      });
      
      // Parse cgminer response format
      const summary = response.SUMMARY && response.SUMMARY[0] ? response.SUMMARY[0] : {};
      
      return {
        hashrate: this.normalizeHashrate(parseFloat(summary['GHS 5s'] || 0) * 1000, 'GH/s'), // Convert GH/s to TH/s
        powerWatts: parseFloat(summary['Power'] || 0),
        sharesAccepted: parseInt(summary['Accepted'] || 0),
        sharesRejected: parseInt(summary['Rejected'] || 0),
        temperature: parseFloat(summary['Temperature'] || null),
        uptime: parseInt(summary['Elapsed'] || 0),
        status: summary['Status'] || 'unknown'
      };
    } catch (error) {
      console.error(`Error fetching stats from nano3S ${this.name}:`, error.message);
      throw error;
    }
  }
  
  async getDeviceInfo() {
    try {
      const response = await this.makeRequest('/', 'POST', {
        command: 'devs',
        parameter: ''
      });
      
      if (response.DEVS && response.DEVS.length > 0) {
        const dev = response.DEVS[0];
        return {
          model: dev['Name'] || 'nano3S',
          firmware: dev['Driver'] || 'cgminer',
          serial: dev['Serial'] || null
        };
      }
      return null;
    } catch (error) {
      console.error(`Error fetching device info from nano3S ${this.name}:`, error.message);
      return null;
    }
  }
}

module.exports = Nano3SMiner;
