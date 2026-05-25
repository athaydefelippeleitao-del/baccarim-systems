const { spawn } = require('child_process');
const puppeteer = require('puppeteer');

const preview = spawn('cmd.exe', ['/c', 'npm run preview'], { stdio: 'pipe' });

setTimeout(async () => {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
    page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));
    
    await page.goto('http://localhost:4173', { waitUntil: 'networkidle2' });
    
    console.log('Page loaded. Waiting 2 seconds...');
    await new Promise(r => setTimeout(r, 2000));
    
    await browser.close();
    preview.kill();
    process.exit(0);
  } catch (err) {
    console.error('PUPPETEER ERROR:', err);
    preview.kill();
    process.exit(1);
  }
}, 5000); // Give preview server 5 seconds to start
