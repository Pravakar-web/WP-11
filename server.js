const express = require('express');
const session = require('express-session');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const { dbGet, dbAll, dbRun, initDatabase } = require('./database/db');

const app = express();
const PORT = process.env.PORT || 3000;

// Body Parsers for Form POST and JSON requests
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve Static Assets (CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// Session Configuration
app.use(
  session({
    secret: 'wp-lab-11-secure-auth-secret-key-2026',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // Set to true if running over HTTPS
      maxAge: 1000 * 60 * 60 // 1 hour session
    }
  })
);

// Helper function to render HTML template files with placeholder substitution
function renderTemplate(filePath, data = {}) {
  let content = fs.readFileSync(filePath, 'utf8');
  for (const [key, value] of Object.entries(data)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    content = content.replace(regex, value ?? '');
  }
  return content;
}

// Route: Root -> Redirect based on session status
app.get('/', (req, res) => {
  if (req.session && req.session.user) {
    return res.redirect('/dashboard');
  }
  res.redirect('/login');
});

// Route: GET /login -> Display Login Page
app.get('/login', (req, res) => {
  if (req.session && req.session.user) {
    return res.redirect('/dashboard');
  }
  res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

// Route: POST /login -> Authenticate Credentials against SQLite Database
app.post('/login', async (req, res) => {
  const isAjax = req.xhr || req.headers.accept?.includes('application/json') || req.is('json');

  try {
    const rawUsername = req.body.username;
    const rawPassword = req.body.password;

    // 1. Validate Form Input Presence
    if (!rawUsername || !rawPassword || !rawUsername.trim() || !rawPassword.trim()) {
      const errorMsg = 'Please provide both login name and password.';
      if (isAjax) {
        return res.status(400).json({ success: false, message: errorMsg });
      }
      const failureHtml = renderTemplate(path.join(__dirname, 'views', 'failure.html'), {
        ERROR_MESSAGE: errorMsg
      });
      return res.status(400).send(failureHtml);
    }

    const username = rawUsername.trim();
    const password = rawPassword;

    console.log(`[*] Received login attempt for user: "${username}"`);

    // 2. Query Database for existing user (Parameterized query protects against SQL Injection)
    const user = await dbGet('SELECT * FROM users WHERE LOWER(username) = LOWER(?)', [username]);

    // 3. User does not exist in Database
    if (!user) {
      console.warn(`[-] Authentication failed: User "${username}" not found in database.`);
      const errorMsg = `User "${username}" does not exist in the database. Please check your login name or register.`;

      if (isAjax) {
        return res.status(401).json({ success: false, message: errorMsg });
      }

      const failureHtml = renderTemplate(path.join(__dirname, 'views', 'failure.html'), {
        ERROR_MESSAGE: errorMsg
      });
      return res.status(401).send(failureHtml);
    }

    // 4. Verify Password Hash using bcrypt
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      console.warn(`[-] Authentication failed: Incorrect password for user "${username}".`);
      const errorMsg = 'Invalid credentials. The password entered does not match our database records.';

      if (isAjax) {
        return res.status(401).json({ success: false, message: errorMsg });
      }

      const failureHtml = renderTemplate(path.join(__dirname, 'views', 'failure.html'), {
        ERROR_MESSAGE: errorMsg
      });
      return res.status(401).send(failureHtml);
    }

    // 5. Successful Login: Update last_login timestamp in Database
    const currentTimestamp = new Date().toLocaleString();
    await dbRun('UPDATE users SET last_login = datetime("now") WHERE id = ?', [user.id]);

    // Establish secure user session
    req.session.user = {
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      email: user.email || 'N/A',
      role: user.role || 'User',
      login_time: currentTimestamp
    };

    console.log(`[+] User "${username}" successfully authenticated against database.`);

    // 6. Return Successful Login Page
    if (isAjax) {
      return res.json({ success: true, redirect: '/dashboard' });
    }

    const successHtml = renderTemplate(path.join(__dirname, 'views', 'success.html'), {
      USER_ID: user.id,
      USERNAME: user.username,
      FULL_NAME: user.full_name,
      EMAIL: user.email || 'N/A',
      ROLE: user.role || 'User',
      LOGIN_TIME: currentTimestamp
    });

    return res.status(200).send(successHtml);

  } catch (error) {
    console.error('[-] Server error during authentication:', error);
    const errorMsg = 'An unexpected server error occurred during database validation.';

    if (isAjax) {
      return res.status(500).json({ success: false, message: errorMsg });
    }

    const failureHtml = renderTemplate(path.join(__dirname, 'views', 'failure.html'), {
      ERROR_MESSAGE: errorMsg
    });
    return res.status(500).send(failureHtml);
  }
});

// Route: GET /dashboard -> Displays success dashboard for active sessions
app.get('/dashboard', (req, res) => {
  if (!req.session || !req.session.user) {
    return res.redirect('/login?error=' + encodeURIComponent('Please log in to access your dashboard.'));
  }

  const user = req.session.user;
  const successHtml = renderTemplate(path.join(__dirname, 'views', 'success.html'), {
    USER_ID: user.id,
    USERNAME: user.username,
    FULL_NAME: user.full_name,
    EMAIL: user.email,
    ROLE: user.role,
    LOGIN_TIME: user.login_time
  });

  res.send(successHtml);
});

// Route: GET /failure -> Dedicated failure view
app.get('/failure', (req, res) => {
  const errorMsg = req.query.msg || 'Authentication failed: Invalid login name or password.';
  const failureHtml = renderTemplate(path.join(__dirname, 'views', 'failure.html'), {
    ERROR_MESSAGE: errorMsg
  });
  res.send(failureHtml);
});

// Route: GET /register -> Display User Registration Page
app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'register.html'));
});

// Route: POST /register -> Insert New User into SQLite Database
app.post('/register', async (req, res) => {
  try {
    const { username, full_name, email, password, role } = req.body;

    if (!username || !password || !full_name) {
      return res.redirect('/register?error=' + encodeURIComponent('Username, Full Name, and Password are required.'));
    }

    // Check if username already exists
    const existing = await dbGet('SELECT id FROM users WHERE LOWER(username) = LOWER(?)', [username.trim()]);
    if (existing) {
      return res.redirect('/register?error=' + encodeURIComponent(`Username "${username}" is already taken.`));
    }

    // Hash password with bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user into SQLite database
    await dbRun(
      'INSERT INTO users (username, password_hash, full_name, email, role) VALUES (?, ?, ?, ?, ?)',
      [username.trim(), hashedPassword, full_name.trim(), email ? email.trim() : null, role ? role.trim() : 'User']
    );

    console.log(`[+] New user registered in database: "${username}"`);
    res.redirect('/login?success=' + encodeURIComponent('Account created successfully! You can now log in with your credentials.'));

  } catch (error) {
    console.error('[-] Error during user registration:', error);
    res.redirect('/register?error=' + encodeURIComponent('Failed to register user into database.'));
  }
});

// Route: GET /logout -> Invalidate session and redirect
app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('[-] Error destroying session:', err);
    }
    res.clearCookie('connect.sid');
    res.redirect('/login?success=' + encodeURIComponent('You have been logged out successfully.'));
  });
});

// Route: GET /database-view -> API to inspect database users (for grading / validation)
app.get('/database-view', async (req, res) => {
  try {
    const users = await dbAll('SELECT id, username, full_name, email, role, created_at, last_login FROM users');
    res.json({
      status: 'success',
      description: 'SQLite database user records (passwords securely hidden with bcrypt)',
      total_records: users.length,
      users: users
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Start Server and Initialize Database
async function startServer() {
  try {
    await initDatabase();
    app.listen(PORT, () => {
      console.log('====================================================');
      console.log(`🚀 User Validation Server is running!`);
      console.log(`📡 Local URL: http://localhost:${PORT}`);
      console.log(`🧪 Demo Credentials:`);
      console.log(`   - Username: admin      | Password: Admin@123`);
      console.log(`   - Username: john_doe   | Password: Password123!`);
      console.log(`   - Username: alice      | Password: AlicePass#2026`);
      console.log('====================================================');
    });
  } catch (err) {
    console.error('[-] Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
