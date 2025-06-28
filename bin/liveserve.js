#!/usr/bin/env node

const inquirer = require("inquirer");
const chalk = require("chalk");
const ora = require("ora");
const path = require("path");
const fs = require("fs");
const axios = require("axios");
const FormData = require("form-data");
const { v4: uuidv4 } = require("uuid");
const zipFolder = require("../utils/zipFolder");
const previewSite = require("../utils/localServer");
const pkg = require("../package.json");
const auth = require("../utils/auth");
const API_BASE = "https://api.checkscript.site";
const open = require("open");
const { showHelp, showVersion, showAbout } = require("../utils/help");

(async () => {
  const args = process.argv.slice(2);

  let user = null;

  const safeArgs = [
    // Authentication commands
    "--login",
    "login",
    "-l",
    "--l",
    "--logout",
    "logout",
    "--logout --silent",
    "logout -s",
    "--register",
    "register",
    "-r",

    // Utility commands (no auth required)
    "--version",
    "version",
    "-v",
    "--v",
    "--about",
    "about",
    "-a",
    "--a",
    "--help",
    "help",
    "-h",
    "--h",
    "--update",
    "update",
    "-u",
    "--u",

    // Core commands (no auth required)
    "--init",
    "init",
    "-i",
    "--i",
    "--preview",
    "preview",
    "-p",
    "--p",
  ];
  const isSafe = args.some((arg) => safeArgs.includes(arg));

  const isSafeCommand = args.some((arg) => safeArgs.includes(arg));

  const CLI_ROOT = path.resolve(__dirname, "..");
  const consentFile = path.join(CLI_ROOT, ".taptap_mit_consent");

  async function ensureLicenseAccepted() {
    if (!fs.existsSync(consentFile)) {
      console.log("\n📜 This software is licensed under the MIT License.\n");
      console.log(
        "By using Taptap CLI, you agree to the terms of the MIT license.\n"
      );
      console.log(
        "📜 By using this tool, you agree to the terms in terms.txt or policy.md"
      );

      const { accepted } = await inquirer.prompt([
        {
          type: "confirm",
          name: "accepted",
          message: "Do you accept the MIT license terms?",
          default: false,
        },
      ]);

      if (!accepted) {
        console.log(
          "❌ You must accept the license terms to use this software."
        );
        process.exit(1);
      }

      fs.writeFileSync(consentFile, "MIT license accepted");
    }
  }
  await ensureLicenseAccepted();

  if (!isSafeCommand) {
    user = auth.getAuth();
    if (!user) {
      console.log(
        chalk.red(
          "🚫 You must be logged in to use this command. Run `taptap login` first."
        )
      );
      process.exit(1);
    }
  }

  if (
    args.includes("--register") ||
    args[0] === "register" ||
    args[0] === "--r"
  ) {
    const { registerCLIUser } = require("../utils/auth");
    await registerCLIUser();
    return;
  }

  // ✅ Login handler
  if (args.includes("--login") || args[0] === "login") {
    const auth = require("../utils/auth");
    if (args.includes("--direct")) {
      await auth.directLogin();
    } else {
      await auth.browserLogin(args.includes("--open"));
    }
    return;
  }

  // ✅ Logout handler
  if (args.includes("--logout") || args[0] === "logout" || args[0] === "--l") {
    const silent = args.includes("--silent") || args.includes("-s");
    const auth = require("../utils/auth");
    auth.logout();
    if (!silent) console.log("👋 Logged out successfully.");
    process.exit(0);
  }

  const notifierModule = await import("update-notifier");
  const updateNotifier = notifierModule.default;
  const notifier = updateNotifier({ pkg, updateCheckInterval: 0 });

  if (notifier.update) {
    console.log(
      chalk.yellow(
        `\n🚨 New version available: ${notifier.update.latest}. You're using ${pkg.version}`
      )
    );
    console.log(`Run ${chalk.cyan(`npm i -g taptap-cli`)} to update.\n`);

    // 🔒 Block execution if mandatory
    if (notifier.update.latest.split(".")[2] !== pkg.version.split(".")[2]) {
      console.log(
        chalk.red("⚠️  Mandatory update required! Please update the CLI.\n")
      );
      process.exit(1);
    }
  }

  function initProject() {
    const files = {
      "index.html":
        '<!DOCTYPE html>\n<html>\n<head>\n  <title>My Site</title>\n  <link rel="stylesheet" href="style.css">\n</head>\n<body>\n  <h1>Hello from Taptap CLI!</h1>\n  <script src="script.js"></script>\n</body>\n</html>',
      "style.css":
        "body { font-family: Arial; background: #f2f2f2; text-align: center; padding: 50px; }",
      "script.js": 'console.log("Welcome to Taptap CLI Project!");',
      "README.md": "# My Static Site\nDeployed with Taptap CLI.",
    };

    for (const [file, content] of Object.entries(files)) {
      if (!fs.existsSync(file)) {
        fs.writeFileSync(file, content);
        console.log(chalk.green(`✔ Created ${file}`));
      } else {
        console.log(chalk.yellow(`⚠ ${file} already exists, skipping.`));
      }
    }

    console.log(
      chalk.blueBright("\n✅ Project initialized. Start building!\n")
    );
  }

  function showLogs() {
    const logFile = path.join(__dirname, "..", ".taptap-logs.json");

    if (!fs.existsSync(logFile)) {
      console.log(chalk.red("🚫 No deploy logs found."));
      return;
    }

    let logs;
    try {
      const raw = fs.readFileSync(logFile, "utf-8").trim();
      if (!raw) throw new Error("Empty log file");
      logs = JSON.parse(raw);
    } catch (err) {
      console.log(chalk.red("🚫 Failed to read logs: Invalid or empty JSON."));
      return;
    }

    if (!logs.length) {
      console.log(chalk.red("🚫 No entries in logs."));
      return;
    }

    console.log(chalk.blueBright("\n📦 Deployment Logs:\n"));
    logs.forEach((log, index) => {
      console.log(`${index + 1}. ${chalk.green(log.project)} - ${log.url}`);
      console.log(`   ${chalk.gray(new Date(log.timestamp).toLocaleString())}`);
    });
  }

  if (args.includes("--whoami") || args[0] === "whoami" || args[0] === "-w") {
    const { getAuth } = require("../utils/auth");
    const auth = getAuth();

    if (!auth) {
      console.log(chalk.red("🚫 Not logged in. Use `taptap login` first."));
      process.exit(1);
    }

    console.log(chalk.green.bold("\n👤 Logged in as:"));
    console.log(`📧 Email : ${chalk.cyan(auth.email)}`);
    console.log(`🙋 Name  : ${chalk.cyan(auth.name || "Unknown")}`);
    console.log(`🔗 Account Number : ${chalk.cyan(auth.unique_id || "N/A")}`);
    console.log(`🕒 Since : ${new Date(auth.loggedInAt).toLocaleString()}\n`);
    process.exit(0);
  }

  if (
    args.includes("--init") ||
    args[0] === "init" ||
    args[0] === "-i" ||
    args[0] === "--i"
  ) {
    initProject();
  } else if (
    args.includes("--logs") ||
    args[0] === "logs" ||
    args[0] === "-l" ||
    args[0] === "--l"
  ) {
    showLogs();
  } else if (
    args.includes("--update") ||
    args[0] === "update" ||
    args[0] === "-u"
  ) {
    console.log(
      chalk.cyan(
        `\nYou're on v${pkg.version}. Latest is ${
          notifier.update?.latest || "same"
        }.\n`
      )
    );
    process.exit(0);
  }

  if (
    args.includes("--preview") ||
    args[0] === "preview" ||
    args[0] === "-p" ||
    args[0] === "--p"
  ) {
    await previewSite();
    return;
  }

  // --deploy-list
  if (
    args.includes("--deploy-list") ||
    args[0] === "deploy-list" ||
    args[0] === "-dl" ||
    args[0] === "--dl"
  ) {
    const { confirm } = await inquirer.prompt([
      {
        type: "input",
        name: "confirm",
        message: "Fetch your deployments linked to your account? (y/n):",
        validate: (input) => {
          const val = input.trim().toLowerCase();
          return ["y", "n", "yes", "no"].includes(val) || "Please enter y/n";
        },
      },
    ]);

    const answer = confirm.trim().toLowerCase();
    if (answer !== "y" && answer !== "yes") {
      console.log(chalk.yellow("❌ Operation cancelled."));
      return;
    }

    const spinner = ora("🔍 Fetching your deployments...").start();

    try {
      const { data } = await axios.get(
        `${API_BASE}/deployments/${user.unique_id}`,
        {
          headers: {
            "x-user-uuid": user.uuid,
            "x-user-email": user.email,
          },
        }
      );
      spinner.succeed(`✅ Found ${data.deployments.length} deployment(s):\n`);

      data.deployments.forEach((entry, idx) => {
        console.log(`${idx + 1}. 🌐 ${chalk.green(entry.site)}`);
        console.log(`   📁 Inspect: ${chalk.yellow(entry.inspect)}\n`);
      });
    } catch (err) {
      spinner.fail("No deployments found.");
      console.error(chalk.red(err.message));
    }

    return;
  }

  if (
    args.includes("--open") ||
    args[0] === "open" ||
    args[0] === "-o" ||
    args[0] === "--o"
  ) {
    const logFile = path.join(__dirname, "..", ".taptap-logs.json");
    if (!fs.existsSync(logFile)) {
      console.log(chalk.red("🚫 No deploy logs found."));
      process.exit(1);
    }

    const logs = JSON.parse(fs.readFileSync(logFile));
    if (!logs.length) {
      console.log(chalk.red("🚫 No deployments found."));
      process.exit(1);
    }

    const latest = logs[logs.length - 1];
    console.log(chalk.blue(`🌐 Opening ${latest.url}...`));
    await open(latest.url);
    return;
  }

  // --delete
  if (
    args.includes("--delete") ||
    args[0] === "delete" ||
    args[0] === "-del" ||
    args[0] === "-d" ||
    args[0] === "--d"
  ) {
    const spinner = ora("🔍 Fetching deployments...").start();
    try {
      const { data } = await axios.get(
        `${API_BASE}/deployments/${user.unique_id}`,
        {
          headers: {
            "x-user-uuid": user.uuid,
            "x-user-email": user.email,
          },
        }
      );
      spinner.stop();

      if (!data.deployments.length) {
        console.log("🚫 No deployments found.");
        return;
      }

      const choices = data.deployments.map((entry, i) => ({
        name: `${i + 1}. ${entry.site}`,
        value: entry.site.split("/")[4], // project name or domain
      }));

      const { uuid } = await inquirer.prompt([
        {
          name: "uuid",
          type: "list",
          message: "Select deployment to delete:",
          choices,
        },
      ]);

      const deleteSpinner = ora("🗑️ Deleting deployment...").start();
      await axios.delete(`${API_BASE}/deployments/${uuid}`, {
        headers: {
          "x-user-uuid": user.uuid,
          "x-user-email": user.email,
        },
      });

      deleteSpinner.succeed(chalk.red(`✅ Deleted deployment: ${uuid}`));
    } catch (err) {
      spinner.fail("Failed to fetch or delete.");
      console.error(chalk.red(err.message));
    }

    return;
  }

  // --version
  if (
    args.includes("--version") ||
    args[0] === "version" ||
    args[0] === "-v" ||
    args[0] === "--v"
  ) {
    showVersion();
    process.exit(0);
  }

  if (
    process.argv.length === 2 ||
    process.argv.includes("--help") ||
    process.argv.includes("-h") ||
    args[0] === "help" ||
    args[0] === "--h"
  ) {
    showHelp();
    process.exit(0);
  }

  // --about
  if (
    args.includes("--about") ||
    args[0] === "about" ||
    args[0] === "-a" ||
    args[0] === "--a"
  ) {
    showAbout();
    process.exit(0);
  }

  // --deploy
  if (
    args.includes("--deploy") ||
    args[0] === "-d" ||
    args[0] === "deploy" ||
    args[0] === "--d"
  ) {
    const { confirm, title } = await inquirer.prompt([
      {
        type: "input",
        name: "confirm",
        message: "Proceed with deployment linked to your account? (y/n):",
        validate: (input) => {
          const val = input.trim().toLowerCase();
          return ["y", "n", "yes", "no"].includes(val) || "Please enter y/n";
        },
      },
      {
        name: "title",
        message: "Optional: Enter project title (for logs only):",
      },
    ]);

    const confirmAnswer = confirm.trim().toLowerCase();
    if (confirmAnswer !== "y" && confirmAnswer !== "yes") {
      console.log(chalk.yellow("❌ Deployment cancelled."));
      return;
    }

    let projectId = uuidv4();
    const domainIndex = args.findIndex((arg) => arg === "--domain");
    if (domainIndex !== -1 && args[domainIndex + 1]) {
      const customId = args[domainIndex + 1].trim().toLowerCase();
      if (!/^[a-z0-9\-]+$/i.test(customId)) {
        console.log(
          chalk.red(
            "❌ Invalid domain name. Use only letters, numbers, and dashes."
          )
        );
        return;
      }
      projectId = customId;
    }

    const zipPath = path.resolve(__dirname, "..", `${projectId}.zip`);

    // Step 1: Check for index.html
    const spinner = ora("🔍 Looking for index.html...").start();
    const indexPath = path.join(process.cwd(), "index.html");

    if (!fs.existsSync(indexPath)) {
      spinner.fail("index.html not found in current folder!");
      return;
    }

    spinner.succeed("✅ Found index.html");

    // Step 2: Zip folder
    const zipSpinner = ora("").start();
    try {
      // const files = fs.readdirSync(process.cwd());
      // files.forEach(f => console.log(` - ${f}`));

      await zipFolder(process.cwd(), zipPath);

      zipSpinner.succeed("✅ Folder zipped");
    } catch (err) {
      zipSpinner.fail("❌ Zipping failed");
      console.error(chalk.red(err.message));
      return;
    }

    // Step 3: Validate zip file
    const validateSpinner = ora("🔍 Validating zip file...").start();
    try {
      const zipStats = fs.statSync(zipPath);

      if (zipStats.size === 0) {
        validateSpinner.fail("❌ Zip file is empty!");
        return;
      }

      if (zipStats.size > 250 * 1024 * 1024) {
        // 250MB limit
        validateSpinner.fail("❌ Zip file too large (>250MB)!");
        return;
      }

      validateSpinner.succeed("✅ Zip file validated");
    } catch (err) {
      validateSpinner.fail("❌ Zip validation failed");
      console.error(chalk.red(err.message));
      return;
    }

    // Step 4: Upload with better error handling
    const uploadSpinner = ora("🚀 Uploading to live server...").start();
    try {
      const form = new FormData();
      form.append("site", fs.createReadStream(zipPath));
      form.append("reg_no", user.unique_id);
      form.append("project_name", projectId); // UUID

      // 🔧 Add timeout and better headers
      const config = {
        headers: {
          ...form.getHeaders(),
          "User-Agent": "LiveServe-CLI/1.0.16",
          "x-user-uuid": user.uuid,
          "x-user-email": user.email,
          "x-endpoint": "deploy",
        },
        timeout: 60000,
        maxContentLength: 250 * 1024 * 1024,
        maxBodyLength: 250 * 1024 * 1024,
      };

      // console.log(chalk.blue(`📤 Uploading ${(fs.statSync(zipPath).size / 1024).toFixed(2)} KB...`));

      const res = await axios.post(`${API_BASE}/upload`, form, config);

      uploadSpinner.succeed("✅ Upload successful!");
      console.log(`\n🔗 ${chalk.green(res.data.url)}`);
      console.log(`📁 Inspect: ${chalk.yellow(`${res.data.url}list/`)}\n`);

      const logFile = path.join(__dirname, "..", ".taptap-logs.json");
      let logs = [];
      if (fs.existsSync(logFile)) {
        logs = JSON.parse(fs.readFileSync(logFile));
      }
      logs.push({
        project: title || "Untitled",
        url: res.data.url,
        timestamp: Date.now(),
      });
      fs.writeFileSync(logFile, JSON.stringify(logs, null, 2));

      // 🔧 Test the deployed site
      const testSpinner = ora("🧪 Testing deployed site...").start();
      try {
        const testRes = await axios.get(res.data.url, { timeout: 10000 });
        if (testRes.status === 200) {
          testSpinner.succeed("✅ Site is live and accessible!");
        }
      } catch (testErr) {
        testSpinner.warn(
          "⚠️ Site deployed but may not be immediately accessible"
        );
      }
    } catch (err) {
      uploadSpinner.fail("❌ Deployment failed.");

      if (err.code === "ECONNABORTED") {
        console.error(
          chalk.red(
            "❌ Upload timeout - file may be too large or connection slow"
          )
        );
      } else if (err.response) {
        console.error(
          chalk.red(
            `❌ Server error ${err.response.status}: ${err.response.statusText}`
          )
        );

        // 🔧 Better error details
        if (err.response.status === 502) {
          console.error(chalk.yellow("💡 502 Bad Gateway usually means:"));
          console.error(chalk.yellow("   • Server is temporarily down"));
          console.error(chalk.yellow("   • Zip file format issue"));
          console.error(chalk.yellow("   • Try again in a few minutes"));
        }

        if (
          err.response.data &&
          typeof err.response.data === "string" &&
          err.response.data.length < 500
        ) {
          console.error(chalk.red(`Response: ${err.response.data}`));
        }

        if (err.response) {
          const status = err.response.status;
          const msg = err.response.data?.message || "";

          if (status === 409) {
            console.error(
              chalk.yellow("⚠️ The domain name you provided is already in use.")
            );
            console.error(
              chalk.yellow("💡 Tip: Use a different domain with: ") +
                chalk.cyan("--domain yourname")
            );
          }

          if (msg && msg.length < 500) {
            console.error(chalk.red(`📢 Message: ${msg}`));
          }
        }
      } else if (err.request) {
        console.error(
          chalk.red("❌ No response from server - check internet connection")
        );
      } else {
        console.error(chalk.red(`❌ Error: ${err.message}`));
      }
    } finally {
      // Step 5: Cleanup (but keep debug copy)
      const cleanSpinner = ora("🧹 Cleaning up temp files...").start();
      cleanSpinner.succeed("✅ Cleanup done ");
    }

    return;
  }
})();
