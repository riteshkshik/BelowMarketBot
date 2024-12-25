require("dotenv").config();
const app = require("express")();
const connectDB = require("./mongo/mongoConnect");
const {initializePriceTrackerBot} = require("./bot/bot");
const setupPriceCheckingCron = require("./services/price-tracking-service");

// Main async function to start the application
async function startApp() {
  try {
    // Connect to MongoDB
    await connectDB();

    // Initialize the bot with token from environment variable
    const bot = await initializePriceTrackerBot(process.env.TELEGRAM_BOT_TOKEN);
    setupPriceCheckingCron();

    console.log("Bot is running and ready to track prices!");
  } catch (error) {
    console.error("Failed to start application:", error);
    process.exit(1);
  }
}

app.listen(5000, () => {
  console.log("Server is running on port 5000");

  // Run the application
  startApp();
});

app.get("/test", (req, res) => {
  res.send("Server is working fine!");
});


module.exports = app;
