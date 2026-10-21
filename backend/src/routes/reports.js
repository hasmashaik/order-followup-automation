const express = require('express');
const router = express.Router();
const db = require('../db');
const Papa = require('papaparse');

router.get('/daily.csv', async (req, res, next) => {
  try {
    
    const newExceptions = await db.query(
      `SELECT * FROM tasks WHERE created_at >= NOW() - INTERVAL '24 hours'`
    );
    const unresolved = await db.query(
      `SELECT * FROM tasks WHERE is_resolved = FALSE`
    );
    const overdue = await db.query(
      `SELECT * FROM tasks WHERE status <> 'Resolved' AND deadline < NOW()`
    );
    const highPriority = await db.query(
      `SELECT * FROM tasks WHERE priority = 'High' AND status <> 'Resolved'`
    );
    const perEmployee = await db.query(
      `SELECT assigned_employee, COUNT(*)::int AS pending
       FROM tasks WHERE status <> 'Resolved'
       GROUP BY assigned_employee ORDER BY pending DESC`
    );

    const rows = [];
    const push = (tag, t) => rows.push({
      section: tag,
      order_id: t.order_id,
      exception_type: t.exception_type,
      priority: t.priority,
      status: t.status,
      assigned_employee: t.assigned_employee,
      deadline: t.deadline,
      reason: t.reason,
    });

    newExceptions.rows.forEach((t) => push('NEW_EXCEPTION', t));
    unresolved.rows.forEach((t) => push('UNRESOLVED', t));
    overdue.rows.forEach((t) => push('OVERDUE', t));
    highPriority.rows.forEach((t) => push('HIGH_PRIORITY', t));

    const csv = Papa.unparse(rows);
    const employeeCsv = Papa.unparse(perEmployee.rows);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=daily_exception_report_${new Date()
        .toISOString()
        .slice(0, 10)}.csv`
    );
    res.send(`${csv}\n\nEMPLOYEE_WISE_PENDING\n${employeeCsv}`);
  } catch (err) { next(err); }
});

module.exports = router;