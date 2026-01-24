const database = require('../database');

const BitaxeMiner = require('./bitaxe');
const NerdqAxeMiner = require('./nerdaxe');
const Nano3SMiner = require('./nano3s');

let collectionInterval = null;
const COLLECTION_INTERVAL = 30000; // 30 seconds

const minerInstances = new Map();

/**
 * Create miner instance based on type
 */
function createMinerInstance(minerConfig) {
  const { type } = minerConfig;
  
  switch (type.toLowerCase()) {
    case 'bitaxe':
    case 'bitaxe-gamma-601':
    case 'bitaxe-gamma-602':
      return new BitaxeMiner(minerConfig);
    case 'nerdaxe':
    case 'nerdaxe+':
    case 'nerdaxe++':
      return new NerdqAxeMiner(minerConfig);
    case 'nano3s':
    case 'nano3s-cgminer':
      return new Nano3SMiner(minerConfig);
    default:
      throw new Error(`Unknown miner type: ${type}`);
  }
}

/**
 * Load miners from database and create instances
 */
async function loadMiners() {
  return new Promise((resolve, reject) => {
    const db = database.getDb();
    
    db.all('SELECT * FROM miners WHERE enabled = 1', [], (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      
      minerInstances.clear();
      
      rows.forEach(row => {
        try {
          const miner = createMinerInstance(row);
          minerInstances.set(row.id, miner);
        } catch (error) {
          console.error(`Failed to create miner instance for ${row.name}:`, error.message);
        }
      });
      
      console.log(`Loaded ${minerInstances.size} enabled miners`);
      resolve();
    });
  });
}

/**
 * Collect data from a single miner
 */
async function collectMinerData(minerId, miner) {
  try {
    const stats = await miner.getStats();
    
    // Store in database
    const db = database.getDb();
    db.run(
      `INSERT INTO metrics (miner_id, timestamp, hashrate, power_watts, shares_accepted, shares_rejected, temperature)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        minerId,
        new Date().toISOString(),
        stats.hashrate,
        stats.powerWatts,
        stats.sharesAccepted,
        stats.sharesRejected,
        stats.temperature
      ],
      (err) => {
        if (err) {
          console.error(`Error storing metrics for miner ${minerId}:`, err);
        }
      }
    );
    
    return stats;
  } catch (error) {
    console.error(`Error collecting data from miner ${minerId} (${miner.name}):`, error.message);
    return null;
  }
}

/**
 * Collect data from all miners
 */
async function collectAllMinersData() {
  if (minerInstances.size === 0) {
    await loadMiners();
  }
  
  const promises = [];
  for (const [minerId, miner] of minerInstances.entries()) {
    promises.push(collectMinerData(minerId, miner));
  }
  
  await Promise.allSettled(promises);
}

/**
 * Start the data collection service
 */
function start(dataDir) {
  console.log('Starting miner data collection service...');
  
  // Load miners initially
  loadMiners().then(() => {
    // Start periodic collection
    collectionInterval = setInterval(() => {
      collectAllMinersData();
    }, COLLECTION_INTERVAL);
    
    // Collect immediately
    collectAllMinersData();
    
    // Reload miners every 5 minutes (in case of config changes)
    setInterval(() => {
      loadMiners();
    }, 5 * 60 * 1000);
  }).catch(err => {
    console.error('Failed to start collector:', err);
  });
}

/**
 * Stop the data collection service
 */
function stop() {
  if (collectionInterval) {
    clearInterval(collectionInterval);
    collectionInterval = null;
  }
  minerInstances.clear();
}

/**
 * Get current miner instances (for testing/debugging)
 */
function getMinerInstances() {
  return minerInstances;
}

module.exports = {
  start,
  stop,
  loadMiners,
  collectAllMinersData,
  getMinerInstances
};
