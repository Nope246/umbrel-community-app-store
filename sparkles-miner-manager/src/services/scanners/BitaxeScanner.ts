import axios, { AxiosInstance } from 'axios';
import { DeviceInfo, DeviceType, DeviceStatus } from '../../types/Device';

export class BitaxeScanner {
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      timeout: 3000, // 3 second timeout for detection
    });
  }

  /**
   * Detect if a device at the given IP is a Bitaxe miner
   */
  async detect(ip: string): Promise<DeviceInfo | null> {
    try {
      // Try to access Bitaxe API endpoints
      const infoResponse = await this.axiosInstance.get(
        `http://${ip}/api/system/info`,
        { timeout: 2000 }
      );

      if (infoResponse.data && infoResponse.data.chipModel) {
        // This is a Bitaxe device
        const info = infoResponse.data;
        
        return {
          id: `bitaxe-${ip}`,
          type: DeviceType.BITAXE,
          ip: ip,
          hostname: info.hostname || `bitaxe-${ip}`,
          status: DeviceStatus.ONLINE,
          firmwareVersion: info.firmwareVersion || info.version,
          webVersion: info.webVersion,
          model: info.chipModel || 'Bitaxe',
          lastSeen: new Date(),
          discoveredAt: new Date(),
        };
      }

      return null;
    } catch (error: any) {
      // Device not reachable or not a Bitaxe
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        return null;
      }
      
      // Other errors might indicate the device exists but isn't a Bitaxe
      return null;
    }
  }

  /**
   * Get full device information including statistics
   */
  async getDeviceInfo(ip: string): Promise<any> {
    try {
      const [infoResponse, statsResponse] = await Promise.all([
        this.axiosInstance.get(`http://${ip}/api/system/info`),
        this.axiosInstance.get(`http://${ip}/api/system/statistics`).catch(() => null),
      ]);

      return {
        info: infoResponse.data,
        statistics: statsResponse?.data || null,
      };
    } catch (error) {
      throw new Error(`Failed to get Bitaxe device info from ${ip}: ${error}`);
    }
  }
}
