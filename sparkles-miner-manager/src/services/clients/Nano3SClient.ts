import axios, { AxiosInstance } from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import { DeviceStatistics, DeviceSettings, FirmwareUpdate } from '../../types/Device';

export class Nano3SClient {
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      timeout: 30000,
    });
  }

  /**
   * Get device statistics
   * Note: Nano3S has limited API access - this is a placeholder implementation
   */
  async getStatistics(ip: string): Promise<DeviceStatistics> {
    try {
      // Attempt to get statistics - actual endpoints may vary
      const response = await this.axiosInstance.get(`http://${ip}/api/statistics`);
      const data = response.data;

      return {
        hashrate: data.hashrate || data.hashRate,
        temperature: data.temperature || data.temp,
        fanSpeed: data.fanSpeed || data.fan,
        power: data.power || data.powerConsumption,
        uptime: data.uptime,
      };
    } catch (error) {
      // If API is not available, return partial data
      console.warn(`Nano3S API may not be available at ${ip}:`, error);
      return {
        hashrate: undefined,
        temperature: undefined,
        fanSpeed: undefined,
      };
    }
  }

  /**
   * Get device settings
   * Note: Nano3S settings may not be accessible via API
   */
  async getSettings(ip: string): Promise<DeviceSettings> {
    try {
      const response = await this.axiosInstance.get(`http://${ip}/api/settings`);
      const data = response.data;

      return {
        fanSpeed: data.fanSpeed,
        frequency: data.frequency,
        voltage: data.voltage,
      };
    } catch (error) {
      console.warn(`Nano3S settings API may not be available at ${ip}:`, error);
      return {};
    }
  }

  /**
   * Update device settings
   * Note: Nano3S may have limited or no support for remote settings changes
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

      await this.axiosInstance.patch(`http://${ip}/api/settings`, payload);
      return true;
    } catch (error) {
      console.error(`Error updating Nano3S settings (API may not be available):`, error);
      // Note: This may fail if Nano3S doesn't support remote settings changes
      return false;
    }
  }

  /**
   * Update firmware
   * Note: Nano3S firmware updates may require proprietary tools or physical access
   */
  async updateFirmware(ip: string, firmwarePath: string, type: 'firmware' | 'web' | 'both'): Promise<boolean> {
    // Nano3S firmware updates may not be possible via API
    // This would require proprietary tools or manufacturer-specific methods
    console.warn('Nano3S firmware updates via API may not be supported. Please check manufacturer documentation.');
    
    try {
      // Attempt firmware update if endpoint exists
      // This is a placeholder - actual implementation depends on available API
      const formData = new FormData();
      formData.append('firmware', fs.createReadStream(firmwarePath));

      await this.axiosInstance.post(`http://${ip}/api/firmware/update`, formData, {
        headers: formData.getHeaders(),
        timeout: 120000,
      });

      return true;
    } catch (error) {
      console.error(`Nano3S firmware update not available via API:`, error);
      return false;
    }
  }

  /**
   * Check for available updates
   */
  async checkForUpdates(ip: string, currentVersion?: string): Promise<FirmwareUpdate[]> {
    // Nano3S updates may need to be checked through manufacturer channels
    console.warn('Nano3S update checking may require manufacturer-specific methods');
    return [];
  }

  /**
   * Reboot the device
   */
  async reboot(ip: string): Promise<boolean> {
    try {
      await this.axiosInstance.post(`http://${ip}/api/system/reboot`);
      return true;
    } catch (error) {
      console.warn(`Nano3S reboot may not be available via API:`, error);
      return false;
    }
  }
}
