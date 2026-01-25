import axios, { AxiosInstance } from 'axios';

export interface BitcoinPrice {
  usd: number;
  btc: number;
  change24h: number;
  changePercent24h: number;
  lastUpdated: Date;
}

export interface BitcoinStats {
  difficulty: number;
  blockHeight: number;
  blockReward: number;
  hashRate: number; // Network hash rate in TH/s
  blocksUntilHalving: number;
  nextHalvingDate: Date;
}

export class BitcoinPriceService {
  private axiosInstance: AxiosInstance;
  private cache: BitcoinPrice | null = null;
  private statsCache: BitcoinStats | null = null;
  private cacheExpiry = 60000; // 1 minute cache
  private statsCacheExpiry = 300000; // 5 minutes cache
  private lastPriceUpdate: number = 0;
  private lastStatsUpdate: number = 0;

  constructor() {
    this.axiosInstance = axios.create({
      timeout: 10000,
    });
  }

  /**
   * Get current Bitcoin price from CoinGecko API
   */
  async getBitcoinPrice(): Promise<BitcoinPrice> {
    const now = Date.now();
    
    // Return cached price if still valid
    if (this.cache && (now - this.lastPriceUpdate) < this.cacheExpiry) {
      return this.cache;
    }

    try {
      // Use CoinGecko API (free tier)
      const response = await this.axiosInstance.get(
        'https://api.coingecko.com/api/v3/simple/price',
        {
          params: {
            ids: 'bitcoin',
            vs_currencies: 'usd',
            include_24hr_change: true,
            include_24hr_vol: false,
            include_last_updated_at: true,
          },
        }
      );

      const data = response.data.bitcoin;
      const price: BitcoinPrice = {
        usd: data.usd,
        btc: 1, // 1 BTC = 1 BTC
        change24h: data.usd_24h_change || 0,
        changePercent24h: data.usd_24h_change || 0,
        lastUpdated: new Date(data.last_updated_at * 1000),
      };

      this.cache = price;
      this.lastPriceUpdate = now;
      return price;
    } catch (error) {
      console.error('Error fetching Bitcoin price:', error);
      
      // Return cached price if available, even if expired
      if (this.cache) {
        return this.cache;
      }

      // Fallback price if API fails
      throw new Error('Failed to fetch Bitcoin price');
    }
  }

  /**
   * Get Bitcoin network statistics
   */
  async getBitcoinStats(): Promise<BitcoinStats> {
    const now = Date.now();
    
    // Return cached stats if still valid
    if (this.statsCache && (now - this.lastStatsUpdate) < this.statsCacheExpiry) {
      return this.statsCache;
    }

    try {
      // Get difficulty and block info
      const difficultyResponse = await this.axiosInstance.get(
        'https://blockstream.info/api/stats'
      );

      const stats = difficultyResponse.data;
      
      // Calculate blocks until halving (halving happens every 210,000 blocks)
      const currentHeight = stats.counts?.block_count || 0;
      const nextHalving = Math.ceil((currentHeight + 1) / 210000) * 210000;
      const blocksUntilHalving = nextHalving - currentHeight;

      // Estimate next halving date (blocks are mined ~10 minutes apart)
      const minutesUntilHalving = blocksUntilHalving * 10;
      const nextHalvingDate = new Date(Date.now() + minutesUntilHalving * 60000);

      // Current block reward (starts at 50, halves every 210k blocks)
      const halvings = Math.floor(currentHeight / 210000);
      const blockReward = 50 / Math.pow(2, halvings);

      const bitcoinStats: BitcoinStats = {
        difficulty: stats.difficulty || 0,
        blockHeight: currentHeight,
        blockReward,
        hashRate: this.estimateNetworkHashRate(stats.difficulty || 0),
        blocksUntilHalving,
        nextHalvingDate,
      };

      this.statsCache = bitcoinStats;
      this.lastStatsUpdate = now;
      return bitcoinStats;
    } catch (error) {
      console.error('Error fetching Bitcoin stats:', error);
      
      // Return cached stats if available
      if (this.statsCache) {
        return this.statsCache;
      }

      // Fallback stats
      throw new Error('Failed to fetch Bitcoin network stats');
    }
  }

  /**
   * Estimate network hash rate from difficulty
   * Difficulty * 2^32 / 600 seconds ≈ hash rate
   */
  private estimateNetworkHashRate(difficulty: number): number {
    // Convert to TH/s (tera hashes per second)
    const hashRate = (difficulty * Math.pow(2, 32)) / 600;
    return hashRate / 1e12; // Convert to TH/s
  }

  /**
   * Get both price and stats in one call
   */
  async getBitcoinData(): Promise<{ price: BitcoinPrice; stats: BitcoinStats }> {
    const [price, stats] = await Promise.all([
      this.getBitcoinPrice(),
      this.getBitcoinStats(),
    ]);

    return { price, stats };
  }
}
