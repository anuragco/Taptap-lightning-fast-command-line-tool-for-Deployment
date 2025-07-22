const axios = require("axios");
const inquirer = require("inquirer");
const ora = require("ora");
const chalk = require("chalk");
const fs = require("fs");
const path = require("path");
const AdmZip = require("adm-zip");
const { getAuth } = require("../utils/auth");

const AGENT_API_BASE = "https://api.checkscript.site";
const START_ENDPOINT = "/api/v1/agent/create-project";
const STATUS_ENDPOINT = "/api/v1/agent/status/";
const RESPOND_ENDPOINT = "/api/v1/agent/respond/";

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function handleAgentCommand(initialPrompt) {
  const spinner = ora("🚀 Contacting Taptap Agent...").start();
  const user = getAuth();
  if (!user) {
    spinner.fail(chalk.red("Authentication error. Please try logging in again."));
    return;
  }
  
  try {
    const startResponse = await axios.post(`${AGENT_API_BASE}${START_ENDPOINT}`, 
      { prompt: initialPrompt },
      {
        headers: {
          "x-user-uuid": user.uuid,
          "x-user-email": user.email,
        },
      }
    );
    
    const { taskId } = startResponse.data;
    if (!taskId) {
      spinner.fail("Failed to start agent task on the server.");
      return;
    }

    spinner.succeed(`Agent task started with ID: ${taskId}`);
    await sleep(1500);
    spinner.succeed("Connection established. Analyzing prompt...");
    await sleep(1500);
    spinner.start("Deconstructing user request into actionable steps...");
    await sleep(1500);
    spinner.succeed("Analysis complete. Initiating build plan...");
    spinner.start("Polling server for agent status...");

    let isDone = false;
    while (!isDone) {
      await sleep(3000);
      
      const statusResponse = await axios.get(`${AGENT_API_BASE}${STATUS_ENDPOINT}${taskId}`, {
        headers: {
          "x-user-uuid": user.uuid,
          "x-user-email": user.email,
        },
      });

      const { status, message, result } = statusResponse.data;

      spinner.text = `🤖 Agent status: ${chalk.yellow(message)}`;

      if (status === 'complete') {
        spinner.succeed(chalk.green("Agent has completed the project!"));
        
        if (result.final_answer) {
            console.log(chalk.cyan.bold("\nFinal Message from Agent:"));
            console.log(result.final_answer);
        }

        if (result.downloadUrl) {
          spinner.start("Downloading project files...");
          const downloadUrl = `${AGENT_API_BASE}${result.downloadUrl}`;
          
          const downloadResponse = await axios.get(downloadUrl, {
            responseType: 'arraybuffer',
            headers: {
              "x-user-uuid": user.uuid,
              "x-user-email": user.email,
            },
          });
          
          spinner.succeed("Download complete.");
          spinner.start("Extracting files...");

          try {
            const zip = new AdmZip(downloadResponse.data);
            zip.extractAllTo(process.cwd(), true);
            spinner.succeed(chalk.green("✔ Project extracted to your current directory!"));
          } catch (e) {
            spinner.fail(chalk.red(`Failed to extract project files. Error: ${e.message}`));
          }
        }
        isDone = true;

      } else if (status === 'waiting_for_input') {
          spinner.stop();
          const { userAnswer } = await inquirer.prompt([
              { type: "input", name: "userAnswer", message: chalk.yellow(result.question) },
          ]);
          await axios.post(`${AGENT_API_BASE}${RESPOND_ENDPOINT}${taskId}`, { answer: userAnswer }, {
            headers: {
              "x-user-uuid": user.uuid,
              "x-user-email": user.email,
            },
          });
          spinner.start("🤖 Sending your response...");

      } else if (status === 'error') {
        spinner.fail(chalk.red(`Agent encountered an error: ${message}`));
        isDone = true;
      }
    }

  } catch (error) {
    spinner.fail(chalk.red("Failed to communicate with the agent."));
    if (error.response) {
      console.error(`Error ${error.response.status}: ${error.response.data.error || 'Unknown server error'}`);
    } else {
      console.error("An unexpected error occurred:", error.message);
    }
  }
}

module.exports = handleAgentCommand;
