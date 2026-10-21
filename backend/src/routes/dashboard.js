const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res, next) => {
  try {
    const totalOrders = await db.query('SELECT COUNT(*)::int AS c FROM orders');

    const requiringAttention = await db.query(
      `SELECT COUNT(DISTINCT order_id)::int AS c FROM tasks WHERE is_resolved = FALSE`
    );

    const openTasks = await db.query(
      `SELECT COUNT(*)::int AS c FROM tasks WHERE status = 'Open'`
    );

    const overdueTasks = await db.query(
      `SELECT COUNT(*)::int AS c FROM tasks
       WHERE status <> 'Resolved' AND deadline < NOW()`
    );

    const byCategory = await db.query(
      `SELECT exception_type, COUNT(*)::int AS count
       FROM tasks WHERE is_resolved = FALSE GROUP BY exception_type`
    );

    const byEmployee = await db.query(
      `SELECT assigned_employee, COUNT(*)::int AS pending
       FROM tasks WHERE status <> 'Resolved'
       GROUP BY assigned_employee ORDER BY pending DESC`
    );

    const highPriority = await db.query(
      `SELECT * FROM tasks
       WHERE priority = 'High' AND status <> 'Resolved'
       ORDER BY deadline ASC LIMIT 50`
    );

    res.json({
      totals: {
        totalOrders: totalOrders.rows[0].c,
        ordersRequiringAttention: requiringAttention.rows[0].c,
        openTasks: openTasks.rows[0].c,
        overdueTasks: overdueTasks.rows[0].c,
      },
      exceptionsByCategory: byCategory.rows,
      employeePending: byEmployee.rows,
      highPriorityCases: highPriority.rows,
    });
  } catch (err) { next(err); }
});

module.exports = router;