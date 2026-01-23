const express = require('express');
const { body, validationResult } = require('express-validator');
const database = require('../database');
const router = express.Router();

/**
 * GET /api/config
 * Get all configuration
 */
router.get('/', (req, res, next) => {
  const db = database.getDb();
  
  db.all('SELECT key, value FROM config', [], (err, rows) => {
    if (err) {
      return next(err);
    }
    
    const config = {};
    rows.forEach(row => {
      // Try to parse JSON values
      try {
        config[row.key] = JSON.parse(row.value);
      } catch (e) {
        config[row.key] = row.value;
      }
    });
    
    res.json(config);
  });
});

/**
 * GET /api/config/:key
 * Get a specific configuration value
 */
router.get('/:key', (req, res, next) => {
  const db = database.getDb();
  const key = req.params.key;
  
  db.get('SELECT value FROM config WHERE key = ?', [key], (err, row) => {
    if (err) {
      return next(err);
    }
    if (!row) {
      return res.status(404).json({ error: 'Configuration key not found' });
    }
    
    // Try to parse JSON
    try {
      res.json({ key, value: JSON.parse(row.value) });
    } catch (e) {
      res.json({ key, value: row.value });
    }
  });
});

/**
 * PUT /api/config/:key
 * Update a configuration value
 */
router.put('/:key', [
  body('value').notEmpty().withMessage('Value is required')
], (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  const db = database.getDb();
  const key = req.params.key;
  let value = req.body.value;
  
  // Convert objects/arrays to JSON strings
  if (typeof value === 'object') {
    value = JSON.stringify(value);
  } else {
    value = String(value);
  }
  
  db.run(
    'INSERT OR REPLACE INTO config (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)',
    [key, value],
    function(err) {
      if (err) {
        return next(err);
      }
      res.json({ key, message: 'Configuration updated successfully' });
    }
  );
});

/**
 * GET /api/config/electricity-rate
 * Get electricity rate (cost per kWh)
 */
router.get('/electricity-rate', (req, res, next) => {
  const db = database.getDb();
  
  db.get('SELECT value FROM config WHERE key = ?', ['electricity_rate'], (err, row) => {
    if (err) {
      return next(err);
    }
    
    const rate = row ? parseFloat(row.value) : 0;
    res.json({ electricity_rate: rate });
  });
});

/**
 * PUT /api/config/electricity-rate
 * Set electricity rate (cost per kWh)
 */
router.put('/electricity-rate', [
  body('electricity_rate').isFloat({ min: 0 }).withMessage('Electricity rate must be a positive number')
], (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  const db = database.getDb();
  const rate = parseFloat(req.body.electricity_rate);
  
  db.run(
    'INSERT OR REPLACE INTO config (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)',
    ['electricity_rate', rate.toString()],
    function(err) {
      if (err) {
        return next(err);
      }
      res.json({ electricity_rate: rate, message: 'Electricity rate updated successfully' });
    }
  );
});

module.exports = router;
