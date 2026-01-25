import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface FirmwareFile {
  filename: string;
  originalName: string;
  path: string;
  size: number;
  uploadDate: Date;
  type: 'firmware' | 'web';
  version?: string;
  checksum: string;
}

export class FirmwareManager {
  private firmwareDir: string;

  constructor() {
    this.firmwareDir = process.env.FIRMWARE_DIR || path.join(process.cwd(), 'firmware');
    this.ensureDirectory();
  }

  private ensureDirectory(): void {
    if (!fs.existsSync(this.firmwareDir)) {
      fs.mkdirSync(this.firmwareDir, { recursive: true });
    }
  }

  /**
   * Save uploaded firmware file
   */
  async saveFirmware(file: Express.Multer.File, type: 'firmware' | 'web'): Promise<FirmwareFile> {
    const filename = `${Date.now()}-${file.originalname}`;
    const filepath = path.join(this.firmwareDir, filename);

    // Save file
    fs.writeFileSync(filepath, file.buffer);

    // Calculate checksum
    const fileBuffer = fs.readFileSync(filepath);
    const checksum = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    // Get file size
    const stats = fs.statSync(filepath);

    const firmwareFile: FirmwareFile = {
      filename,
      originalName: file.originalname,
      path: filepath,
      size: stats.size,
      uploadDate: new Date(),
      type,
      checksum,
    };

    // Try to extract version from filename (e.g., esp-miner-v1.0.0.bin)
    const versionMatch = file.originalname.match(/v?(\d+\.\d+\.\d+)/i);
    if (versionMatch) {
      firmwareFile.version = versionMatch[1];
    }

    return firmwareFile;
  }

  /**
   * Get all uploaded firmware files
   */
  async listFirmwareFiles(type?: 'firmware' | 'web'): Promise<FirmwareFile[]> {
    const files: FirmwareFile[] = [];

    if (!fs.existsSync(this.firmwareDir)) {
      return files;
    }

    const filenames = fs.readdirSync(this.firmwareDir);

    for (const filename of filenames) {
      const filepath = path.join(this.firmwareDir, filename);
      const stats = fs.statSync(filepath);

      if (stats.isFile() && (filename.endsWith('.bin') || filename.endsWith('.BIN'))) {
        // Determine type from filename or extension
        let fileType: 'firmware' | 'web' = 'firmware';
        if (filename.toLowerCase().includes('web') || filename.toLowerCase().includes('www')) {
          fileType = 'web';
        }

        // Filter by type if specified
        if (type && fileType !== type) {
          continue;
        }

        // Calculate checksum
        const fileBuffer = fs.readFileSync(filepath);
        const checksum = crypto.createHash('sha256').update(fileBuffer).digest('hex');

        // Try to extract version from filename
        let version: string | undefined;
        const versionMatch = filename.match(/v?(\d+\.\d+\.\d+)/i);
        if (versionMatch) {
          version = versionMatch[1];
        }

        files.push({
          filename,
          originalName: filename.replace(/^\d+-/, ''), // Remove timestamp prefix
          path: filepath,
          size: stats.size,
          uploadDate: new Date(stats.birthtime),
          type: fileType,
          version,
          checksum,
        });
      }
    }

    // Sort by upload date (newest first)
    return files.sort((a, b) => b.uploadDate.getTime() - a.uploadDate.getTime());
  }

  /**
   * Get firmware file info
   */
  async getFirmwareFile(filename: string): Promise<FirmwareFile | null> {
    const filepath = path.join(this.firmwareDir, filename);

    if (!fs.existsSync(filepath)) {
      return null;
    }

    const stats = fs.statSync(filepath);
    const fileBuffer = fs.readFileSync(filepath);
    const checksum = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    let fileType: 'firmware' | 'web' = 'firmware';
    if (filename.toLowerCase().includes('web') || filename.toLowerCase().includes('www')) {
      fileType = 'web';
    }

    let version: string | undefined;
    const versionMatch = filename.match(/v?(\d+\.\d+\.\d+)/i);
    if (versionMatch) {
      version = versionMatch[1];
    }

    return {
      filename,
      originalName: filename.replace(/^\d+-/, ''),
      path: filepath,
      size: stats.size,
      uploadDate: new Date(stats.birthtime),
      type: fileType,
      version,
      checksum,
    };
  }

  /**
   * Delete firmware file
   */
  async deleteFirmwareFile(filename: string): Promise<boolean> {
    try {
      const filepath = path.join(this.firmwareDir, filename);
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Error deleting firmware file ${filename}:`, error);
      return false;
    }
  }

  /**
   * Get firmware directory path
   */
  getFirmwareDir(): string {
    return this.firmwareDir;
  }
}
