const BaseMiner = require('./base');

/**
 * NerdqAxe +/++ miner implementation
 */
class NerdqAxeMiner extends BaseMiner {
  constructor(config) {
    super(config);
  }
  
  async getStats() {
    try {
      // NerdqAxe API endpoint for stats
      const response = await this.makeRequest('/api/v1/stats');
      
      return {
        hashrate: this.normalizeHashrate(response.hashrate || 0, response.hashrate_unit || 'TH/s'),
        powerWatts: response.power || 0,
        sharesAccepted: response.accepted || 0,
        sharesRejected: response.rejected || 0,
        temperature: response.temp || null,
        uptime: response.uptime || 0,
        status: response.status || 'unknown'
      };
    } catch (error) {
      console.error(`Error fetching stats from NerdqAxe ${this.name}:`, error.message);
      throw error;
    }
  }
  
  async getDeviceInfo() {
    try {
      const response = await this.makeRequest('/api/v1/info');
      return {
        model: response.model || 'NerdqAxe',
        firmware: response.version || 'unknown',
        serial: response.serial || null
      };
    } catch (error) {
      console.error(`Error fetching device info from NerdqAxe ${this.name}:`, error.message);
      return null;
    }
  }
}

module.exports = NerdqAxeMiner;
