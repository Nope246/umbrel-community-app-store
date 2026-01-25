import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import { NetworkScanner } from './services/NetworkScanner';
import { DeviceManager } from './services/DeviceManager';
import { Database } from './database/Database';
import { router as apiRouter } from './routes/api';
import { router as devicesRouter } from './routes/devices';
import { router as firmwareRouter } from './routes/firmware';
import { router as dashboardRouter } from './routes/dashboard';
import { FirmwareManager } from './services/FirmwareManager';
import { BitcoinPriceService } from './services/BitcoinPriceService';
import { MiningCalculator } from './services/MiningCalculator';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from frontend build
app.use(express.static(path.join(__dirname, '../public')));

// Initialize services
const db = new Database();
const networkScanner = new NetworkScanner();
const deviceManager = new DeviceManager(db);
const firmwareManager = new FirmwareManager();
const bitcoinService = new BitcoinPriceService();
const calculator = new MiningCalculator();

// API routes
app.use('/api', apiRouter);
app.use('/api/devices', devicesRouter(deviceManager, firmwareManager));
app.use('/api/firmware', firmwareRouter(firmwareManager));
app.use('/api/dashboard', dashboardRouter(deviceManager, db, bitcoinService, calculator));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Start periodic network scanning
const scanInterval = parseInt(process.env.SCAN_INTERVAL || '5', 10) * 60 * 1000;
setInterval(async () => {
  try {
    console.log('Starting periodic network scan...');
    const devices = await networkScanner.scanNetwork();
    await deviceManager.updateDevices(devices);
  } catch (error) {
    console.error('Error during periodic scan:', error);
  }
}, scanInterval);

// Periodic share statistics update (every 5 minutes)
setInterval(async () => {
  try {
    const devices = await deviceManager.getAllDevices();
    for (const device of devices) {
      const stats = await deviceManager.getDeviceStatistics(device.id);
      if (stats?.shares) {
        await db.saveShares(device.id, {
          shares: stats.shares.total || 1,
          approved: stats.shares.approved || 0,
          rejected: stats.shares.rejected || 0,
        });
      }
    }
  } catch (error) {
    console.error('Error updating share statistics:', error);
  }
}, 5 * 60 * 1000); // Every 5 minutes

// Initial scan on startup
(async () => {
  try {
    await db.initialize();
    console.log('Database initialized');
    
    const devices = await networkScanner.scanNetwork();
    await deviceManager.updateDevices(devices);
    console.log(`Initial scan complete. Found ${devices.length} devices`);
    
    app.listen(PORT, () => {
      console.log(`Miner Manager server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
})();

export default app;
