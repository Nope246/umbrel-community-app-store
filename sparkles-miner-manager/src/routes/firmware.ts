import { Router, Request, Response } from 'express';
import multer from 'multer';
import { FirmwareManager } from '../services/FirmwareManager';

export const router = (firmwareManager: FirmwareManager): Router => {
  const router = Router();

  // Configure multer for memory storage
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 50 * 1024 * 1024, // 50MB limit
    },
    fileFilter: (req, file, cb) => {
      // Only accept .bin files
      if (file.originalname.endsWith('.bin') || file.originalname.endsWith('.BIN')) {
        cb(null, true);
      } else {
        cb(new Error('Only .bin files are allowed'));
      }
    },
  });

  /**
   * Upload firmware file
   */
  router.post('/upload', upload.single('firmware'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
      }

      const type = req.body.type || 'firmware'; // 'firmware' or 'web'
      if (type !== 'firmware' && type !== 'web') {
        return res.status(400).json({ success: false, message: 'Invalid type. Must be "firmware" or "web"' });
      }

      const firmwareFile = await firmwareManager.saveFirmware(req.file, type);
      res.json({ success: true, file: firmwareFile, message: 'Firmware uploaded successfully' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * List all firmware files
   */
  router.get('/list', async (req: Request, res: Response) => {
    try {
      const type = req.query.type as 'firmware' | 'web' | undefined;
      const files = await firmwareManager.listFirmwareFiles(type);
      res.json({ success: true, files });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * Get firmware file info
   */
  router.get('/:filename', async (req: Request, res: Response) => {
    try {
      const file = await firmwareManager.getFirmwareFile(req.params.filename);
      
      if (file) {
        res.json({ success: true, file });
      } else {
        res.status(404).json({ success: false, message: 'Firmware file not found' });
      }
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * Delete firmware file
   */
  router.delete('/:filename', async (req: Request, res: Response) => {
    try {
      const success = await firmwareManager.deleteFirmwareFile(req.params.filename);
      
      if (success) {
        res.json({ success: true, message: 'Firmware file deleted' });
      } else {
        res.status(404).json({ success: false, message: 'Firmware file not found' });
      }
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  return router;
};
