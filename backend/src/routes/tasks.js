const express = require('express');
const router = express.Router();
const db = require('../db');
const { updateTaskStatus, reassignTask } = require('../services/taskService');

router.get('/', async (req, res, next) => {
  try {
    const { status, priority, employee, exception_type, from, to } = req.query;
    const clauses = [];
    const params = [];
    let i = 1;

    if (status) { clauses.push(`status = $${i++}`); params.push(status); }
    if (priority) { clauses.push(`priority = $${i++}`); params.push(priority); }
    if (employee) { clauses.push(`assigned_employee = $${i++}`); params.push(employee); }
    if (exception_type) { clauses.push(`exception_type = $${i++}`); params.push(exception_type); }
    if (from) { clauses.push(`created_at >= $${i++}`); params.push(from); }
    if (to) { clauses.push(`created_at <= $${i++}`); params.push(to); }

    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const result = await db.query(
      `SELECT * FROM tasks ${where} ORDER BY 
         CASE priority WHEN 'High' THEN 1 WHEN 'Medium' THEN 2 ELSE 3 END,
         deadline ASC NULLS LAST`,
      params
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Database error in /tasks:", err); // Log it to terminal
    next(err); 
  }
});

router.patch('/:id/status', async (req, res, next) => {
  try {
    const { status, performed_by } = req.body;
    if (!['Open', 'In Progress', 'Resolved'].includes(status))
      return res.status(400).json({ error: 'Invalid status' });
    const updated = await updateTaskStatus(req.params.id, status, performed_by);
    res.json(updated);
  } catch (err) { next(err); }
});

router.patch('/:id/reassign', async (req, res, next) => {
  try {
    const { assigned_employee, performed_by } = req.body;
    if (!assigned_employee) return res.status(400).json({ error: 'assigned_employee required' });
    const updated = await reassignTask(req.params.id, assigned_employee, performed_by);
    res.json(updated);
  } catch (err) { next(err); }
});

module.exports = router;