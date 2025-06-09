// 🌐 Load .env variables and module aliases
require("dotenv").config();
require("module-alias/register");

// 🛠 Express server for uptime (REQUIRED for Render + UptimeRobot)
const express = require("express");
const app = express();
const port = process.env.PORT || 3000;

app.get("/", (req, res) => res.send("Bot is alive!"));
app.listen(port, () => {
  console.log(`Web server running on port ${port}`);
});

// 🔧 Load custom extenders
require("@helpers/extenders/Message");
require("@helpers/extenders/Guild");
require("@helpers/extenders/GuildChannel");

// 🧠 Helpers
const { checkForUpdates } = require("@helpers/BotUtils");
const { initializeMongoose } = require("@src/database/mongoose");
const { BotClient } = require("@src/structures");
const { validateConfiguration } = require("@helpers/Validator");

// ✅ Validate config
validateConfiguration();

// 🤖 Initialize bot client
const client = new BotClient();
client.loadCommands("src/commands");
client.loadContexts("src/contexts");
client.loadEvents("src/events");

// 🚨 Handle unhandled promise rejections
process.on("unhandledRejection", (err) =>
  client.logger.error(`Unhandled exception`, err)
);

// 🚀 Main Async Init
(async () => {
  // Check for updates
  await checkForUpdates();

  // Launch dashboard if enabled
  if (client.config.DASHBOARD.enabled) {
    client.logger.log("Launching dashboard");
    try {
      const { launch } = require("@root/dashboard/app");
      await launch(client); // Dashboard also handles DB
    } catch (ex) {
      client.logger.error("Failed to launch dashboard", ex);
    }
  } else {
    await initializeMongoose(); // DB init (non-dashboard mode)
  }

  // ✅ Login bot
  await client.login(process.env.BOT_TOKEN);
})();
