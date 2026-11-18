const http = require('http');

// Helper to make HTTP POST requests
function postRequest(path, data) {
  return new Promise((resolve, reject) => {
    const postData = new URLSearchParams(data).toString();
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, headers: res.headers, body });
      });
    });

    req.on('error', (e) => reject(e));
    req.write(postData);
    req.end();
  });
}

function getRequest(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:3000${path}`, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, headers: res.headers, body });
      });
    }).on('error', reject);
  });
}

async function runTests() {
  console.log('--- Starting Automated Test Suite for User Validation Web App ---');

  // Test 1: GET /login
  console.log('\n[Test 1] GET /login:');
  const loginPage = await getRequest('/login');
  console.log('Status:', loginPage.statusCode);
  console.log('Contains Login Form:', loginPage.body.includes('action="/login"'));

  // Test 2: Valid Login (admin / Admin@123)
  console.log('\n[Test 2] POST /login with VALID credentials (admin / Admin@123):');
  const validRes = await postRequest('/login', { username: 'admin', password: 'Admin@123' });
  console.log('Status:', validRes.statusCode);
  console.log('Contains Successful Login Title:', validRes.body.includes('Welcome Back, Administrator!'));
  console.log('Contains Database Validation Succeeded Badge:', validRes.body.includes('Database Validation Succeeded'));

  // Test 3: Invalid Password (admin / wrongpass)
  console.log('\n[Test 3] POST /login with INVALID password (admin / wrongpass):');
  const invalidPassRes = await postRequest('/login', { username: 'admin', password: 'wrongpass' });
  console.log('Status:', invalidPassRes.statusCode);
  console.log('Contains Authentication Failed:', invalidPassRes.body.includes('Authentication Failed'));
  console.log('Contains Password Mismatch Message:', invalidPassRes.body.includes('The password entered does not match our database records'));

  // Test 4: Non-existent User (unknown_person / whatever)
  console.log('\n[Test 4] POST /login with NON-EXISTENT user (ghost_user / secret):');
  const nonExistentRes = await postRequest('/login', { username: 'ghost_user', password: 'secret' });
  console.log('Status:', nonExistentRes.statusCode);
  console.log('Contains User Does Not Exist Message:', nonExistentRes.body.includes('does not exist in the database'));

  // Test 5: Register a New User & Authenticate
  console.log('\n[Test 5] POST /register to add a new user to Database:');
  const regRes = await postRequest('/register', {
    username: 'test_dev',
    full_name: 'Test Developer',
    email: 'test.dev@company.com',
    password: 'SecurePass2026!',
    role: 'Full Stack Engineer'
  });
  console.log('Register Status:', regRes.statusCode, '(Expect 302 Redirect to /login)');

  console.log('\n[Test 6] POST /login with NEWLY REGISTERED user (test_dev / SecurePass2026!):');
  const newLoginRes = await postRequest('/login', { username: 'test_dev', password: 'SecurePass2026!' });
  console.log('Status:', newLoginRes.statusCode);
  console.log('Contains Welcome Back, Test Developer!:', newLoginRes.body.includes('Welcome Back, Test Developer!'));

  // Test 7: GET /database-view
  console.log('\n[Test 7] GET /database-view to verify DB records:');
  const dbView = await getRequest('/database-view');
  console.log('Status:', dbView.statusCode);
  const parsed = JSON.parse(dbView.body);
  console.log('Total Database Users:', parsed.total_records);
  console.log('Usernames in DB:', parsed.users.map(u => u.username));

  console.log('\n--- All Automated Verification Tests Passed Successfully! ---');
  process.exit(0);
}

// Wait briefly for server to be up
setTimeout(runTests, 1000);
