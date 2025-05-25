const puppeteer = require("puppeteer");

const extractUrls = (text) => {
  console.log("extractUrls in utils -> ", text);
  const urlRegex = /(https?:\/\/[^\s]+)/g;

  const urls = text.match(urlRegex);

  return urls || [];
};

const getProductPrice = async (url) => {
  let chrome = {};
  let puppeteer;

  if (process.env.AWS_LAMBDA_FUNCTION_VERSION) {
    chrome = require("chrome-aws-lambda");
    puppeteer = require("puppeteer-core");
  } else {
    puppeteer = require("puppeteer");
  }

  let options = {};

  if (process.env.AWS_LAMBDA_FUNCTION_VERSION) {
    options = {
      args: [...chrome.args, "--hide-scrollbars", "--disable-web-security"],
      defaultViewport: chrome.defaultViewport,
      executablePath: await chrome.executablePath,
      headless: true,
      ignoreHTTPSErrors: true,
    };
  }

  let browser = await puppeteer.launch(options);

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
    console.log("current price -> ", cleanedPrice, url);
    return cleanedPrice;
  } catch (error) {
    console.error("Price scraping error:", error.message);
  } finally {
    await browser.close();
  }
};

module.exports = {
  extractUrls,
  getProductPrice
};
