// Run: npm run verify:boliga
import { chromium } from "playwright";

const ZIP = process.env.BOLIGA_ZIP ?? "5800";

const TYPE_LABELS = {
  1: "Villa",
  2: "Ejerlejlighed",
  3: "Rækkehus / Kæde",
  4: "Fritidshus",
  5: "Andelsbolig",
  6: "Villa m. udlejning",
  7: "Landejendom",
};

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  userAgent:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  locale: "da-DK",
  extraHTTPHeaders: {
    Accept: "application/json, text/plain, */*",
    "Accept-Language": "da-DK,da;q=0.9,en;q=0.8",
    Referer: "https://www.boliga.dk/",
  },
});

for (let type = 1; type <= 7; type++) {
  const url =
    `https://api.boliga.dk/api/v2/search/results` +
    `?propertyType=${type}&zipCodes=${ZIP}&pageSize=100&page=1&sort=daysForSale-asc`;

  try {
    const page = await context.newPage();
    const [response] = await Promise.all([
      page.waitForResponse((r) => r.url().startsWith("https://api.boliga.dk/api/v2/search/results"), { timeout: 30000 }),
      page.goto(url, { waitUntil: "commit" }),
    ]);

    if (!response.ok()) {
      await page.close();
      console.log(`Type ${type} (${TYPE_LABELS[type]}): HTTP ${response.status()}`);
      continue;
    }

    const data = await response.json();
    await page.close();
    const results = data.results ?? [];
    const totalCount = data.meta?.totalCount ?? results.length;

    const preview = results
      .slice(0, 3)
      .map((r) => `  - ${r.street}, ${r.zipCode} ${r.city} (${r.price?.toLocaleString("da-DK")} kr)`)
      .join("\n");

    console.log(`\nType ${type} — ${TYPE_LABELS[type]}: ${results.length} resultater (total: ${totalCount})`);
    if (preview) console.log(preview);
  } catch (err) {
    console.log(`Type ${type}: FEJL — ${err.message}`);
  }
}

await browser.close();
