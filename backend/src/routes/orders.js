const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const { importOrders } = require('../services/importService');
const db = require('../db');

const uploadDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) =>
    cb(null, `${Date.now()}_${file.originalname.replace(/\s+/g, '_')}`),
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = /\.(csv|xlsx|xls)$/i.test(file.originalname);
    cb(ok ? null : new Error('Only CSV/XLSX/XLS files are allowed'), ok);
  },
});

router.post('/upload', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const summary = await importOrders(req.file.path, req.body.uploaded_by || 'manager');
    res.json({ ok: true, ...summary });
  } catch (err) {
    next(err);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const { batch } = req.query;
    const sql = batch
      ? 'SELECT * FROM orders WHERE upload_batch = $1 ORDER BY id DESC'
      : 'SELECT * FROM orders ORDER BY id DESC LIMIT 500';
    const result = await db.query(sql, batch ? [batch] : []);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

module.exports = router;