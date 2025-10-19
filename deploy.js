const { spawnSync } = require("child_process");
const { existsSync, writeFileSync } = require("fs");
const path = require("path");
require("dotenv").config();

const REPO_URL = "https://github.com/lyfe00011/levanter.git";
const APP_DIR = path.resolve("levanter");
const CONFIG_PATH = path.join(APP_DIR, "config.env");

const SESSION_ID = process.env.SESSION_ID;
if (!SESSION_ID) {
  console.error(
    "❌ Missing SESSION_ID in .env file. Please add it before deploying."
  );
  process.exit(1);
}

/**
 * Clone the repository if not already cloned
 */
function cloneRepository() {
  if (existsSync(APP_DIR)) {
    console.log("📁 Repository already exists, skipping clone.");
    return;
  }
  console.log("🚀 Cloning repository...");
  const result = spawnSync("git", ["clone", REPO_URL, "levanter"], {
    stdio: "inherit",
  });
  if (result.status !== 0) {
    console.error("❌ Failed to clone repository.");
    process.exit(1);
  }
}

/**
 * Pull latest updates from the repository
 */
function updateRepository() {
  console.log("🔄 Pulling latest updates...");
  const result = spawnSync("git", ["pull"], { cwd: APP_DIR, stdio: "inherit" });
  if (result.status !== 0) {
    console.warn(
      "⚠️ Failed to pull latest updates. You may need to check manually."
    );
  }
}

/**
 * Write the environment configuration file
 */
function writeConfig() {
  console.log("🛠️ Writing config.env...");
  const configContent = `VPS=true\nSESSION_ID=${SESSION_ID}`;
  writeFileSync(CONFIG_PATH, configContent);
}

/**
 * Install dependencies safely
 */
function installDependencies() {
  console.log("📦 Installing dependencies...");
  const result = spawnSync("yarn", ["install", "--check-files"], {
    cwd: APP_DIR,
    stdio: "inherit",
    shell: true, // ✅ this ensures Yarn from PATH is used
  });
  if (result.status !== 0) {
    console.error("❌ Failed to install dependencies.");
    process.exit(1);
  }
}

/**
 * Start or restart PM2 process
 */
function startPM2() {
  console.log("🔥 Starting PM2...");

  const result = spawnSync(
    "yarn",
    ["pm2", "startOrReload", "ecosystem.config.js"],
    { cwd: APP_DIR, stdio: "pipe", shell: true } // changed stdio to 'pipe' so we can capture output
  );

  console.log("📜 PM2 stdout:", result.stdout?.toString() || "No stdout");
  console.log("⚠️ PM2 stderr:", result.stderr?.toString() || "No stderr");

  if (result.error) {
    console.error("💥 PM2 spawn error:", result.error);
  }

  console.log("📊 PM2 exit code:", result.status);

  if (result.status !== 0) {
    console.error("❌ PM2 failed to start. Check logs above for details.");
    process.exit(1);
  }
}


/**
 * Deploy flow
 */
function deploy() {
  cloneRepository();
  updateRepository();
  writeConfig();
  installDependencies();
  startPM2();
  console.log("✅ Deployment completed successfully!");
}

deploy();
