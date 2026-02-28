import sqlite3 from 'better-sqlite3';
import path from 'path';

const db = new sqlite3('database.db');

// Initialize database tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT UNIQUE,
    email TEXT UNIQUE,
    name TEXT,
    ff_uid TEXT UNIQUE,
    avatar TEXT,
    bkash_number TEXT,
    nagad_number TEXT,
    district TEXT,
    balance REAL DEFAULT 0,
    referral_code TEXT UNIQUE,
    referred_by TEXT,
    is_admin INTEGER DEFAULT 0,
    is_banned INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS tournaments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    banner TEXT,
    entry_fee REAL,
    prize_pool REAL,
    match_type TEXT, -- Solo, Duo, Squad
    map_type TEXT, -- Bermuda, Purgatory, Kalahari
    start_time DATETIME,
    slots INTEGER,
    slots_filled INTEGER DEFAULT 0,
    status TEXT DEFAULT 'upcoming', -- upcoming, live, completed
    room_id TEXT,
    room_password TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS tournament_participants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tournament_id INTEGER,
    user_id INTEGER,
    slot_number INTEGER,
    status TEXT DEFAULT 'confirmed',
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    amount REAL,
    type TEXT, -- deposit, withdraw, entry_fee, prize
    method TEXT, -- bkash, nagad, rocket
    transaction_id TEXT,
    screenshot TEXT,
    status TEXT DEFAULT 'pending', -- pending, approved, rejected
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tournament_id INTEGER,
    user_id INTEGER,
    kills INTEGER DEFAULT 0,
    placement INTEGER,
    points INTEGER DEFAULT 0,
    prize_amount REAL DEFAULT 0,
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  -- Seed data
  INSERT OR IGNORE INTO users (phone, name, balance, is_admin, referral_code) 
  VALUES ('01700000000', 'এডমিন', 1000, 1, 'ADMIN123');

  INSERT OR IGNORE INTO tournaments (title, entry_fee, prize_pool, match_type, map_type, start_time, slots, slots_filled)
  VALUES 
  ('উইকেন্ড ধামাকা সোলো', 50, 500, 'Solo', 'Bermuda', datetime('now', '+1 day'), 48, 12),
  ('সাপ্তাহিক স্কোয়াড ফাইট', 200, 2000, 'Squad', 'Purgatory', datetime('now', '+2 days'), 12, 4),
  ('ডেইলি ফ্রি এন্ট্রি', 0, 100, 'Solo', 'Kalahari', datetime('now', '+5 hours'), 48, 40);
`);

export default db;
