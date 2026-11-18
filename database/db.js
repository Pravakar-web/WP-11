const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.resolve(__dirname, 'users.db');

// Initialize database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('[-] Could not connect to SQLite database:', err.message);
  } else {
    console.log('[+] Connected to SQLite database at:', dbPath);
  }
});

// Helper for promise-based queries
const dbGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const dbAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
};

// Seed default users if the table is empty
async function initDatabase() {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      email TEXT,
      role TEXT DEFAULT 'User',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME
    )
  `;

  await dbRun(createTableQuery);

  const existingUsers = await dbGet('SELECT COUNT(*) as count FROM users');
  if (existingUsers && existingUsers.count === 0) {
    console.log('[*] Database empty. Seeding initial test users with bcrypt hashed passwords...');

    const saltRounds = 10;
    const defaultUsers = [
      {
        username: 'admin',
        password: 'Admin@123',
        full_name: 'Administrator',
        email: 'admin@example.com',
        role: 'Administrator'
      },
      {
        username: 'john_doe',
        password: 'Password123!',
        full_name: 'John Doe',
        email: 'john.doe@example.com',
        role: 'Software Engineer'
      },
      {
        username: 'alice',
        password: 'AlicePass#2026',
        full_name: 'Alice Smith',
        email: 'alice.smith@example.com',
        role: 'Product Manager'
      }
    ];

    for (const u of defaultUsers) {
      const hash = await bcrypt.hash(u.password, saltRounds);
      await dbRun(
        'INSERT INTO users (username, password_hash, full_name, email, role) VALUES (?, ?, ?, ?, ?)',
        [u.username, hash, u.full_name, u.email, u.role]
      );
    }

    console.log('[+] Default test users seeded successfully:');
    console.log('    1. admin      / Admin@123');
    console.log('    2. john_doe   / Password123!');
    console.log('    3. alice      / AlicePass#2026');
  }
}

module.exports = {
  db,
  dbGet,
  dbAll,
  dbRun,
  initDatabase
};
