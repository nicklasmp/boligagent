import { chromium } from "playwright";

const bg = "#0F4F3C";
const accent = "#52E3A0";
const fg = "#FFFFFF";

function makeHtml(size, maskable) {
  const transform = maskable ? 'translate(12,12) scale(0.8)' : '';
  const sw = maskable ? 11.25 : 9;
  return `<!DOCTYPE html><html><head>
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@800&display=swap" rel="stylesheet">
<style>*{margin:0;padding:0}body{width:${size}px;height:${size}px;overflow:hidden;background:${bg}}</style>
</head><body>
<svg width="${size}" height="${size}" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="120" height="120" fill="${bg}"/>
  <g${transform ? ` transform="${transform}"` : ''}>
    <path d="M22 54 60 20l38 34v44a4 4 0 0 1-4 4H26a4 4 0 0 1-4-4V54Z" stroke="${accent}" stroke-width="${sw}" stroke-linejoin="round"/>
    <text x="60" y="91" text-anchor="middle" font-family="'Sora', system-ui, sans-serif" font-weight="800" font-size="56" fill="${fg}">B</text>
  </g>
</svg>
</body></html>`;
}

const browser = await chromium.launch();
const icons = [
  { size: 192, maskable: false, name: "icon-192" },
  { size: 512, maskable: false, name: "icon-512" },
  { size: 512, maskable: true,  name: "icon-512-maskable" },
];
for (const { size, maskable, name } of icons) {
  const page = await browser.newPage();
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(makeHtml(size, maskable));
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: `public/icons/${name}.png`, clip: { x: 0, y: 0, width: size, height: size } });
  await page.close();
  console.log(`Generated ${name}.png`);
}
await browser.close();
