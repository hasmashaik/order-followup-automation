const RULES = require('../config/rules');

const REQUIRED_FIELDS = [
  'order_id',
  'order_date',
  'customer_name',
  'phone',
  'order_value',
  'payment_type',
  'order_status',
  'assigned_employee',
];

// Column name aliases (accepts several header spellings)
const FIELD_ALIASES = {
  order_id: ['order id', 'orderid', 'order_id', 'order-id'],
  order_date: ['order date', 'orderdate', 'order_date', 'order-date'],
  customer_name: ['customer name', 'customername', 'customer_name', 'customer'],
  phone: ['phone number', 'phone', 'phonenumber', 'phone_number', 'mobile'],
  order_value: ['order value', 'ordervalue', 'order_value', 'value', 'amount'],
  payment_type: ['payment type', 'paymenttype', 'payment_type', 'payment'],
  order_status: ['order status', 'orderstatus', 'order_status', 'status'],
  dispatch_date: ['dispatch date', 'dispatchdate', 'dispatch_date'],
  expected_delivery_date: [
    'expected delivery date',
    'expecteddeliverydate',
    'expected_delivery_date',
    'expected delivery',
  ],
  assigned_employee: ['assigned employee', 'assignedemployee', 'assigned_employee', 'employee'],
};

function normaliseKeys(row) {
  const out = {};
  for (const key of Object.keys(row)) {
    const norm = String(key).toLowerCase().trim();
    out[norm] = row[key];
  }
  return out;
}

function mapRow(rawRow) {
  const norm = normaliseKeys(rawRow);
  const mapped = {};
  for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
    let value = null;
    for (const alias of aliases) {
      if (norm[alias] !== undefined && norm[alias] !== '') {
        value = norm[alias];
        break;
      }
    }
    mapped[field] = value;
  }
  return mapped;
}

function parseDate(value) {
  if (value === null || value === undefined || value === '') return null;
  // Excel serial date (number)
  if (typeof value === 'number') {
    const ms = Math.round((value - 25569) * 86400 * 1000);
    const d = new Date(ms);
    return isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

function validateRow(mapped) {
  const errors = [];

  for (const f of REQUIRED_FIELDS) {
    if (mapped[f] === null || mapped[f] === '') {
      errors.push(`Missing mandatory field: ${f}`);
    }
  }

  const orderDate = parseDate(mapped.order_date);
  if (mapped.order_date && !orderDate) errors.push('Invalid order_date');
  const dispatchDate = parseDate(mapped.dispatch_date);
  if (mapped.dispatch_date && !dispatchDate) errors.push('Invalid dispatch_date');
  const expectedDate = parseDate(mapped.expected_delivery_date);
  if (mapped.expected_delivery_date && !expectedDate)
    errors.push('Invalid expected_delivery_date');

  let orderValue = null;
  if (mapped.order_value !== null && mapped.order_value !== '') {
    orderValue = Number(String(mapped.order_value).replace(/[^0-9.\-]/g, ''));
    if (isNaN(orderValue)) errors.push('Invalid order_value');
  }

  const paymentType = mapped.payment_type
    ? String(mapped.payment_type).toLowerCase().trim()
    : null;
  if (paymentType && !['prepaid', 'cod'].includes(paymentType)) {
    errors.push(`Invalid payment_type: ${mapped.payment_type}`);
  }

  return {
    errors,
    parsed: {
      order_id: mapped.order_id ? String(mapped.order_id).trim() : null,
      order_date: orderDate,
      customer_name: mapped.customer_name,
      phone: mapped.phone ? String(mapped.phone).trim() : null,
      order_value: orderValue,
      payment_type: paymentType,
      order_status: mapped.order_status
        ? String(mapped.order_status).trim()
        : null,
      dispatch_date: dispatchDate,
      expected_delivery_date: expectedDate,
      assigned_employee: mapped.assigned_employee,
    },
  };
}

module.exports = { mapRow, validateRow, parseDate, REQUIRED_FIELDS, RULES };