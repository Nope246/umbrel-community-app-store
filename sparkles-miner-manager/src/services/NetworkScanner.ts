import axios, { AxiosInstance } from 'axios';
import * as os from 'os';
import { DeviceInfo, DeviceType } from '../types/Device';
import { BitaxeScanner } from './scanners/BitaxeScanner';
import { Nano3SScanner } from './scanners/Nano3SScanner';

export class NetworkScanner {
  private bitaxeScanner: BitaxeScanner;
  private nano3SScanner: Nano3SScanner;
  private networkRange: string;

  constructor() {
    this.bitaxeScanner = new BitaxeScanner();
    this.nano3SScanner = new Nano3SScanner();
    this.networkRange = process.env.SCAN_NETWORK_RANGE || this.getDefaultNetworkRange();
  }

  /**
   * Get the default network range based on the host's network interface
   */
  private getDefaultNetworkRange(): string {
    const interfaces = os.networkInterfaces();
    
    for (const name of Object.keys(interfaces)) {
      const iface = interfaces[name];
      if (!iface) continue;

      for (const addr of iface) {
        // Skip internal and non-IPv4 addresses
        if (addr.family !== 'IPv4' || addr.internal) continue;

        // Extract network base (assuming /24 subnet)
        const parts = addr.address.split('.');
        parts[3] = '0';
        return `${parts.join('.')}/24`;
      }
    }

    return '192.168.1.0/24'; // Fallback
  }

  /**
   * Generate list of IPs to scan from network range
   */
  private generateIPList(range: string): string[] {
    const [base, prefix] = range.split('/');
    const prefixLength = parseInt(prefix || '24', 10);
    
    if (prefixLength === 24) {
      const parts = base.split('.');
      const ips: string[] = [];
      
      for (let i = 1; i < 255; i++) {
        parts[3] = i.toString();
        ips.push(parts.join('.'));
      }
      
      return ips;
    }

    // For other prefix lengths, implement CIDR calculation if needed
    return [];
  }

  /**
   * Check if an IP is reachable and what type of device it is
   */
  private async probeDevice(ip: string): Promise<DeviceInfo | null> {
    try {
      // Try Bitaxe detection first
      const bitaxeInfo = await this.bitaxeScanner.detect(ip);
      if (bitaxeInfo) {
        return bitaxeInfo;
      }

      // Try Nano3S detection
      const nano3SInfo = await this.nano3SScanner.detect(ip);
      if (nano3SInfo) {
        return nano3SInfo;
      }

      return null;
    } catch (error) {
      // Device not reachable or doesn't match any known type
      return null;
    }
  }

  /**
   * Scan the network for mining devices
   */
  async scanNetwork(): Promise<DeviceInfo[]> {
    console.log(`Scanning network range: ${this.networkRange}`);
    const ips = this.generateIPList(this.networkRange);
    const devices: DeviceInfo[] = [];
    const concurrency = 20; // Scan up to 20 IPs concurrently

    // Scan in batches to avoid overwhelming the network
    for (let i = 0; i < ips.length; i += concurrency) {
      const batch = ips.slice(i, i + concurrency);
      const results = await Promise.allSettled(
        batch.map(ip => this.probeDevice(ip))
      );

      for (const result of results) {
        if (result.status === 'fulfilled' && result.value) {
          devices.push(result.value);
        }
      }
    }

    console.log(`Scan complete. Found ${devices.length} devices`);
    return devices;
  }

  /**
   * Manually trigger a scan for a specific IP
   */
  async scanIP(ip: string): Promise<DeviceInfo | null> {
    return await this.probeDevice(ip);
  }
}
