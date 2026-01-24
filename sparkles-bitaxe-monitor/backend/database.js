const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

let db = null;

const initialize = async (dataDir) => {
  return new Promise((resolve, reject) => {
    const dbPath = path.join(dataDir, 'bitaxe_monitor.db');
    
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        reject(err);
        return;
      }
      
      // Enable WAL mode for better concurrency
      db.run('PRAGMA journal_mode = WAL;', (err) => {
        if (err) {
          reject(err);
          return;
        }
        
        // Create tables
        db.serialize(() => {
          // Miners table
          db.run(`CREATE TABLE IF NOT EXISTS miners (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            type TEXT NOT NULL,
            ip_address TEXT NOT NULL,
            port INTEGER NOT NULL,
            api_key TEXT,
            enabled INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(ip_address, port)
          )`);
          
          // Metrics table - stores time-series data
          db.run(`CREATE TABLE IF NOT EXISTS metrics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            miner_id INTEGER NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            hashrate REAL,
            power_watts REAL,
            shares_accepted INTEGER,
            shares_rejected INTEGER,
            temperature REAL,
            FOREIGN KEY (miner_id) REFERENCES miners(id)
          )`);
          
          // Create index for efficient queries
          db.run(`CREATE INDEX IF NOT EXISTS idx_miner_timestamp ON metrics(miner_id, timestamp)`);
          
          // Configuration table
          db.run(`CREATE TABLE IF NOT EXISTS config (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )`);
          
          // Create index for efficient time-based queries
          db.run(`CREATE INDEX IF NOT EXISTS idx_timestamp ON metrics(timestamp)`, (err) => {
            if (err) {
              reject(err);
              return;
            }
            
            // Cleanup old data (older than 4 hours)
            cleanupOldData();
            // Set up periodic cleanup (every hour)
            setInterval(cleanupOldData, 60 * 60 * 1000);
            
            resolve();
          });
        });
      });
    });
  });
};

const cleanupOldData = () => {
  const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();
  db.run('DELETE FROM metrics WHERE timestamp < ?', [fourHoursAgo], (err) => {
    if (err) {
      console.error('Error cleaning up old data:', err);
    } else {
      console.log('Cleaned up data older than 4 hours');
    }
  });
};

const getDb = () => {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
};

const close = () => {
  return new Promise((resolve, reject) => {
    if (db) {
      db.close((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    } else {
      resolve();
    }
  });
};

module.exports = {
  initialize,
  getDb,
  close,
  cleanupOldData
};
