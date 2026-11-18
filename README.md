# User Validation Web Application (WP-LAB-11)

A modern, production-grade **User Validation Web Application** built with **Node.js, Express, SQLite, and bcrypt**. The application accepts user login credentials, securely validates them against an SQLite database, returns a personalized success dashboard upon matching, and displays descriptive failure feedback upon mismatch or non-existent accounts.

---

## 🌟 Key Features

- **Database-Driven Authentication**: User credentials and account profiles are stored and validated against an SQLite relational database (`database/users.db`).
- **Cryptographic Security**: Passwords are never stored in plaintext. They are protected using **bcrypt** salted hashing (`saltRounds = 10`).
- **SQL Injection Prevention**: All database queries strictly use **parameterized statements** (`?` placeholders) preventing SQL injection attacks.
- **Dynamic Response Handling**:
  - **Success**: Returns a comprehensive **Successful Login Page / Dashboard** displaying user identity, role, account ID, and login timestamp.
  - **Failure**: Returns a structured **Failure Page / Error Alert** identifying the issue (e.g., *User does not exist* or *Invalid password*) without exposing sensitive database internals.
- **Modern UI / UX**:
  - Clean glassmorphism design with responsive CSS.
  - Interactive password show/hide toggle.
  - Quick **1-Click Demo Credential Chips** for instantaneous evaluation.
- **Account Registration & Inspection**:
  - Built-in `/register` page to dynamically add new users to the database.
  - Built-in `/database-view` endpoint to safely inspect existing database records.

---

## 📁 Project Architecture

```
WP-LAB-11/
├── database/
│   ├── db.js             # SQLite connection, schema definition & default seed data
│   └── users.db          # Auto-generated SQLite database file
├── public/
│   ├── css/
│   │   └── style.css     # Modern, responsive UI design system
│   └── js/
│       └── login.js      # Client-side validation, demo autofill & password toggle
├── views/
│   ├── login.html        # Login form page with demo credential chips
│   ├── success.html      # Successful authentication dashboard
│   ├── failure.html      # Dedicated failure page with error explanation
│   └── register.html     # User registration form
├── server.js             # Express application & authentication route handlers
├── test-auth.js          # Automated end-to-end test suite
├── package.json          # Project dependencies & npm run scripts
└── README.md             # Complete documentation
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** (v18.x, v20.x, or newer)
- **npm** (v9.x or newer)

### 2. Installation
Dependencies are already configured. If starting in a new clone, run:
```bash
npm install
```

### 3. Run the Application
Start the server:
```bash
npm start
```
The server will start on `http://localhost:3000`.

---

## 🧪 Pre-Configured Test Credentials

The database automatically seeds 3 sample users on first boot:

| Login Name | Password | Role | Full Name |
| :--- | :--- | :--- | :--- |
| `admin` | `Admin@123` | Administrator | System Administrator |
| `john_doe` | `Password123!` | Software Engineer | John Doe |
| `alice` | `AlicePass#2026` | Product Manager | Alice Smith |

*Tip: You can click any of the credential buttons on the login page to instantly autofill the form!*

---

## 🧪 Automated Test Suite

An automated end-to-end verification script is included. To run it:
```bash
node test-auth.js
```

### Tests Covered:
1. `GET /login` — Verifies login view is served.
2. `POST /login` with **Valid credentials** — Verifies successful login page and session creation.
3. `POST /login` with **Wrong password** — Verifies failure response and mismatch message.
4. `POST /login` with **Non-existent user** — Verifies error message indicating user not found.
5. `POST /register` — Verifies new user creation and database persistence.
6. `POST /login` with **Newly registered user** — Verifies immediate authentication of newly created user.
7. `GET /database-view` — Verifies database query and masking of password hashes.

---

## 🛡️ Security Implementation Details

1. **Password Hashing (bcrypt)**:
   ```javascript
   // Registration / Seeding
   const hash = await bcrypt.hash(password, 10);

   // Login Verification
   const isMatch = await bcrypt.compare(password, user.password_hash);
   ```

2. **Parameterized SQL Queries**:
   ```javascript
   // Prevents SQL Injection
   const user = await dbGet('SELECT * FROM users WHERE LOWER(username) = LOWER(?)', [username]);
   ```

3. **HTTP Session Management**:
   ```javascript
   // Uses express-session with httpOnly cookies
   req.session.user = { id: user.id, username: user.username, ... };
   ```
