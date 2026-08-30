const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: 'screenshot_public.png' });
  
  // Click on "SENDER" role
  await page.evaluate(() => {
    // Assuming there's a button or we can just change state
    // Let's just find the sender tab in the header
    const buttons = Array.from(document.querySelectorAll('button'));
    const roleSelector = document.querySelector('.group.relative.flex.items-center.gap-1'); // Maybe?
  });
  
  await browser.close();
})();
