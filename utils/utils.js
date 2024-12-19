const puppeteer = require("puppeteer");

const extractUrls = (text) => {
  console.log("extractUrls in utils -> ", text);
  const urlRegex = /(https?:\/\/[^\s]+)/g;

  const urls = text.match(urlRegex);

  return urls || [];
};

const getProductPrice = async (url) => {
  const isProduction = process.env.NODE_ENV === "production";

  const options = {
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--no-first-run",
      "--no-zygote",
      "--disable-gpu",
    ],
    headless: "new",
    executablePath: isProduction
      ? "/usr/bin/google-chrome"
      : "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", // Adjust this path for your Windows Chrome installation
  };

  const browser = await puppeteer.launch(options);

  try {
    const page = await browser.newPage();

    await page.setRequestInterception(true);
    page.on("request", (request) => {
      const resourceType = request.resourceType();
      if (["image", "stylesheet", "font"].includes(resourceType)) {
        request.abort();
      } else {
        request.continue();
      }
    });

    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });

    let priceSelector;
    if (url.includes("flipkart")) {
      priceSelector = ".Nx9bqj.CxhGGd";
    } else if (url.includes("amazon") || url.includes("amzn.in")) {
      priceSelector = ".a-price-whole";
    } else {
      throw new Error("Unsupported URL");
    }

    const price = await page.$eval(priceSelector, (el) => el.innerText.trim());
    const cleanedPrice = parseFloat(price.replace(/[^0-9.]/g, ""));

    return cleanedPrice;
  } catch (error) {
    console.error("Price scraping error:", error.message);
    // throw error;
  } finally {
    await browser.close();
  }
};

getProductPrice("https://amzn.in/d/d9ZOo96");

module.exports = {
  extractUrls,
  getProductPrice,
};
