const axios = require('axios');

/**
 * Base miner class - provides common functionality
 * All miner implementations should extend this class
 */
class BaseMiner {
  constructor(config) {
    this.id = config.id;
    this.name = config.name;
    this.type = config.type;
    this.ipAddress = config.ip_address;
    this.port = config.port;
    this.apiKey = config.api_key || null;
    this.timeout = 5000; // 5 second timeout
  }
  
  /**
   * Validate IP address format
   */
  validateIP(ip) {
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipRegex.test(ip);
  }
  
  /**
   * Make HTTP request to miner
   * READ-ONLY operations only
   */
  async makeRequest(endpoint, method = 'GET', data = null) {
    if (!this.validateIP(this.ipAddress)) {
      throw new Error(`Invalid IP address: ${this.ipAddress}`);
    }
    
    const url = `http://${this.ipAddress}:${this.port}${endpoint}`;
    const config = {
      method,
      url,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
      }
    };
    
    if (this.apiKey) {
      config.headers['Authorization'] = `Bearer ${this.apiKey}`;
    }
    
    if (data && method !== 'GET') {
      config.data = data;
    }
    
    try {
      const response = await axios(config);
      return response.data;
    } catch (error) {
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        throw new Error(`Cannot connect to miner at ${this.ipAddress}:${this.port}`);
      }
      throw error;
    }
  }
  
  /**
   * Get miner stats - must be implemented by subclasses
   */
  async getStats() {
    throw new Error('getStats() must be implemented by miner subclass');
  }
  
  /**
   * Normalize hashrate to TH/s
   */
  normalizeHashrate(hashrate, unit = 'TH/s') {
    if (typeof hashrate !== 'number') {
      return 0;
    }
    
    const units = {
      'H/s': 1e-12,
      'KH/s': 1e-9,
      'MH/s': 1e-6,
      'GH/s': 1e-3,
      'TH/s': 1,
      'PH/s': 1e3
    };
    
    const multiplier = units[unit] || 1;
    return hashrate * multiplier;
  }
}

module.exports = BaseMiner;
