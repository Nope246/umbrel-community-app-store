import axios, { AxiosInstance } from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import { DeviceStatistics, DeviceSettings, FirmwareUpdate } from '../../types/Device';

export class BitaxeClient {
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      timeout: 30000, // Longer timeout for operations
    });
  }

  /**
   * Get device statistics
   */
  async getStatistics(ip: string): Promise<DeviceStatistics> {
    const response = await this.axiosInstance.get(`http://${ip}/api/system/statistics`);
    const data = response.data;

    return {
      hashrate: data.hashrate || data.hashRate,
      temperature: data.temperature || data.temp,
      fanSpeed: data.fanSpeed || data.fan,
      power: data.power || data.powerConsumption,
      uptime: data.uptime,
      chips: data.chips || data.chipCount,
      poolUrl: data.pool?.url,
      minerAddress: data.pool?.user,
      shares: data.shares ? {
        total: data.shares.total || data.shares.accepted + (data.shares.rejected || 0),
        approved: data.shares.accepted || data.shares.approved,
        rejected: data.shares.rejected || 0,
      } : undefined,
    };
  }

  /**
   * Get device settings
   */
  async getSettings(ip: string): Promise<DeviceSettings> {
    const response = await this.axiosInstance.get(`http://${ip}/api/system/settings`);
    const data = response.data;

    return {
      fanSpeed: data.fanSpeed,
      frequency: data.frequency || data.asicFrequency,
      voltage: data.voltage || data.asicVoltage,
      lights: data.lights ? {
        enabled: data.lights.enabled,
        color: data.lights.color,
        brightness: data.lights.brightness,
      } : undefined,
      pool: data.pool ? {
        url: data.pool.url,
        user: data.pool.user,
        password: data.pool.password,
      } : undefined,
    };
  }

  /**
   * Update device settings
   */
  async updateSettings(ip: string, settings: DeviceSettings): Promise<boolean> {
    try {
      const payload: any = {};

      if (settings.fanSpeed !== undefined) {
        payload.fanSpeed = settings.fanSpeed;
      }
      if (settings.frequency !== undefined) {
        payload.frequency = settings.frequency;
      }
      if (settings.voltage !== undefined) {
        payload.voltage = settings.voltage;
      }
      if (settings.lights !== undefined) {
        payload.lights = settings.lights;
      }
      if (settings.pool !== undefined) {
        payload.pool = settings.pool;
      }

      await this.axiosInstance.patch(`http://${ip}/api/system/settings`, payload);
      return true;
    } catch (error) {
      console.error(`Error updating Bitaxe settings:`, error);
      return false;
    }
  }

  /**
   * Update firmware or web UI
   */
  async updateFirmware(ip: string, firmwarePath: string, type: 'firmware' | 'web' | 'both'): Promise<boolean> {
    try {
      if (!fs.existsSync(firmwarePath)) {
        throw new Error(`Firmware file not found: ${firmwarePath}`);
      }

      const formData = new FormData();
      formData.append('file', fs.createReadStream(firmwarePath));

      if (type === 'firmware' || type === 'both') {
        await this.axiosInstance.post(`http://${ip}/api/system/OTA`, formData, {
          headers: formData.getHeaders(),
          timeout: 120000, // 2 minutes for firmware upload
        });
      }

      if (type === 'web' || type === 'both') {
        await this.axiosInstance.post(`http://${ip}/api/system/OTAWWW`, formData, {
          headers: formData.getHeaders(),
          timeout: 120000,
        });
      }

      return true;
    } catch (error) {
      console.error(`Error updating Bitaxe firmware:`, error);
      return false;
    }
  }

  /**
   * Check for available updates
   * This would typically check against a repository or API
   */
  async checkForUpdates(ip: string, currentVersion?: string): Promise<FirmwareUpdate[]> {
    try {
      // Get current device info
      const infoResponse = await this.axiosInstance.get(`http://${ip}/api/system/info`);
      const currentFirmware = infoResponse.data.firmwareVersion || currentVersion;

      // In a real implementation, this would check against:
      // - GitHub releases for Bitaxe firmware
      // - An update API
      // - A firmware repository

      // Placeholder - you would implement actual update checking here
      const updates: FirmwareUpdate[] = [];

      // Example: Check if there's a newer version available
      // This is a simplified example - actual implementation would fetch from repository

      return updates;
    } catch (error) {
      console.error(`Error checking for Bitaxe updates:`, error);
      return [];
    }
  }

  /**
   * Reboot the device
   */
  async reboot(ip: string): Promise<boolean> {
    try {
      await this.axiosInstance.post(`http://${ip}/api/system/reboot`);
      return true;
    } catch (error) {
      // Device may not respond immediately after reboot
      console.log(`Bitaxe device ${ip} reboot initiated`);
      return true;
    }
  }
}
