import express from 'express';
import { createServer as createViteServer } from 'vite';
import db from './server/db';
import dotenv from 'dotenv';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- API Routes ---

  // Auth Mock (For demo purposes, we'll use a simple header-based auth or session)
  app.post('/api/auth/login', (req, res) => {
    const { phone } = req.body;
    let user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);
    if (!user) {
      const referralCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const info = db.prepare('INSERT INTO users (phone, referral_code) VALUES (?, ?)').run(phone, referralCode);
      user = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
    }
    res.json({ user });
  });

  app.get('/api/user/:id', (req, res) => {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
    res.json(user);
  });

  app.post('/api/user/update', (req, res) => {
    const { id, name, ff_uid, bkash_number, nagad_number, district } = req.body;
    db.prepare('UPDATE users SET name = ?, ff_uid = ?, bkash_number = ?, nagad_number = ?, district = ? WHERE id = ?')
      .run(name, ff_uid, bkash_number, nagad_number, district, id);
    res.json({ success: true });
  });

  // Tournaments
  app.get('/api/tournaments', (req, res) => {
    const tournaments = db.prepare('SELECT * FROM tournaments ORDER BY start_time DESC').all();
    res.json(tournaments);
  });

  app.get('/api/tournaments/:id', (req, res) => {
    const tournament = db.prepare('SELECT * FROM tournaments WHERE id = ?').get(req.params.id);
    const participants = db.prepare(`
      SELECT u.name, u.ff_uid, tp.slot_number 
      FROM tournament_participants tp 
      JOIN users u ON tp.user_id = u.id 
      WHERE tp.tournament_id = ?
    `).all(req.params.id);
    res.json({ ...tournament, participants });
  });

  app.post('/api/tournaments/join', (req, res) => {
    const { tournament_id, user_id } = req.body;
    const tournament = db.prepare('SELECT * FROM tournaments WHERE id = ?').get(tournament_id);
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(user_id);

    if (user.balance < tournament.entry_fee) {
      return res.status(400).json({ error: 'পর্যাপ্ত ব্যালেন্স নেই' });
    }

    if (tournament.slots_filled >= tournament.slots) {
      return res.status(400).json({ error: 'টুর্নামেন্টটি পূর্ণ হয়ে গেছে' });
    }

    const existing = db.prepare('SELECT * FROM tournament_participants WHERE tournament_id = ? AND user_id = ?').get(tournament_id, user_id);
    if (existing) {
      return res.status(400).json({ error: 'আপনি ইতিমধ্যে এই টুর্নামেন্টে যোগ দিয়েছেন' });
    }

    db.transaction(() => {
      db.prepare('UPDATE users SET balance = balance - ? WHERE id = ?').run(tournament.entry_fee, user_id);
      db.prepare('INSERT INTO tournament_participants (tournament_id, user_id, slot_number) VALUES (?, ?, ?)')
        .run(tournament_id, user_id, tournament.slots_filled + 1);
      db.prepare('UPDATE tournaments SET slots_filled = slots_filled + 1 WHERE id = ?').run(tournament_id);
      db.prepare('INSERT INTO transactions (user_id, amount, type, status) VALUES (?, ?, ?, ?)')
        .run(user_id, -tournament.entry_fee, 'entry_fee', 'approved');
    })();

    res.json({ success: true });
  });

  // Wallet
  app.post('/api/wallet/deposit', (req, res) => {
    const { user_id, amount, method, transaction_id } = req.body;
    db.prepare('INSERT INTO transactions (user_id, amount, type, method, transaction_id, status) VALUES (?, ?, ?, ?, ?, ?)')
      .run(user_id, amount, 'deposit', method, transaction_id, 'pending');
    res.json({ success: true });
  });

  app.get('/api/wallet/history/:user_id', (req, res) => {
    const history = db.prepare('SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC').all(req.params.user_id);
    res.json(history);
  });

  // Admin Routes
  app.post('/api/admin/tournaments/create', (req, res) => {
    const { title, banner, entry_fee, prize_pool, match_type, map_type, start_time, slots } = req.body;
    db.prepare(`
      INSERT INTO tournaments (title, banner, entry_fee, prize_pool, match_type, map_type, start_time, slots) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(title, banner, entry_fee, prize_pool, match_type, map_type, start_time, slots);
    res.json({ success: true });
  });

  app.get('/api/admin/transactions', (req, res) => {
    const transactions = db.prepare(`
      SELECT t.*, u.phone, u.name 
      FROM transactions t 
      JOIN users u ON t.user_id = u.id 
      WHERE t.status = 'pending'
      ORDER BY t.created_at DESC
    `).all();
    res.json(transactions);
  });

  app.post('/api/admin/transactions/approve', (req, res) => {
    const { transaction_id, status } = req.body;
    const transaction = db.prepare('SELECT * FROM transactions WHERE id = ?').get(transaction_id);
    
    if (status === 'approved') {
      db.transaction(() => {
        db.prepare('UPDATE transactions SET status = "approved" WHERE id = ?').run(transaction_id);
        db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(transaction.amount, transaction.user_id);
      })();
    } else {
      db.prepare('UPDATE transactions SET status = "rejected" WHERE id = ?').run(transaction_id);
    }
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
