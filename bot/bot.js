const TelegramBot = require("node-telegram-bot-api");
const Request = require("../mongo/mongoSchema");
const { extractUrls, getProductPrice } = require("../utils/utils");

const userStates = {};

function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function initializePriceTrackerBot(token) {
  const bot = new TelegramBot(token, { polling: true });

  // Start command handler
  bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;

    // Reset user state
    userStates[chatId] = { step: "welcome" };

    // Welcome message
    bot.sendMessage(
      chatId,
      "👋 Welcome to Price Tracker Bot!\n\n" +
        "I'll help you track product prices and notify you when they drop.\n\n" +
        "Let's get started! Please send me the full product link you want to track."
    );
  });

  // Message handler
  bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    // Ignore commands
    if (text.startsWith("/")) return;

    // Check if user has an active state
    if (!userStates[chatId]) {
      bot.sendMessage(chatId, "Please start by sending /start");
      return;
    }

    // Handle different stages of interaction
    switch (userStates[chatId].step) {
      case "welcome":
        // Validate and extract URL
        const extractedUrl = extractUrls(text)[0];
        console.log("extractedUrl on line 54 -> ", extractedUrl);
        if (isValidUrl(extractedUrl)) {
          try {
            // Attempt to get current product price
            const currentPrice = await getProductPrice(extractedUrl);

            // Store product details in user state
            userStates[chatId] = {
              step: "price_target",
              productLink: extractedUrl,
              currentPrice: currentPrice,
            };

            // Send current price and ask for target price
            bot.sendMessage(
              chatId,
              `🏷️ Current Product Price: ₹${currentPrice.toFixed(2)}\n\n` +
                "At what price would you like to be notified?\n" +
                "Please enter the target price (lower than current price)."
            );
          } catch (error) {
            bot.sendMessage(
              chatId,
              "❌ Sorry, I couldn't retrieve the product price. " +
                "Please check the URL and try again."
            );
            // Reset user state
            delete userStates[chatId];
          }
        } else {
          bot.sendMessage(
            chatId,
            "❌ That doesn't look like a valid URL. " +
              "Please send a complete product link (e.g., https://amazon.com/product)"
          );
        }
        break;

      case "price_target":
        // Validate price
        const price = parseFloat(text);
        const { currentPrice, productLink } = userStates[chatId];

        if (!isNaN(price) && price > 0 && price <= currentPrice) {
          try {
            // Save tracking request
            const request = new Request({
              userId: chatId,
              productLink: productLink,
              desiredPrice: price,
            });
            await request.save();

            // Send confirmation message
            bot.sendMessage(
              chatId,
              "✅ Price Tracking Enabled!\n\n" +
                `Product: ${productLink}\n` +
                `Current Price: ₹${currentPrice.toFixed(2)}\n` +
                `Alert Threshold: ₹${price.toFixed(2)}\n\n` +
                "I'll notify you when the price drops below your target! 🔔"
            );

            // Reset user state
            delete userStates[chatId];
          } catch (error) {
            bot.sendMessage(
              chatId,
              "Sorry, there was an error saving your request. Please try again."
            );
          }
        } else {
          bot.sendMessage(
            chatId,
            "❌ Please enter a valid price lower than the current product price."
          );
        }
        break;
    }
  });

  return bot;
}

module.exports = initializePriceTrackerBot;
