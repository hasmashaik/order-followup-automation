CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  order_id VARCHAR(100) NOT NULL,
  order_date TIMESTAMPTZ,
  customer_name VARCHAR(255),
  phone VARCHAR(50),
  order_value NUMERIC(12,2),
  payment_type VARCHAR(20),
  order_status VARCHAR(50),
  dispatch_date TIMESTAMPTZ,
  expected_delivery_date TIMESTAMPTZ,
  assigned_employee VARCHAR(150),
  raw_row JSONB,
  validation_errors JSONB,
  is_duplicate BOOLEAN DEFAULT FALSE,
  needs_data_correction BOOLEAN DEFAULT FALSE,
  upload_batch VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_order_id ON orders(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_batch ON orders(upload_batch);

CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  order_id VARCHAR(100) NOT NULL,
  order_row_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  customer_name VARCHAR(255),
  phone VARCHAR(50),
  exception_type VARCHAR(80) NOT NULL,
  reason TEXT NOT NULL,
  priority VARCHAR(20) NOT NULL CHECK (priority IN ('High','Medium','Low')),
  assigned_employee VARCHAR(150),
  action_required TEXT,
  deadline TIMESTAMPTZ,
  status VARCHAR(20) NOT NULL DEFAULT 'Open'
    CHECK (status IN ('Open','In Progress','Resolved')),
  is_resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (order_id, exception_type)
);

CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_employee ON tasks(assigned_employee);

CREATE TABLE IF NOT EXISTS audit_records (
  id SERIAL PRIMARY KEY,
  order_id VARCHAR(100),
  task_id INTEGER REFERENCES tasks(id) ON DELETE SET NULL,
  action VARCHAR(80) NOT NULL,
  from_value TEXT,
  to_value TEXT,
  performed_by VARCHAR(150) DEFAULT 'system',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_order ON audit_records(order_id);