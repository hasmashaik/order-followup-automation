const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const Papa = require('papaparse');
const db = require('../db');
const { mapRow, validateRow } = require('../utils/validators');
const { runRuleEngine } = require('./ruleEngine');

function parseFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.csv') {
    const text = fs.readFileSync(filePath, 'utf8');
    const res = Papa.parse(text, { header: true, skipEmptyLines: true });
    return res.data;
  }
  // xlsx / xls
  const wb = XLSX.readFile(filePath);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(sheet, { defval: '' });
}

async function importOrders(filePath, uploadedBy = 'manager') {
  const rawRows = parseFile(filePath);
  const batchId = `batch_${Date.now()}`;
  const seenOrderIds = new Set();
  const results = { total: rawRows.length, inserted: 0, duplicates: 0, invalid: 0 };
  const insertedOrders = [];

  for (const rawRow of rawRows) {
    const mapped = mapRow(rawRow);
    const { errors, parsed } = validateRow(mapped);

    // Duplicate detection within the same file
    let isDuplicate = false;
    if (parsed.order_id && seenOrderIds.has(parsed.order_id)) {
      isDuplicate = true;
      results.duplicates += 1;
    } else if (parsed.order_id) {
      seenOrderIds.add(parsed.order_id);
    }

    // Duplicate detection against DB
    if (parsed.order_id && !isDuplicate) {
      const existing = await db.query(
        'SELECT id FROM orders WHERE order_id = $1 LIMIT 1',
        [parsed.order_id]
      );
      if (existing.rowCount > 0) {
        isDuplicate = true;
        results.duplicates += 1;
      }
    }

    const needsDataCorrection = errors.length > 0;
    if (needsDataCorrection) results.invalid += 1;

    const insert = await db.query(
      `INSERT INTO orders
        (order_id, order_date, customer_name, phone, order_value, payment_type,
         order_status, dispatch_date, expected_delivery_date, assigned_employee,
         raw_row, validation_errors, is_duplicate, needs_data_correction, upload_batch)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       RETURNING *`,
      [
        parsed.order_id,
        parsed.order_date,
        parsed.customer_name,
        parsed.phone,
        parsed.order_value,
        parsed.payment_type,
        parsed.order_status,
        parsed.dispatch_date,
        parsed.expected_delivery_date,
        parsed.assigned_employee,
        rawRow,
        JSON.stringify(errors),
        isDuplicate,
        needsDataCorrection,
        batchId,
      ]
    );

    results.inserted += 1;
    insertedOrders.push(insert.rows[0]);
  }

  // Run rule engine on the imported orders
  const ruleSummary = await runRuleEngine(insertedOrders, uploadedBy);

  return { batchId, results, ruleSummary };
}

module.exports = { importOrders };