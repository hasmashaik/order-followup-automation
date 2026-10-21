const db = require('../db');

async function updateTaskStatus(taskId, newStatus, performedBy = 'manager') {
  const current = await db.query('SELECT * FROM tasks WHERE id = $1', [taskId]);
  if (current.rowCount === 0) throw new Error('Task not found');
  const task = current.rows[0];

  const isResolved = newStatus === 'Resolved';
  const updated = await db.query(
    `UPDATE tasks
     SET status = $1, is_resolved = $2, resolved_at = $3, updated_at = NOW()
     WHERE id = $4 RETURNING *`,
    [newStatus, isResolved, isResolved ? new Date() : null, taskId]
  );

  await db.query(
    `INSERT INTO audit_records (order_id, task_id, action, from_value, to_value, performed_by)
     VALUES ($1,$2,'STATUS_CHANGE',$3,$4,$5)`,
    [task.order_id, taskId, task.status, newStatus, performedBy]
  );
  return updated.rows[0];
}

async function reassignTask(taskId, newEmployee, performedBy = 'manager') {
  const current = await db.query('SELECT * FROM tasks WHERE id = $1', [taskId]);
  if (current.rowCount === 0) throw new Error('Task not found');
  const task = current.rows[0];

  const updated = await db.query(
    `UPDATE tasks SET assigned_employee = $1, updated_at = NOW()
     WHERE id = $2 RETURNING *`,
    [newEmployee, taskId]
  );

  await db.query(
    `INSERT INTO audit_records (order_id, task_id, action, from_value, to_value, performed_by)
     VALUES ($1,$2,'REASSIGNED',$3,$4,$5)`,
    [task.order_id, taskId, task.assigned_employee, newEmployee, performedBy]
  );
  return updated.rows[0];
}

module.exports = { updateTaskStatus, reassignTask };