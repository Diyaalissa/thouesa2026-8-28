import puppeteer from 'puppeteer';
(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  page.on('console', msg => { if (msg.type() === 'error') console.log("C:", msg.text()); });
  page.on('pageerror', err => console.log("PE:", err.message));
  page.on('requestfailed', req => console.log("REQ:", req.url()));
  await page.goto('http://localhost:3000', { waitUntil: 'load', timeout: 10000 });
  await new Promise(r => setTimeout(r, 1000));
  await browser.close();
})();
