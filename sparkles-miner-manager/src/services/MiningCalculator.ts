import { DeviceStatistics } from '../types/Device';
import { BitcoinStats } from './BitcoinPriceService';

export interface MiningStats {
  totalHashRate: number; // Total hash rate in TH/s
  totalPower: number; // Total power consumption in W
  deviceCount: number;
  activeDevices: number;
}

export interface ShareStats {
  total: number;
  approved: number;
  rejected: number;
  rejectedRate: number; // Percentage
}

export interface BlockEstimate {
  estimatedDays: number;
  estimatedHours: number;
  probability: number; // Probability of finding a block in 24h
  estimatedDate: Date;
}

export interface ProfitabilityStats {
  dailyBTC: number;
  dailyUSD: number;
  monthlyBTC: number;
  monthlyUSD: number;
  yearlyBTC: number;
  yearlyUSD: number;
  powerCostDailyUSD: number; // Assumes $0.10/kWh
  powerCostMonthlyUSD: number;
  powerCostYearlyUSD: number;
  profitDailyUSD: number;
  profitMonthlyUSD: number;
  profitYearlyUSD: number;
}

export class MiningCalculator {
  /**
   * Calculate block finding estimate based on hash rate
   */
  calculateBlockEstimate(
    totalHashRate: number, // in TH/s
    networkDifficulty: number
  ): BlockEstimate {
    if (totalHashRate === 0 || networkDifficulty === 0) {
      return {
        estimatedDays: Infinity,
        estimatedHours: Infinity,
        probability: 0,
        estimatedDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      };
    }

    // Convert TH/s to hashes per second
    const hashesPerSecond = totalHashRate * 1e12;

    // Expected number of hashes to find a block
    // difficulty * 2^32 ≈ expected hashes per block
    const expectedHashes = networkDifficulty * Math.pow(2, 32);

    // Time to find a block in seconds
    const secondsToBlock = expectedHashes / hashesPerSecond;

    const estimatedDays = secondsToBlock / 86400;
    const estimatedHours = secondsToBlock / 3600;

    // Probability of finding a block in 24 hours
    // Using Poisson distribution approximation
    const hashesIn24h = hashesPerSecond * 86400;
    const probability = 1 - Math.exp(-hashesIn24h / expectedHashes);

    const estimatedDate = new Date(Date.now() + secondsToBlock * 1000);

    return {
      estimatedDays,
      estimatedHours,
      probability: Math.min(probability * 100, 100), // Convert to percentage
      estimatedDate,
    };
  }

  /**
   * Calculate profitability based on hash rate and Bitcoin stats
   */
  calculateProfitability(
    totalHashRate: number, // in TH/s
    totalPower: number, // in W
    bitcoinPrice: number, // USD per BTC
    bitcoinStats: BitcoinStats,
    powerCostPerKWh: number = 0.10 // Default $0.10/kWh
  ): ProfitabilityStats {
    if (totalHashRate === 0) {
      return {
        dailyBTC: 0,
        dailyUSD: 0,
        monthlyBTC: 0,
        monthlyUSD: 0,
        yearlyBTC: 0,
        yearlyUSD: 0,
        powerCostDailyUSD: 0,
        powerCostMonthlyUSD: 0,
        powerCostYearlyUSD: 0,
        profitDailyUSD: 0,
        profitMonthlyUSD: 0,
        profitYearlyUSD: 0,
      };
    }

    // Convert TH/s to hashes per second
    const hashesPerSecond = totalHashRate * 1e12;

    // Network hash rate in hashes per second
    const networkHashesPerSecond = bitcoinStats.hashRate * 1e12;

    // Your share of the network
    const networkShare = hashesPerSecond / networkHashesPerSecond;

    // Blocks per day (144 blocks per day on average)
    const blocksPerDay = 144;

    // Your expected share of blocks
    const expectedBlocksPerDay = blocksPerDay * networkShare;

    // BTC per day
    const dailyBTC = expectedBlocksPerDay * bitcoinStats.blockReward;

    // USD values
    const dailyUSD = dailyBTC * bitcoinPrice;
    const monthlyBTC = dailyBTC * 30;
    const monthlyUSD = dailyUSD * 30;
    const yearlyBTC = dailyBTC * 365;
    const yearlyUSD = dailyUSD * 365;

    // Power costs
    const powerKW = totalPower / 1000; // Convert W to kW
    const powerCostDailyUSD = powerKW * 24 * powerCostPerKWh;
    const powerCostMonthlyUSD = powerCostDailyUSD * 30;
    const powerCostYearlyUSD = powerCostDailyUSD * 365;

    // Profit
    const profitDailyUSD = dailyUSD - powerCostDailyUSD;
    const profitMonthlyUSD = monthlyUSD - powerCostMonthlyUSD;
    const profitYearlyUSD = yearlyUSD - powerCostYearlyUSD;

    return {
      dailyBTC,
      dailyUSD,
      monthlyBTC,
      monthlyUSD,
      yearlyBTC,
      yearlyUSD,
      powerCostDailyUSD,
      powerCostMonthlyUSD,
      powerCostYearlyUSD,
      profitDailyUSD,
      profitMonthlyUSD,
      profitYearlyUSD,
    };
  }

  /**
   * Aggregate statistics from multiple devices
   */
  aggregateStats(deviceStats: DeviceStatistics[]): MiningStats {
    const totalHashRate = deviceStats.reduce((sum, stats) => sum + (stats.hashrate || 0), 0);
    const totalPower = deviceStats.reduce((sum, stats) => sum + (stats.power || 0), 0);
    const activeDevices = deviceStats.filter(stats => stats.hashrate && stats.hashrate > 0).length;

    return {
      totalHashRate,
      totalPower,
      deviceCount: deviceStats.length,
      activeDevices,
    };
  }
}
