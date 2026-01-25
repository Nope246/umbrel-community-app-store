import { Router } from 'express';
import { NetworkScanner } from '../services/NetworkScanner';

export const router = Router();
const networkScanner = new NetworkScanner();

/**
 * Trigger manual network scan
 */
router.post('/scan', async (req, res) => {
  try {
    const devices = await networkScanner.scanNetwork();
    res.json({ success: true, devices, count: devices.length });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Scan specific IP
 */
router.post('/scan/:ip', async (req, res) => {
  try {
    const { ip } = req.params;
    const device = await networkScanner.scanIP(ip);
    
    if (device) {
      res.json({ success: true, device });
    } else {
      res.status(404).json({ success: false, message: 'Device not found' });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});
