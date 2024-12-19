const puppeteer = require("puppeteer");

const extractUrls = (text) => {
    console.log("extractUrls in utils -> ", text);
    const urlRegex = /(https?:\/\/[^\s]+)/g;

    const urls = text.match(urlRegex);

    return urls || [];
}

const getProductPrice = async (url) => {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-software-rasterizer'],
    });

    try {
        const page = await browser.newPage();

        await page.setRequestInterception(true);
        page.on('request', (request) => {
            const resourceType = request.resourceType();
            if (['image', 'stylesheet', 'font'].includes(resourceType)) {
                request.abort();
            } else {
                request.continue();
            }
        });

        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

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
        console.error('Price scraping error:', error.message);
        // throw error;
    } finally {
        await browser.close();
    }
}


getProductPrice('https://amzn.in/d/d9ZOo96');

module.exports = {
    extractUrls,
    getProductPrice
}