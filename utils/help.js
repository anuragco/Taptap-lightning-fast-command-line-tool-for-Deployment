const chalk = require('chalk');
const packageJson = require('../package.json'); 

function showHelp() {
  const header = chalk.bold.cyan('┌─────────────────────────────────────────────────────────────────┐');
  const footer = chalk.bold.cyan('└─────────────────────────────────────────────────────────────────┘');
  const title = chalk.bold.white('TAPTAP CLI');
  const subtitle = chalk.gray('Lightning-fast static site deployment with zero configuration');
  const version = chalk.dim.gray(`v${packageJson.version}`);
  
  console.log(`
${header}
${chalk.bold.cyan('│')}  ${title} ${version}                                    ${chalk.bold.cyan('│')}
${chalk.bold.cyan('│')}  ${subtitle}        ${chalk.bold.cyan('│')}
${footer}

${chalk.bold.yellow('⚡ CORE COMMANDS')}
  ${chalk.green('taptap --init')}         ${chalk.white('Initialize new project with template files')}
  ${chalk.green('taptap --deploy')}       ${chalk.white('Deploy current folder to live URL')} ${chalk.red('(auth required)')}
  ${chalk.green('taptap --preview')}      ${chalk.white('Preview site locally before deploying')}
  ${chalk.green('taptap --open')}         ${chalk.white('Open most recent deployment in browser')}

${chalk.bold.yellow('📊 DEPLOYMENT MANAGEMENT')}
  ${chalk.green('taptap --deploy-list')}  ${chalk.white('Show all past deployments')} ${chalk.red('(auth required)')}
  ${chalk.green('taptap --delete')}       ${chalk.white('Delete selected deployment')} ${chalk.red('(auth required)')}
  ${chalk.green('taptap --logs')}         ${chalk.white('Show local deployment history')}

${chalk.bold.yellow('🔐 AUTHENTICATION')}
  ${chalk.green('taptap --register')}     ${chalk.white('Create new CLI user account')}
  ${chalk.green('taptap --login')}        ${chalk.white('Login using secure browser auth')} ${chalk.dim.gray('(recommended)')}
  ${chalk.green('taptap --login --open')}  ${chalk.white('Login with auto-open browser')}
  ${chalk.green('taptap --login --direct')} ${chalk.white('Direct CLI login (email/password)')}
  ${chalk.green('taptap --logout')}       ${chalk.white('Logout current session')}
  ${chalk.green('taptap --logout -s')}    ${chalk.white('Silent logout without output')}
  ${chalk.green('taptap --whoami')}       ${chalk.white('Show current logged-in user info')}

${chalk.bold.yellow('🛠️  UTILITY COMMANDS')}
  ${chalk.green('taptap --update')}       ${chalk.white('Check for CLI updates')}
  ${chalk.green('taptap --version')}      ${chalk.white('Show current CLI version')}
  ${chalk.green('taptap --about')}        ${chalk.white('Show CLI and author information')}
  ${chalk.green('taptap --help')}         ${chalk.white('Display this help message')}

${chalk.bold.yellow('📖 QUICK START GUIDE')}
  ${chalk.dim.gray('1.')} ${chalk.green('taptap --register')}   ${chalk.dim.gray('→ Create your account')}
  ${chalk.dim.gray('2.')} ${chalk.green('taptap --login')}      ${chalk.dim.gray('→ Authenticate your session')}
  ${chalk.dim.gray('3.')} ${chalk.green('taptap --deploy')}     ${chalk.dim.gray('→ Deploy your site instantly')}

${chalk.bold.yellow('💡 TIPS & BEST PRACTICES')}
  • Always run ${chalk.green('--preview')} before deploying to catch issues early
  • Use ${chalk.green('--whoami')} to verify your authentication status
  • Sites are automatically removed after ${chalk.yellow('120 days')} (contact support for extended hosting)
  • Ensure your project has an ${chalk.cyan('index.html')} file in the root directory

${chalk.bold.yellow('🔗 SUPPORT & RESOURCES')}
  Documentation: ${chalk.cyan('https://www.npmjs.com/package/taptap-cli')}
  Report Issues: ${chalk.cyan('aws.anu.co@gmail.com')}
  GitHub Repo:   ${chalk.cyan('https://github.com/anuragco')}

${chalk.dim.gray('─────────────────────────────────────────────────────────────────')}
${chalk.dim.gray('Created with ❤️  by Anurag Anand | Licensed under ISC')}
`);
}

function showVersion() {
  console.log(`${chalk.green('Taptap CLI')} ${chalk.dim.gray('v' + packageJson.version)}`);
}

function showAbout() {
  console.log(`
${chalk.bold.cyan('About Taptap CLI')}

${chalk.yellow('Author:')} Anurag Anand
${chalk.yellow('University:')} LPU Punjab
${chalk.yellow('Version:')} ${packageJson.version}
${chalk.yellow('License:')} ISC

${chalk.yellow('Description:')}
A lightning-fast command-line tool for deploying static HTML, CSS, and 
JavaScript projects to remote servers with zero configuration hassle.

${chalk.yellow('Purpose:')}
Making deployment simple and accessible for developers, students, and 
teams working on static web projects.

${chalk.dim.gray('Created with passion for simplifying web deployment workflows.')}
`);
}

module.exports = {
  showHelp,
  showVersion,
  showAbout
};