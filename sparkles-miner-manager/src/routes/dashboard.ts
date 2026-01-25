import { Router, Request, Response } from 'express';
import { DeviceManager } from '../services/DeviceManager';
import { BitcoinPriceService } from '../services/BitcoinPriceService';
import { MiningCalculator } from '../services/MiningCalculator';
import { Database } from '../database/Database';

export const router = (
  deviceManager: DeviceManager,
  db: Database,
  bitcoinService: BitcoinPriceService,
  calculator: MiningCalculator
): Router => {
  const router = Router();

  /**
   * Get dashboard data with all aggregated statistics
   */
  router.get('/', async (req: Request, res: Response) => {
    try {
      // Get all devices and their statistics
      const devices = await deviceManager.getAllDevices();
      const deviceStatsPromises = devices.map(device => 
        deviceManager.getDeviceStatistics(device.id).catch(() => null)
      );
      const deviceStatsResults = await Promise.all(deviceStatsPromises);
      const deviceStats = deviceStatsResults.filter(stats => stats !== null);

      // Get Bitcoin price and network stats
      const { price, stats: bitcoinStats } = await bitcoinService.getBitcoinData();

      // Calculate aggregate mining stats
      const miningStats = calculator.aggregateStats(deviceStats);

      // Calculate block estimate
      const blockEstimate = calculator.calculateBlockEstimate(
        miningStats.totalHashRate,
        bitcoinStats.difficulty
      );

      // Calculate profitability
      const profitability = calculator.calculateProfitability(
        miningStats.totalHashRate,
        miningStats.totalPower,
        price.usd,
        bitcoinStats
      );

      // Get share statistics (all time, today, this month, this year)
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const yearStart = new Date(now.getFullYear(), 0, 1);

      const [allTimeShares, todayShares, monthShares, yearShares] = await Promise.all([
        db.getShareStats(),
        db.getShareStats(undefined, todayStart),
        db.getShareStats(undefined, monthStart),
        db.getShareStats(undefined, yearStart),
      ]);

      // Calculate aggregate statistics from database
      const aggregateStats = await db.getAggregateStats();

      res.json({
        success: true,
        dashboard: {
          bitcoin: {
            price: price.usd,
            priceChange24h: price.changePercent24h,
            lastUpdated: price.lastUpdated,
            network: {
              difficulty: bitcoinStats.difficulty,
              blockHeight: bitcoinStats.blockHeight,
              blockReward: bitcoinStats.blockReward,
              hashRate: bitcoinStats.hashRate,
              blocksUntilHalving: bitcoinStats.blocksUntilHalving,
              nextHalvingDate: bitcoinStats.nextHalvingDate,
            },
          },
          mining: {
            ...miningStats,
            averageTemperature: aggregateStats.averageTemperature,
          },
          shares: {
            allTime: allTimeShares,
            today: todayShares,
            thisMonth: monthShares,
            thisYear: yearShares,
          },
          blockEstimate,
          profitability,
          devices: devices.map((device, index) => ({
            ...device,
            statistics: deviceStats[index] || null,
          })),
        },
      });
    } catch (error: any) {
      console.error('Error getting dashboard data:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  return router;
};
