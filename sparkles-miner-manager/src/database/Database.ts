import sqlite3 from 'sqlite3';
import path from 'path';
import { DeviceInfo, DeviceType, DeviceStatus } from '../types/Device';

export class Database {
  private db: sqlite3.Database;

  constructor() {
    const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'devices.db');
    this.db = new sqlite3.Database(dbPath);
  }

  /**
   * Initialize database tables
   */
  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        // Devices table
        this.db.run(`
          CREATE TABLE IF NOT EXISTS devices (
            id TEXT PRIMARY KEY,
            type TEXT NOT NULL,
            ip TEXT NOT NULL,
            macAddress TEXT,
            hostname TEXT,
            status TEXT NOT NULL,
            firmwareVersion TEXT,
            webVersion TEXT,
            model TEXT,
            lastSeen INTEGER NOT NULL,
            discoveredAt INTEGER NOT NULL,
            UNIQUE(ip, type)
          )
        `, (err) => {
          if (err) reject(err);
        });

        // Device statistics history table
        this.db.run(`
          CREATE TABLE IF NOT EXISTS device_statistics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            deviceId TEXT NOT NULL,
            timestamp INTEGER NOT NULL,
            hashrate REAL,
            temperature REAL,
            fanSpeed REAL,
            power REAL,
            FOREIGN KEY(deviceId) REFERENCES devices(id)
          )
        `, (err) => {
          if (err) reject(err);
        });

        // Create indexes
        this.db.run(`CREATE INDEX IF NOT EXISTS idx_device_lastSeen ON devices(lastSeen)`, (err) => {
          if (err) reject(err);
        });

        this.db.run(`CREATE INDEX IF NOT EXISTS idx_stats_device_timestamp ON device_statistics(deviceId, timestamp)`, (err) => {
          if (err) reject(err);
        });

        // Device shares table for tracking approved/rejected shares
        this.db.run(`
          CREATE TABLE IF NOT EXISTS device_shares (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            deviceId TEXT NOT NULL,
            timestamp INTEGER NOT NULL,
            shares INTEGER NOT NULL DEFAULT 1,
            approved INTEGER NOT NULL DEFAULT 0,
            rejected INTEGER NOT NULL DEFAULT 0,
            FOREIGN KEY(deviceId) REFERENCES devices(id)
          )
        `, (err) => {
          if (err) reject(err);
        });

        // Create index for shares
        this.db.run(`CREATE INDEX IF NOT EXISTS idx_shares_device_timestamp ON device_shares(deviceId, timestamp)`, (err) => {
          if (err) reject(err);
        });

        resolve();
      });
    });
  }

  /**
   * Upsert (insert or update) a device
   */
  async upsertDevice(device: DeviceInfo): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(`
        INSERT OR REPLACE INTO devices (
          id, type, ip, macAddress, hostname, status, firmwareVersion,
          webVersion, model, lastSeen, discoveredAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        device.id,
        device.type,
        device.ip,
        device.macAddress || null,
        device.hostname || null,
        device.status,
        device.firmwareVersion || null,
        device.webVersion || null,
        device.model || null,
        device.lastSeen.getTime(),
        device.discoveredAt.getTime(),
      ], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  /**
   * Get all devices
   */
  async getAllDevices(): Promise<DeviceInfo[]> {
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT * FROM devices ORDER BY lastSeen DESC
      `, [], (err, rows: any[]) => {
        if (err) {
          reject(err);
          return;
        }

        const devices = rows.map(row => ({
          id: row.id,
          type: row.type as DeviceType,
          ip: row.ip,
          macAddress: row.macAddress,
          hostname: row.hostname,
          status: row.status as DeviceStatus,
          firmwareVersion: row.firmwareVersion,
          webVersion: row.webVersion,
          model: row.model,
          lastSeen: new Date(row.lastSeen),
          discoveredAt: new Date(row.discoveredAt),
        }));

        resolve(devices);
      });
    });
  }

  /**
   * Get a device by ID
   */
  async getDevice(id: string): Promise<DeviceInfo | null> {
    return new Promise((resolve, reject) => {
      this.db.get(`
        SELECT * FROM devices WHERE id = ?
      `, [id], (err, row: any) => {
        if (err) {
          reject(err);
          return;
        }

        if (!row) {
          resolve(null);
          return;
        }

        resolve({
          id: row.id,
          type: row.type as DeviceType,
          ip: row.ip,
          macAddress: row.macAddress,
          hostname: row.hostname,
          status: row.status as DeviceStatus,
          firmwareVersion: row.firmwareVersion,
          webVersion: row.webVersion,
          model: row.model,
          lastSeen: new Date(row.lastSeen),
          discoveredAt: new Date(row.discoveredAt),
        });
      });
    });
  }

  /**
   * Save device statistics
   */
  async saveStatistics(deviceId: string, stats: {
    hashrate?: number;
    temperature?: number;
    fanSpeed?: number;
    power?: number;
  }): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(`
        INSERT INTO device_statistics (deviceId, timestamp, hashrate, temperature, fanSpeed, power)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        deviceId,
        Date.now(),
        stats.hashrate || null,
        stats.temperature || null,
        stats.fanSpeed || null,
        stats.power || null,
      ], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  /**
   * Save share statistics for a device
   */
  async saveShares(deviceId: string, shares: {
    shares?: number;
    approved?: number;
    rejected?: number;
  }): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(`
        INSERT INTO device_shares (deviceId, timestamp, shares, approved, rejected)
        VALUES (?, ?, ?, ?, ?)
      `, [
        deviceId,
        Date.now(),
        shares.shares || 1,
        shares.approved || 0,
        shares.rejected || 0,
      ], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  /**
   * Get share statistics for a device (total, approved, rejected)
   */
  async getShareStats(deviceId?: string, startDate?: Date, endDate?: Date): Promise<{
    total: number;
    approved: number;
    rejected: number;
  }> {
    return new Promise((resolve, reject) => {
      let query = `
        SELECT 
          COALESCE(SUM(shares), 0) as total,
          COALESCE(SUM(approved), 0) as approved,
          COALESCE(SUM(rejected), 0) as rejected
        FROM device_shares
        WHERE 1=1
      `;
      const params: any[] = [];

      if (deviceId) {
        query += ' AND deviceId = ?';
        params.push(deviceId);
      }

      if (startDate) {
        query += ' AND timestamp >= ?';
        params.push(startDate.getTime());
      }

      if (endDate) {
        query += ' AND timestamp <= ?';
        params.push(endDate.getTime());
      }

      this.db.get(query, params, (err, row: any) => {
        if (err) {
          reject(err);
          return;
        }

        resolve({
          total: row.total || 0,
          approved: row.approved || 0,
          rejected: row.rejected || 0,
        });
      });
    });
  }

  /**
   * Get aggregate statistics for all devices
   */
  async getAggregateStats(startDate?: Date, endDate?: Date): Promise<{
    totalHashRate: number;
    totalPower: number;
    averageTemperature: number;
    totalShares: number;
    approvedShares: number;
    rejectedShares: number;
  }> {
    return new Promise((resolve, reject) => {
      // Get latest statistics from each device
      const query = `
        SELECT ds.*, d.type
        FROM device_statistics ds
        INNER JOIN (
          SELECT deviceId, MAX(timestamp) as maxTimestamp
          FROM device_statistics
          GROUP BY deviceId
        ) latest ON ds.deviceId = latest.deviceId AND ds.timestamp = latest.maxTimestamp
        INNER JOIN devices d ON ds.deviceId = d.id
      `;

      this.db.all(query, [], async (err, rows: any[]) => {
        if (err) {
          reject(err);
          return;
        }

        const totalHashRate = rows.reduce((sum, row) => sum + (row.hashrate || 0), 0);
        const totalPower = rows.reduce((sum, row) => sum + (row.power || 0), 0);
        const temps = rows.filter(row => row.temperature).map(row => row.temperature);
        const averageTemperature = temps.length > 0
          ? temps.reduce((sum, temp) => sum + temp, 0) / temps.length
          : 0;

        // Get share statistics
        const shareStats = await this.getShareStats(undefined, startDate, endDate);

        resolve({
          totalHashRate,
          totalPower,
          averageTemperature,
          totalShares: shareStats.total,
          approvedShares: shareStats.approved,
          rejectedShares: shareStats.rejected,
        });
      });
    });
  }

  /**
   * Close database connection
   */
  close(): void {
    this.db.close();
  }
}
