import { Router, Request, Response } from 'express';
import { DeviceManager } from '../services/DeviceManager';
import { FirmwareManager } from '../services/FirmwareManager';

export const router = (deviceManager: DeviceManager, firmwareManager?: FirmwareManager): Router => {
  const router = Router();

  /**
   * Get all devices
   */
  router.get('/', async (req: Request, res: Response) => {
    try {
      const devices = await deviceManager.getAllDevices();
      res.json({ success: true, devices });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * Get device by ID
   */
  router.get('/:id', async (req: Request, res: Response) => {
    try {
      const device = await deviceManager.getDevice(req.params.id);
      
      if (device) {
        res.json({ success: true, device });
      } else {
        res.status(404).json({ success: false, message: 'Device not found' });
      }
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * Get device statistics
   */
  router.get('/:id/statistics', async (req: Request, res: Response) => {
    try {
      const statistics = await deviceManager.getDeviceStatistics(req.params.id);
      
      if (statistics) {
        res.json({ success: true, statistics });
      } else {
        res.status(404).json({ success: false, message: 'Device not found or statistics unavailable' });
      }
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * Get device settings
   */
  router.get('/:id/settings', async (req: Request, res: Response) => {
    try {
      const settings = await deviceManager.getDeviceSettings(req.params.id);
      
      if (settings) {
        res.json({ success: true, settings });
      } else {
        res.status(404).json({ success: false, message: 'Device not found or settings unavailable' });
      }
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * Update device settings
   */
  router.patch('/:id/settings', async (req: Request, res: Response) => {
    try {
      const success = await deviceManager.updateDeviceSettings(req.params.id, req.body);
      
      if (success) {
        res.json({ success: true, message: 'Settings updated' });
      } else {
        res.status(400).json({ success: false, message: 'Failed to update settings' });
      }
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * Check for firmware updates
   */
  router.get('/:id/updates', async (req: Request, res: Response) => {
    try {
      const updates = await deviceManager.checkForUpdates(req.params.id);
      
      if (updates !== null) {
        res.json({ success: true, updates });
      } else {
        res.status(404).json({ success: false, message: 'Device not found' });
      }
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * Update device firmware
   */
  router.post('/:id/firmware/update', async (req: Request, res: Response) => {
    try {
      const { firmwarePath, filename, type } = req.body;
      
      // Support both firmwarePath (direct path) and filename (from uploaded files)
      let finalPath = firmwarePath;
      
      if (!finalPath && filename && firmwareManager) {
        // If filename provided, use firmware manager to get full path
        const firmwareFile = await firmwareManager.getFirmwareFile(filename);
        
        if (!firmwareFile) {
          return res.status(404).json({ success: false, message: 'Firmware file not found' });
        }
        
        finalPath = firmwareFile.path;
      }
      
      if (!finalPath || !type) {
        return res.status(400).json({ success: false, message: 'Missing firmwarePath/filename or type' });
      }

      const success = await deviceManager.updateFirmware(req.params.id, finalPath, type);
      
      if (success) {
        res.json({ success: true, message: 'Firmware update initiated' });
      } else {
        res.status(400).json({ success: false, message: 'Failed to update firmware' });
      }
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * Reboot device
   */
  router.post('/:id/reboot', async (req: Request, res: Response) => {
    try {
      const success = await deviceManager.rebootDevice(req.params.id);
      
      if (success) {
        res.json({ success: true, message: 'Device reboot initiated' });
      } else {
        res.status(400).json({ success: false, message: 'Failed to reboot device' });
      }
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  return router;
};
