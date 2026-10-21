const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res, next) => {
  try {
    const { order_id } = req.query;
    const sql = order_id
      ? 'SELECT * FROM audit_records WHERE order_id = $1 ORDER BY created_at DESC LIMIT 500'
      : 'SELECT * FROM audit_records ORDER BY created_at DESC LIMIT 500';
    const result = await db.query(sql, order_id ? [order_id] : []);
    res.json(result.rows);
  } catch (err) { next(err); }
});

module.exports = router;