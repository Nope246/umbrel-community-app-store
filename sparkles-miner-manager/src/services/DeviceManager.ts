import { Database } from '../database/Database';
import { DeviceInfo, DeviceStatistics, DeviceSettings, FirmwareUpdate } from '../types/Device';
import { BitaxeClient } from './clients/BitaxeClient';
import { Nano3SClient } from './clients/Nano3SClient';

export class DeviceManager {
  private db: Database;
  private bitaxeClient: BitaxeClient;
  private nano3SClient: Nano3SClient;

  constructor(db: Database) {
    this.db = db;
    this.bitaxeClient = new BitaxeClient();
    this.nano3SClient = new Nano3SClient();
  }

  /**
   * Update the database with discovered devices
   */
  async updateDevices(devices: DeviceInfo[]): Promise<void> {
    for (const device of devices) {
      await this.db.upsertDevice(device);
    }
  }

  /**
   * Get all known devices
   */
  async getAllDevices(): Promise<DeviceInfo[]> {
    return await this.db.getAllDevices();
  }

  /**
   * Get a specific device by ID
   */
  async getDevice(id: string): Promise<DeviceInfo | null> {
    return await this.db.getDevice(id);
  }

  /**
   * Get device statistics
   */
  async getDeviceStatistics(id: string): Promise<DeviceStatistics | null> {
    const device = await this.db.getDevice(id);
    if (!device) return null;

    try {
      if (device.type === 'bitaxe') {
        return await this.bitaxeClient.getStatistics(device.ip);
      } else if (device.type === 'nano3s') {
        return await this.nano3SClient.getStatistics(device.ip);
      }
    } catch (error) {
      console.error(`Error getting statistics for device ${id}:`, error);
      return null;
    }

    return null;
  }

  /**
   * Get device settings
   */
  async getDeviceSettings(id: string): Promise<DeviceSettings | null> {
    const device = await this.db.getDevice(id);
    if (!device) return null;

    try {
      if (device.type === 'bitaxe') {
        return await this.bitaxeClient.getSettings(device.ip);
      } else if (device.type === 'nano3s') {
        return await this.nano3SClient.getSettings(device.ip);
      }
    } catch (error) {
      console.error(`Error getting settings for device ${id}:`, error);
      return null;
    }

    return null;
  }

  /**
   * Update device settings
   */
  async updateDeviceSettings(id: string, settings: DeviceSettings): Promise<boolean> {
    const device = await this.db.getDevice(id);
    if (!device) return false;

    try {
      if (device.type === 'bitaxe') {
        return await this.bitaxeClient.updateSettings(device.ip, settings);
      } else if (device.type === 'nano3s') {
        return await this.nano3SClient.updateSettings(device.ip, settings);
      }
    } catch (error) {
      console.error(`Error updating settings for device ${id}:`, error);
      return false;
    }

    return false;
  }

  /**
   * Update device firmware
   */
  async updateFirmware(id: string, firmwarePath: string, type: 'firmware' | 'web' | 'both'): Promise<boolean> {
    const device = await this.db.getDevice(id);
    if (!device) return false;

    try {
      if (device.type === 'bitaxe') {
        return await this.bitaxeClient.updateFirmware(device.ip, firmwarePath, type);
      } else if (device.type === 'nano3s') {
        return await this.nano3SClient.updateFirmware(device.ip, firmwarePath, type);
      }
    } catch (error) {
      console.error(`Error updating firmware for device ${id}:`, error);
      return false;
    }

    return false;
  }

  /**
   * Check for available firmware updates
   */
  async checkForUpdates(id: string): Promise<FirmwareUpdate[] | null> {
    const device = await this.db.getDevice(id);
    if (!device) return null;

    try {
      if (device.type === 'bitaxe') {
        return await this.bitaxeClient.checkForUpdates(device.ip, device.firmwareVersion);
      } else if (device.type === 'nano3s') {
        return await this.nano3SClient.checkForUpdates(device.ip, device.firmwareVersion);
      }
    } catch (error) {
      console.error(`Error checking for updates for device ${id}:`, error);
      return null;
    }

    return null;
  }

  /**
   * Reboot a device
   */
  async rebootDevice(id: string): Promise<boolean> {
    const device = await this.db.getDevice(id);
    if (!device) return false;

    try {
      if (device.type === 'bitaxe') {
        return await this.bitaxeClient.reboot(device.ip);
      } else if (device.type === 'nano3s') {
        return await this.nano3SClient.reboot(device.ip);
      }
    } catch (error) {
      console.error(`Error rebooting device ${id}:`, error);
      return false;
    }

    return false;
  }
}
