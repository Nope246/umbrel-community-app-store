export enum DeviceType {
  BITAXE = 'bitaxe',
  NANO3S = 'nano3s',
  UNKNOWN = 'unknown'
}

export enum DeviceStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  ERROR = 'error'
}

export interface DeviceInfo {
  id: string;
  type: DeviceType;
  ip: string;
  macAddress?: string;
  hostname?: string;
  status: DeviceStatus;
  firmwareVersion?: string;
  webVersion?: string;
  model?: string;
  lastSeen: Date;
  discoveredAt: Date;
}

export interface DeviceStatistics {
  hashrate?: number;
  temperature?: number;
  fanSpeed?: number;
  power?: number;
  uptime?: number;
  chips?: number;
  poolUrl?: string;
  minerAddress?: string;
  shares?: {
    total?: number;
    approved?: number;
    rejected?: number;
  };
}

export interface DeviceSettings {
  fanSpeed?: number;
  frequency?: number;
  voltage?: number;
  lights?: {
    enabled: boolean;
    color?: string;
    brightness?: number;
  };
  pool?: {
    url: string;
    user: string;
    password?: string;
  };
}

export interface FirmwareUpdate {
  version: string;
  url: string;
  type: 'firmware' | 'web' | 'both';
  changelog?: string;
  checksum?: string;
}
