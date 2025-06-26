#!/usr/bin/env node

const inquirer = require('inquirer');
const chalk = require('chalk');
const ora = require('ora');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');
const { v4: uuidv4 } = require('uuid');
const zipFolder = require('../utils/zipFolder');
const previewSite = require('../utils/localServer');
const pkg = require('../package.json');
const API_BASE = 'https://api.checkscript.site';

(async () => {
  const args = process.argv.slice(2);

  // --preview
  if (args.includes('--preview')) {
    await previewSite();
    return;
  }

  // --deploy-list
  if (args.includes('--deploy-list')) {
    const { regNo } = await inquirer.prompt([
      {
        name: 'regNo',
        message: 'Enter your Registration Number:',
        validate: input => !!input || 'Registration number is required',
      }
    ]);

    const spinner = ora('🔍 Fetching your deployments...').start();

    try {
      const { data } = await axios.get(`${API_BASE}/deployments/${regNo}`);
      spinner.succeed(`✅ Found ${data.deployments.length} deployment(s):\n`);

      data.deployments.forEach((entry, idx) => {
        console.log(`${idx + 1}. 🌐 ${chalk.green(entry.site)}`);
        console.log(`   📁 Inspect: ${chalk.yellow(entry.inspect)}\n`);
      });
    } catch (err) {
      spinner.fail('No deployments found.');
      console.error(chalk.red(err.message));
    }

    return;
  }

  // --delete
  if (args.includes('--delete')) {
    const { regNo } = await inquirer.prompt([
      { name: 'regNo', message: 'Enter your Registration Number:' }
    ]);

    const spinner = ora('🔍 Fetching deployments...').start();
    try {
      const { data } = await axios.get(`${API_BASE}/deployments/${regNo}`);
      spinner.stop();

      if (!data.deployments.length) {
        console.log('🚫 No deployments found.');
        return;
      }

      const choices = data.deployments.map((entry, i) => ({
        name: `${i + 1}. ${entry.site}`,
        value: entry.site.split('/')[4] // UUID
      }));

      const { uuid } = await inquirer.prompt([
        { name: 'uuid', type: 'list', message: 'Select deployment to delete:', choices }
      ]);

      const deleteSpinner = ora('🗑️ Deleting deployment...').start();
      await axios.delete(`${API_BASE}/deployments/${regNo}/${uuid}`);
      deleteSpinner.succeed(chalk.red(`✅ Deleted deployment: ${uuid}`));
    } catch (err) {
      spinner.fail('Failed to fetch or delete.');
      console.error(chalk.red(err.message));
    }

    return;
  }
  // --version
  if (args.includes('--version')) {
  console.log(chalk.green.bold(`\n🔧 taptap-cli version: ${pkg.version}\n`));
  process.exit(0);

  }


// --about
if (args.includes('--about')) {
  console.log(chalk.cyan.bold('\n📘 About taptap-cli'));
  console.log(`
A simple and powerful CLI tool to deploy static HTML/CSS/JS projects directly from your terminal.

👨‍💻 Author: ${pkg.author}
📦 Package: ${pkg.name}
🏫 College: LPU, Punjab
📝 License: ${pkg.license}
📚 Description: ${pkg.description || 'No description provided.'}
  `);
  process.exit(0);
}

  // --deploy
  if (args.includes('--deploy')) {
    const { regNo, title } = await inquirer.prompt([
      {
        name: 'regNo',
        message: 'Enter your Registration Number:',
        validate: input => !!input || 'Registration number is required',
      },
      {
        name: 'title',
        message: 'Optional: Enter project title (for logs only):',
      }
    ]);

    const projectId = uuidv4();
    const zipPath = path.resolve(__dirname, '..', `${projectId}.zip`);
    
    // 🔧 Create debug copy in current directory
    const debugZipPath = path.join(process.cwd(), `debug-${projectId}.zip`);

    // Step 1: Check for index.html
    const spinner = ora('🔍 Looking for index.html...').start();
    const indexPath = path.join(process.cwd(), 'index.html');

    if (!fs.existsSync(indexPath)) {
      spinner.fail('index.html not found in current folder!');
      return;
    }

    spinner.succeed('✅ Found index.html');

    // Step 2: Zip folder
    const zipSpinner = ora('').start();
    try {
      // const files = fs.readdirSync(process.cwd());
      // files.forEach(f => console.log(` - ${f}`));

      await zipFolder(process.cwd(), zipPath);
      
      zipSpinner.succeed('✅ Folder zipped');
    } catch (err) {
      zipSpinner.fail('❌ Zipping failed');
      console.error(chalk.red(err.message));
      return;
    }

    // Step 3: Validate zip file
    const validateSpinner = ora('🔍 Validating zip file...').start();
    try {
      const zipStats = fs.statSync(zipPath);
    
      
      if (zipStats.size === 0) {
        validateSpinner.fail('❌ Zip file is empty!');
        return;
      }
      
      if (zipStats.size > 50 * 1024 * 1024) { // 50MB limit
        validateSpinner.fail('❌ Zip file too large (>50MB)!');
        return;
      }
      
      validateSpinner.succeed('✅ Zip file validated');
    } catch (err) {
      validateSpinner.fail('❌ Zip validation failed');
      console.error(chalk.red(err.message));
      return;
    }

    // Step 4: Upload with better error handling
    const uploadSpinner = ora('🚀 Uploading to live server...').start();
    try {
      const form = new FormData();
      form.append('site', fs.createReadStream(zipPath));
      form.append('reg_no', regNo);
      form.append('project_name', projectId); // UUID

      // 🔧 Add timeout and better headers
      const config = {
        headers: {
          ...form.getHeaders(),
          'User-Agent': 'LiveServe-CLI/1.0'
        },
        timeout: 60000, // 60 seconds timeout
        maxContentLength: 50 * 1024 * 1024, // 50MB max
        maxBodyLength: 50 * 1024 * 1024
      };

      // console.log(chalk.blue(`📤 Uploading ${(fs.statSync(zipPath).size / 1024).toFixed(2)} KB...`));

      const res = await axios.post(`${API_BASE}/upload`, form, config);

      uploadSpinner.succeed('✅ Upload successful!');
      console.log(`\n🔗 ${chalk.green(res.data.url)}`);
      console.log(`📁 Inspect: ${chalk.yellow(`${res.data.url}list/`)}\n`);
      
      // 🔧 Test the deployed site
      const testSpinner = ora('🧪 Testing deployed site...').start();
      try {
        const testRes = await axios.get(res.data.url, { timeout: 10000 });
        if (testRes.status === 200) {
          testSpinner.succeed('✅ Site is live and accessible!');
        }
      } catch (testErr) {
        testSpinner.warn('⚠️ Site deployed but may not be immediately accessible');
      }

    } catch (err) {
      uploadSpinner.fail('❌ Deployment failed.');
      
      if (err.code === 'ECONNABORTED') {
        console.error(chalk.red('❌ Upload timeout - file may be too large or connection slow'));
      } else if (err.response) {
        console.error(chalk.red(`❌ Server error ${err.response.status}: ${err.response.statusText}`));
        
        // 🔧 Better error details
        if (err.response.status === 502) {
          console.error(chalk.yellow('💡 502 Bad Gateway usually means:'));
          console.error(chalk.yellow('   • Server is temporarily down'));
          console.error(chalk.yellow('   • Zip file format issue'));
          console.error(chalk.yellow('   • Try again in a few minutes'));
        }
        
        if (err.response.data && typeof err.response.data === 'string' && err.response.data.length < 500) {
          console.error(chalk.red(`Response: ${err.response.data}`));
        }
      } else if (err.request) {
        console.error(chalk.red('❌ No response from server - check internet connection'));
      } else {
        console.error(chalk.red(`❌ Error: ${err.message}`));
      }

    } finally {
      // Step 5: Cleanup (but keep debug copy)
      const cleanSpinner = ora('🧹 Cleaning up temp files...').start();
      cleanSpinner.succeed('✅ Cleanup done ');
    }

    return;
  }

  // Default help
  console.log(`
  🔧 ${chalk.cyanBright('Taptap CLI')}

  Usage:
    ${chalk.green('--deploy')}           Deploy current folder to live URL
    ${chalk.green('--deploy-list')}      Show past deployments
    ${chalk.green('--preview')}          Preview site locally before deploy
    ${chalk.green('--delete')}           Delete a deployment
    ${chalk.green('--help')}             Show this help message
  `);
})();