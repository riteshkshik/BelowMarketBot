const cron = require("node-cron");
const Request = require("../mongo/mongoSchema");
const { getBotInstance } = require("../bot/bot");
const { getProductPrice } = require("../utils/utils");

async function startPriceCheckingJob() {
  const requests = await Request.find({ status: "active" });

  for (let request of requests) {
    try {
      let currentPrice = 9999999999;
      try {
        currentPrice = await getProductPrice(request.productLink);
      } catch (err) {
        console.log("err in price tracking service -> ", err.message);
      }

      if (currentPrice !== undefined && currentPrice < request.desiredPrice) {
        const bot = getBotInstance();
        bot.sendMessage(
          request.userId,
          `🚨 Price Alert! 🚨\n\n` +
            `The product you're tracking has dropped to ₹${currentPrice}.\n` +
            `Your target was ₹${request.desiredPrice}.\n\n` +
            `Product Link: ${request.productLink}`
        );
        request.status = "paused";
        await request.save();
      }
    } catch (error) {
      console.error("Price checking error:", error);
    }
  }
}

// Cron job to run every hour
function setupPriceCheckingCron() {
  console.log("Price Tracking service has been enabled!");
  cron.schedule("0 * * * *", () => {
    startPriceCheckingJob();
  });
  startPriceCheckingJob();
}

module.exports = setupPriceCheckingCron;
