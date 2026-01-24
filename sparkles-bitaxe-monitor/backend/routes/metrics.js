const express = require('express');
const { query, param, validationResult } = require('express-validator');
const database = require('../database');
const router = express.Router();

/**
 * GET /api/metrics
 * Get metrics for all miners or specific miner
 * Query params: miner_id (optional), hours (default: 4, max: 4)
 */
router.get('/', [
  query('miner_id').optional().isInt().withMessage('Invalid miner ID'),
  query('hours').optional().isFloat({ min: 0.1, max: 4 }).withMessage('Hours must be between 0.1 and 4')
], (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  const db = database.getDb();
  const hours = parseFloat(req.query.hours) || 4;
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
  
  let query = 'SELECT m.*, mn.name as miner_name, mn.type as miner_type FROM metrics m JOIN miners mn ON m.miner_id = mn.id WHERE m.timestamp >= ?';
  const params = [since];
  
  if (req.query.miner_id) {
    query += ' AND m.miner_id = ?';
    params.push(parseInt(req.query.miner_id));
  }
  
  query += ' ORDER BY m.timestamp DESC';
  
  db.all(query, params, (err, rows) => {
    if (err) {
      return next(err);
    }
    res.json(rows);
  });
});

/**
 * GET /api/metrics/summary
 * Get summary statistics for all miners
 */
router.get('/summary', [
  query('hours').optional().isFloat({ min: 0.1, max: 4 }).withMessage('Hours must be between 0.1 and 4')
], (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  const db = database.getDb();
  const hours = parseFloat(req.query.hours) || 4;
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
  
  // Get totals
  db.get(
    `SELECT 
      SUM(hashrate) as total_hashrate,
      SUM(power_watts) as total_power,
      SUM(shares_accepted) as total_shares_accepted,
      SUM(shares_rejected) as total_shares_rejected,
      AVG(temperature) as avg_temperature,
      COUNT(DISTINCT miner_id) as miner_count
    FROM metrics 
    WHERE timestamp >= ?`,
    [since],
    (err, totals) => {
      if (err) {
        return next(err);
      }
      
      // Get per-miner summaries
      db.all(
        `SELECT 
          m.miner_id,
          mn.name as miner_name,
          mn.type as miner_type,
          AVG(m.hashrate) as avg_hashrate,
          MAX(m.hashrate) as max_hashrate,
          AVG(m.power_watts) as avg_power,
          SUM(m.shares_accepted) as shares_accepted,
          SUM(m.shares_rejected) as shares_rejected,
          AVG(m.temperature) as avg_temperature
        FROM metrics m
        JOIN miners mn ON m.miner_id = mn.id
        WHERE m.timestamp >= ?
        GROUP BY m.miner_id, mn.name, mn.type
        ORDER BY mn.name`,
        [since],
        (err, perMiner) => {
          if (err) {
            return next(err);
          }
          
          res.json({
            totals: totals || {
              total_hashrate: 0,
              total_power: 0,
              total_shares_accepted: 0,
              total_shares_rejected: 0,
              avg_temperature: null,
              miner_count: 0
            },
            perMiner: perMiner || []
          });
        }
      );
    }
  );
});

/**
 * GET /api/metrics/latest
 * Get latest metrics for all miners
 */
router.get('/latest', (req, res, next) => {
  const db = database.getDb();
  
  db.all(
    `SELECT m1.*, mn.name as miner_name, mn.type as miner_type
    FROM metrics m1
    JOIN miners mn ON m1.miner_id = mn.id
    INNER JOIN (
      SELECT miner_id, MAX(timestamp) as max_timestamp
      FROM metrics
      GROUP BY miner_id
    ) m2 ON m1.miner_id = m2.miner_id AND m1.timestamp = m2.max_timestamp
    ORDER BY mn.name`,
    [],
    (err, rows) => {
      if (err) {
        return next(err);
      }
      res.json(rows);
    }
  );
});

/**
 * GET /api/metrics/:minerId
 * Get metrics for a specific miner
 */
router.get('/:minerId', [
  param('minerId').isInt().withMessage('Invalid miner ID'),
  query('hours').optional().isFloat({ min: 0.1, max: 4 }).withMessage('Hours must be between 0.1 and 4')
], (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  const db = database.getDb();
  const minerId = parseInt(req.params.minerId);
  const hours = parseFloat(req.query.hours) || 4;
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
  
  db.all(
    'SELECT * FROM metrics WHERE miner_id = ? AND timestamp >= ? ORDER BY timestamp DESC',
    [minerId, since],
    (err, rows) => {
      if (err) {
        return next(err);
      }
      res.json(rows);
    }
  );
});

module.exports = router;
