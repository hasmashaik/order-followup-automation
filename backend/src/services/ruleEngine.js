const db = require('../db');
const RULES = require('../config/rules');

// ---------- helpers ----------
function hoursBetween(a, b) {
  return (b.getTime() - a.getTime()) / (1000 * 60 * 60);
}
function daysBetween(a, b) {
  return (b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24);
}

function buildException({ order, type, reason, priority, action, deadlineHours }) {
  const deadline = new Date(Date.now() + deadlineHours * 60 * 60 * 1000);
  return {
    order_id: order.order_id,
    order_row_id: order.id,
    customer_name: order.customer_name,
    phone: order.phone,
    exception_type: type,
    reason,
    priority,
    assigned_employee: order.assigned_employee || 'Unassigned',
    action_required: action,
    deadline,
  };
}

// Evaluate all 5 mandatory rules for one order row
function evaluateOrder(order, now = new Date()) {
  const exceptions = [];

  // Skip rows needing data correction – flag them instead of an order exception
  if (order.needs_data_correction || order.is_duplicate) return exceptions;

  const status = (order.order_status || '').toLowerCase();
  const orderDate = order.order_date ? new Date(order.order_date) : null;
  const dispatchDate = order.dispatch_date ? new Date(order.dispatch_date) : null;
  const expected = order.expected_delivery_date
    ? new Date(order.expected_delivery_date)
    : null;

  // Rule 1 – Unconfirmed orders > 2 hours
  if (
    (status === 'unconfirmed' || status === 'pending' || status === 'new') &&
    orderDate
  ) {
    const hrs = hoursBetween(orderDate, now);
    if (hrs > RULES.UNCONFIRMED_HOURS) {
      exceptions.push(
        buildException({
          order,
          type: 'Unconfirmed Order',
          reason: `Order unconfirmed for ${hrs.toFixed(1)}h (limit ${RULES.UNCONFIRMED_HOURS}h)`,
          priority: order.order_value > RULES.HIGH_VALUE_THRESHOLD ? 'High' : 'Medium',
          action: 'Call customer to confirm order',
          deadlineHours: 2,
        })
      );
    }
  }

  // Rule 2 – Confirmed but not dispatched within 24h
  if (status === 'confirmed' && orderDate) {
    const hrs = hoursBetween(orderDate, now);
    if (!dispatchDate && hrs > RULES.DISPATCH_HOURS) {
      exceptions.push(
        buildException({
          order,
          type: 'Dispatch Delay',
          reason: `Confirmed order not dispatched for ${hrs.toFixed(1)}h (limit ${RULES.DISPATCH_HOURS}h)`,
          priority: 'High',
          action: 'Escalate to warehouse to dispatch immediately',
          deadlineHours: 4,
        })
      );
    }
  }

  // Rule 3 – Dispatched but expected delivery date passed, no delivery
  if (status === 'dispatched' && expected) {
    if (now > expected) {
      const days = daysBetween(expected, now);
      exceptions.push(
        buildException({
          order,
          type: 'Shipment Delay',
          reason: `Shipment overdue by ${days.toFixed(1)} days past expected delivery date`,
          priority: days > 2 ? 'High' : 'Medium',
          action: 'Contact courier and update customer',
          deadlineHours: 6,
        })
      );
    }
  }

  // Rule 4 – Failed delivery attempt
  if (status === 'failed delivery' || status === 'failed_delivery' || status === 'rto') {
    exceptions.push(
      buildException({
        order,
        type: 'Failed Delivery',
        reason: 'Courier reported a failed delivery attempt',
        priority: 'High',
        action: 'Call customer and re-attempt delivery',
        deadlineHours: 4,
      })
    );
  }

  // Rule 5 – High value > 5000 AND undelivered past expected date
  if (
    expected &&
    order.order_value !== null &&
    Number(order.order_value) > RULES.HIGH_VALUE_THRESHOLD &&
    status !== 'delivered' &&
    now > expected
  ) {
    exceptions.push(
      buildException({
        order,
        type: 'High-Value Overdue',
        reason: `High-value order (₹${order.order_value}) undelivered past expected date`,
        priority: 'High',
        action: 'Priority follow-up with logistics head',
        deadlineHours: 2,
      })
    );
  }

  return exceptions;
}

// Insert exceptions as tasks — dedupe using (order_id, exception_type)
async function persistExceptions(exceptions, performedBy = 'system') {
  let created = 0;
  let skipped = 0;

  for (const ex of exceptions) {
    // UNIQUE (order_id, exception_type) prevents duplicate tasks across re-imports
    const existing = await db.query(
      `SELECT id, status FROM tasks WHERE order_id = $1 AND exception_type = $2 LIMIT 1`,
      [ex.order_id, ex.exception_type]
    );
    if (existing.rowCount > 0) {
      skipped += 1;
      continue; // already exists → don't regenerate
    }

    const inserted = await db.query(
      `INSERT INTO tasks
        (order_id, order_row_id, customer_name, phone, exception_type, reason,
         priority, assigned_employee, action_required, deadline, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'Open')
       RETURNING *`,
      [
        ex.order_id,
        ex.order_row_id,
        ex.customer_name,
        ex.phone,
        ex.exception_type,
        ex.reason,
        ex.priority,
        ex.assigned_employee,
        ex.action_required,
        ex.deadline,
      ]
    );

    await db.query(
      `INSERT INTO audit_records (order_id, task_id, action, from_value, to_value, performed_by, notes)
       VALUES ($1,$2,'TASK_CREATED',NULL,$3,$4,$5)`,
      [ex.order_id, inserted.rows[0].id, ex.exception_type, performedBy, ex.reason]
    );

    created += 1;
  }

  return { created, skipped };
}

async function runRuleEngine(orders, performedBy = 'system') {
  const all = [];
  for (const order of orders) {
    all.push(...evaluateOrder(order));
  }
  const summary = await persistExceptions(all, performedBy);
  return { evaluated: orders.length, ...summary };
}

module.exports = { evaluateOrder, runRuleEngine, persistExceptions };