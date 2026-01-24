const express = require('express');
const { body, validationResult, param } = require('express-validator');
const database = require('../database');
const router = express.Router();

/**
 * GET /api/miners
 * Get all miners
 */
router.get('/', (req, res, next) => {
  const db = database.getDb();
  
  db.all('SELECT id, name, type, ip_address, port, enabled, created_at, updated_at FROM miners ORDER BY name', [], (err, rows) => {
    if (err) {
      return next(err);
    }
    res.json(rows);
  });
});

/**
 * GET /api/miners/:id
 * Get a specific miner
 */
router.get('/:id', [
  param('id').isInt().withMessage('Invalid miner ID')
], (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  const db = database.getDb();
  const minerId = parseInt(req.params.id);
  
  db.get('SELECT id, name, type, ip_address, port, enabled, created_at, updated_at FROM miners WHERE id = ?', [minerId], (err, row) => {
    if (err) {
      return next(err);
    }
    if (!row) {
      return res.status(404).json({ error: 'Miner not found' });
    }
    res.json(row);
  });
});

/**
 * POST /api/miners
 * Create a new miner (READ-ONLY - no write operations to miners)
 */
router.post('/', [
  body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Name is required (max 100 chars)'),
  body('type').isIn(['bitaxe', 'bitaxe-gamma-601', 'bitaxe-gamma-602', 'nerdaxe', 'nerdaxe+', 'nerdaxe++', 'nano3s', 'nano3s-cgminer']).withMessage('Invalid miner type'),
  body('ip_address').matches(/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/).withMessage('Invalid IP address'),
  body('port').isInt({ min: 1, max: 65535 }).withMessage('Port must be between 1 and 65535'),
  body('api_key').optional().trim().isLength({ max: 500 }).withMessage('API key too long')
], (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  const db = database.getDb();
  const { name, type, ip_address, port, api_key } = req.body;
  
  db.run(
    'INSERT INTO miners (name, type, ip_address, port, api_key) VALUES (?, ?, ?, ?, ?)',
    [name, type, ip_address, port, api_key || null],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint')) {
          return res.status(409).json({ error: 'Miner with this IP and port already exists' });
        }
        return next(err);
      }
      
      // Reload miners in collector
      const collector = require('../miners/collector');
      collector.loadMiners();
      
      res.status(201).json({ id: this.lastID, name, type, ip_address, port });
    }
  );
});

/**
 * PUT /api/miners/:id
 * Update a miner
 */
router.put('/:id', [
  param('id').isInt().withMessage('Invalid miner ID'),
  body('name').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Name must be 1-100 chars'),
  body('type').optional().isIn(['bitaxe', 'bitaxe-gamma-601', 'bitaxe-gamma-602', 'nerdaxe', 'nerdaxe+', 'nerdaxe++', 'nano3s', 'nano3s-cgminer']).withMessage('Invalid miner type'),
  body('ip_address').optional().matches(/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/).withMessage('Invalid IP address'),
  body('port').optional().isInt({ min: 1, max: 65535 }).withMessage('Port must be between 1 and 65535'),
  body('enabled').optional().isBoolean().withMessage('Enabled must be boolean'),
  body('api_key').optional().trim().isLength({ max: 500 }).withMessage('API key too long')
], (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  const db = database.getDb();
  const minerId = parseInt(req.params.id);
  const updates = [];
  const values = [];
  
  const allowedFields = ['name', 'type', 'ip_address', 'port', 'enabled', 'api_key'];
  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      updates.push(`${field} = ?`);
      values.push(req.body[field]);
    }
  });
  
  if (updates.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }
  
  updates.push('updated_at = CURRENT_TIMESTAMP');
  values.push(minerId);
  
  db.run(
    `UPDATE miners SET ${updates.join(', ')} WHERE id = ?`,
    values,
    function(err) {
      if (err) {
        return next(err);
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Miner not found' });
      }
      
      // Reload miners in collector
      const collector = require('../miners/collector');
      collector.loadMiners();
      
      res.json({ message: 'Miner updated successfully' });
    }
  );
});

/**
 * DELETE /api/miners/:id
 * Delete a miner
 */
router.delete('/:id', [
  param('id').isInt().withMessage('Invalid miner ID')
], (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  const db = database.getDb();
  const minerId = parseInt(req.params.id);
  
  db.run('DELETE FROM miners WHERE id = ?', [minerId], function(err) {
    if (err) {
      return next(err);
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Miner not found' });
    }
    
    // Also delete associated metrics
    db.run('DELETE FROM metrics WHERE miner_id = ?', [minerId], (err) => {
      if (err) {
        console.error('Error deleting miner metrics:', err);
      }
    });
    
    // Reload miners in collector
    const collector = require('../miners/collector');
    collector.loadMiners();
    
    res.json({ message: 'Miner deleted successfully' });
  });
});

module.exports = router;
