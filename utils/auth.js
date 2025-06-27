const fs = require('fs');
const path = require('path');
const os = require('os');
const axios = require('axios');
const open = require('open');
const inquirer = require('inquirer');
const ora = require('ora');
const chalk = require('chalk');

const CLI_ROOT = path.resolve(__dirname, '..');  
const AUTH_PATH = path.join(CLI_ROOT, '.taptap-auth.json');
const API_BASE = 'https://api.checkscript.site';

// Save session
function saveAuth(data) {
  fs.writeFileSync(AUTH_PATH, JSON.stringify(data, null, 2));
}

// Load session
function getAuth() {
  if (fs.existsSync(AUTH_PATH)) {
    const raw = fs.readFileSync(AUTH_PATH, 'utf-8');
    try {
      const parsed = JSON.parse(raw);
      if (parsed.email && parsed.uuid) return parsed;
    } catch (_) {}
  }
  return null;
}

// Clear session
function logout() {
  if (fs.existsSync(AUTH_PATH)) fs.unlinkSync(AUTH_PATH);
}

async function registerCLIUser() {
  const { name, email, password } = await inquirer.prompt([
    { name: 'name', message: 'Name:', validate: input => !!input || 'Name is required' },
    { name: 'email', message: 'Email:', validate: val => val.includes('@') || 'Enter a valid email' },
    { name: 'password', message: 'Password:', type: 'password', mask: '*', validate: input => input.length >= 6 || 'Minimum 6 characters' }
  ]);

  const spinner = ora('📝 Registering user...').start();

  try {
    const res = await axios.post(`${API_BASE}/api/cli/register`, { name, email, password });
    spinner.succeed(chalk.green('✅ Registration successful!'));
    console.log(chalk.blue(res.data.message));
  } catch (err) {
    spinner.fail('❌ Registration failed');
    console.error(chalk.red(err.response?.data?.message || err.message));
  }
}

// ✅ Browser login flow (with polling)
async function browserLogin(openBrowser = false) {
  const spinner = ora('🔐 Creating login session...').start();

  try {
    const res = await axios.post(`${API_BASE}/api/cli/initiate-login`);
    const { uuid, token, login_url } = res.data;

    spinner.succeed('✅ Session created');
    const loginURL = `${login_url}?token=${token}`;

    console.log(`\n🔗 Login URL: ${chalk.cyan(loginURL)}\n`);
    if (openBrowser) await open(loginURL);

    const pollSpinner = ora('⏳ Waiting for confirmation...').start();

    return new Promise((resolve) => {
      const interval = setInterval(async () => {
        try {
          const pollRes = await axios.get(`${API_BASE}/api/cli/poll/${uuid}`);
          if (pollRes.data.confirmed) {
            clearInterval(interval);
            pollSpinner.succeed('✅ Login confirmed!');

            const auth = {
              uuid,
              email: pollRes.data.email,
              name: pollRes.data.name,
              unique_id: pollRes.data.unique_id,
              loggedInAt: Date.now()
            };

            saveAuth(auth);
            resolve(auth);
          }
        } catch (err) {
          if (err.response?.status === 410) {
            clearInterval(interval);
            pollSpinner.fail('❌ Session expired. Please try again.');
            resolve(null);
          }
        }
      }, 3000); // poll every 3 seconds
    });

  } catch (err) {
    spinner.fail('❌ Failed to create session');
    console.error(chalk.red(err.message));
    return null;
  }
}

// ✅ Direct CLI login flow
async function directLogin() {
  const { email, password } = await inquirer.prompt([
    { name: 'email', message: 'Email:', validate: val => val.includes('@') },
    { name: 'password', message: 'Password:', type: 'password', mask: '*' }
  ]);

  const spinner = ora('🔐 Verifying credentials...').start();

  try {
    const res = await axios.post(`${API_BASE}/api/cli-auth-direct`, { email, password });
    spinner.succeed('✅ Login successful');

    const auth = {
      uuid: res.data.uuid,
      email: res.data.email,
      name: res.data.name,
      unique_id: res.data.unique_id,
      loggedInAt: Date.now()
    };

    saveAuth(auth);
    return auth;
  } catch (err) {
    spinner.fail('❌ Login failed');
    console.log(chalk.red(err.response?.data?.message || 'Unexpected error'));
    return null;
  }
}

module.exports = {
  browserLogin,
  directLogin,
  registerCLIUser,
  getAuth,
  logout,
  isLoggedIn: () => !!getAuth()
};
