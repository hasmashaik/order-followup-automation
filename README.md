# D2C Order Follow-up Automation System

Internal application for a D2C company to automatically detect problem orders,
generate follow-up tasks with priorities and deadlines, assign them to employees,
and track everything through a dashboard, CSV report, and audit trail.

## 🧱 Stack

- **Frontend** — React 18 + Vite
- **Backend** — Node.js + Express
- **Database** — PostgreSQL (Neon serverless)

## 📁 Structure

```
backend/   Express API, rule engine, CSV/XLSX import, Neon DB access
frontend/  React app: Upload, Dashboard, Tasks, Reports
```

## ✅ Features

- Excel/CSV upload with row-level validation
  - Missing mandatory fields
  - Duplicate order IDs (in-file and across DB)
  - Invalid dates and invalid payment types
- Automatic **5-rule exception engine**
  1. Unconfirmed order > 2 h
  2. Confirmed but not dispatched > 24 h
  3. Dispatched but past expected delivery date
  4. Failed delivery attempt
  5. High-value (>₹5,000) undelivered past expected date
- Tasks with reason, priority, assigned employee, action, deadline, status
- Manager reassign + status change (Open / In Progress / Resolved)
- Dashboard with totals, exception breakdown, employee pending, high-priority list
- Downloadable CSV daily exception report
- Full audit trail (task created, status change, reassigned)
- Duplicate-task protection using `UNIQUE(order_id, exception_type)`

---

## 🚀 Setup Guide (step by step)

### Step 1 — Create the Neon PostgreSQL database

1. Sign up at https://neon.tech
2. Create a new project → open the **SQL Editor**
3. Copy the connection string from **Dashboard → Connection Details**
   (format: `postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require`)
4. You do **not** need to run any SQL manually — the backend auto-creates
   all tables from `backend/src/schema.sql` on first boot.

### Step 2 — Backend

```bash
cd backend
cp .env.example .env
# edit .env and paste your Neon DATABASE_URL
npm install
npm start
```

Backend should print:
```
✅ Schema ensured
🚀 Backend running on http://localhost:4000
```

Test it:
```bash
curl http://localhost:4000/api/health
# {"ok":true}
```

### Step 3 — Frontend

In a second terminal:

```bash
cd frontend
cp .env.example .env      # leave VITE_API_URL empty (Vite proxy handles it)
npm install
npm run dev
```

Open http://localhost:5173

### Step 4 — Upload data

1. Go to **Upload** page
2. Choose a `.csv` or `.xlsx` file with these headers (aliases also accepted):
   ```
   Order ID, Order Date, Customer Name, Phone Number, Order Value,
   Payment Type, Order Status, Dispatch Date, Expected Delivery Date, Assigned Employee
   ```
3. Click **Upload & Process**
4. Response shows how many rows inserted, duplicates detected, validation
   errors, new tasks created (rule engine).

### Step 5 — Explore

- **Dashboard** — totals + exceptions by category + employee pending + high-priority
- **Tasks** — filters, status change, reassign
- **Reports** — download daily CSV + view audit trail

---

## 📊 Order status values recognised by the rules

| Value               | Meaning                              |
|---------------------|--------------------------------------|
| `Unconfirmed` / `Pending` / `New` | Awaiting customer confirmation |
| `Confirmed`         | Waiting for dispatch                 |
| `Dispatched`        | In transit                           |
| `Delivered`         | Completed (no exceptions)            |
| `Failed Delivery` / `RTO` | Failed attempt / returning     |

## 🔧 Changing a business rule (live interview trick)

Open `backend/src/config/rules.js`:

```js
DISPATCH_HOURS: 24, // ← change to 12 and restart backend
```

All rules reference this file, so one edit is enough.
On the next upload the new limit is applied. Existing tasks stay as-is
(dedupe by `order_id + exception_type`) — safe and idempotent.

## ♻️ Duplicate-task prevention

Every re-upload of the same file:
- Rows are **inserted again** (kept for audit / raw history), but each row is marked
  `is_duplicate = true` when the `order_id` already exists.
- Rule engine checks `UNIQUE(order_id, exception_type)` before inserting a task,
  so no duplicate task is ever created for the same reason on the same order.
- The rule engine only evaluates **rows from the current upload**, not the whole DB,
  so previous files never regenerate tasks.

## 🔁 Reassigning an overdue task (live interview scenario)

1. Open **Tasks**
2. Filter or find an overdue task
3. Type a new employee name in the Reassign field → click **Set**
4. Look at **Reports → Audit Trail** — you'll see
   `REASSIGNED | old_employee → new_employee | manager`
5. `updated_at` is refreshed; deadline is unchanged (business decision — you can
   extend it in `taskService.reassignTask` if required).

## 🧪 Manual error-upload test

Create a CSV with any of:
- Missing `Order ID` in some rows → `Missing mandatory field: order_id` in `validation_errors`
- Duplicate `Order ID` twice → `duplicates` count increments
- `Order Date = "not-a-date"` → `Invalid order_date`
- `Order Value = "abc"` → `Invalid order_value`

Open `orders` table in Neon → the `validation_errors` JSON column shows them.
Bad rows are **not flagged as order exceptions** (they are flagged
`needs_data_correction = true` instead, per the spec).

---

## 💼 Business Impact (for demo)

1. **Reduces manual work** — no more manual Excel cross-checks; the engine
   scans all rules in milliseconds at upload time.
2. **Prevents forgotten orders** — every exception becomes a task with a
   deadline; overdue tasks show on the dashboard and in the daily report.
3. **Metrics of success**
   - Orders flagged / orders uploaded
   - % of tasks resolved within deadline
   - Overdue task count trend (should drop)
   - Average time-to-resolve per exception type
4. **Time saved per day (estimate)**
   - Assume 200 orders/day, 30 exceptions/day, ~4 min manual check each =
     ~120 min/day saved for one coordinator → ~2 hours/day/person.
5. **Current limitations**
   - No live courier API or WhatsApp sending (explicitly out of scope)
   - Deadline extension on reassign is manual (not automatic)
   - Single-tenant: no auth/roles yet — a `performed_by` string is used
   - Rule engine runs on upload only; a cron/manual re-run endpoint can be added
     cheaply (`POST /api/orders/rerun-rules`)

## 📜 License

Internal assessment project — free to use and modify.