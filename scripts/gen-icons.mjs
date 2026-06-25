import { chromium } from "playwright";

const bg = "#141414";
const accent = "#e8358a";

function makeHtml(size, maskable) {
  const pad = maskable ? size * 0.1 : size * 0.05;
  const w = size - pad * 2;
  const cx = size / 2;
  const roofTop = pad + w * 0.05;
  const roofBottom = pad + w * 0.48;
  const bodyBottom = pad + w * 0.95;
  const bodyLeft = cx - w * 0.28;
  const bodyRight = cx + w * 0.28;
  const roofLeft = cx - w * 0.42;
  const roofRight = cx + w * 0.42;
  const doorW = w * 0.16;
  const doorH = w * 0.26;
  const doorX = cx - doorW / 2;
  const doorY = bodyBottom - doorH;

  const house = `M${roofLeft},${roofBottom} L${cx},${roofTop} L${roofRight},${roofBottom} L${bodyRight},${roofBottom} L${bodyRight},${bodyBottom} L${bodyLeft},${bodyBottom} L${bodyLeft},${roofBottom} Z`;
  const door = `M${doorX},${bodyBottom} L${doorX},${doorY} Q${cx},${doorY - doorH * 0.15} ${doorX + doorW},${doorY} L${doorX + doorW},${bodyBottom} Z`;

  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:${bg};width:${size}px;height:${size}px;overflow:hidden"><svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg"><rect width="${size}" height="${size}" fill="${bg}"/><path d="${house}" fill="${accent}"/><path d="${door}" fill="${bg}"/></svg></body></html>`;
}

const browser = await chromium.launch();
const icons = [
  { size: 192, maskable: false, name: "icon-192" },
  { size: 512, maskable: false, name: "icon-512" },
  { size: 512, maskable: true, name: "icon-512-maskable" },
];
for (const { size, maskable, name } of icons) {
  const page = await browser.newPage();
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(makeHtml(size, maskable));
  await page.screenshot({ path: `public/icons/${name}.png`, clip: { x: 0, y: 0, width: size, height: size } });
  await page.close();
  console.log(`Generated ${name}.png`);
}
await browser.close();
