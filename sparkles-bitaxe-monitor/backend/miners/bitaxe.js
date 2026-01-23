const BaseMiner = require('./base');

/**
 * Bitaxe Gamma 601/602 miner implementation
 */
class BitaxeMiner extends BaseMiner {
  constructor(config) {
    super(config);
  }
  
  async getStats() {
    try {
      // Bitaxe API endpoint for stats
      const response = await this.makeRequest('/api/stats');
      
      return {
        hashrate: this.normalizeHashrate(response.hashrate || 0, response.hashrate_unit || 'TH/s'),
        powerWatts: response.power_watts || 0,
        sharesAccepted: response.shares_accepted || 0,
        sharesRejected: response.shares_rejected || 0,
        temperature: response.temperature || null,
        uptime: response.uptime || 0,
        status: response.status || 'unknown'
      };
    } catch (error) {
      console.error(`Error fetching stats from Bitaxe ${this.name}:`, error.message);
      throw error;
    }
  }
  
  async getDeviceInfo() {
    try {
      const response = await this.makeRequest('/api/device');
      return {
        model: response.model || 'Bitaxe Gamma',
        firmware: response.firmware || 'unknown',
        serial: response.serial || null
      };
    } catch (error) {
      console.error(`Error fetching device info from Bitaxe ${this.name}:`, error.message);
      return null;
    }
  }
}

module.exports = BitaxeMiner;
