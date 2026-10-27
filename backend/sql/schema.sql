-- Smart Campus Mess Management System Database Schema

CREATE TABLE IF NOT EXISTS students (
    student_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    password_hash TEXT NOT NULL,
    room_number TEXT,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS credits (
    credit_id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    monthly_limit INTEGER DEFAULT 9000,
    used_credits INTEGER DEFAULT 0,
    remaining_credits INTEGER DEFAULT 9000,
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
    UNIQUE(student_id, month, year)
);

CREATE TABLE IF NOT EXISTS menu_items (
    item_id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_name TEXT NOT NULL,
    category TEXT NOT NULL,
    price INTEGER NOT NULL,
    description TEXT,
    image_url TEXT,
    available_quantity INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
    order_id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    total_amount INTEGER NOT NULL,
    order_status TEXT NOT NULL DEFAULT 'Pending',
    order_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_time DATETIME,
    pickup_token TEXT,
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS order_items (
    order_item_id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    item_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    price INTEGER NOT NULL,
    subtotal INTEGER NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES menu_items(item_id)
);

CREATE TABLE IF NOT EXISTS transactions (
    transaction_id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    order_id INTEGER,
    amount INTEGER NOT NULL,
    transaction_type TEXT NOT NULL,
    transaction_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    balance_after INTEGER NOT NULL,
    notes TEXT,
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS admins (
    admin_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin', 'chef')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS otps (
    otp_id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone_number TEXT NOT NULL,
    otp_hash TEXT NOT NULL,
    expires_at DATETIME NOT NULL,
    verified INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indices for performance and speed
CREATE INDEX IF NOT EXISTS idx_orders_student ON orders(student_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(order_status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_transactions_student ON transactions(student_id);
CREATE INDEX IF NOT EXISTS idx_credits_student_period ON credits(student_id, month, year);
CREATE INDEX IF NOT EXISTS idx_otps_phone ON otps(phone_number);

