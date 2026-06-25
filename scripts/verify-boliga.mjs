// Run: npm run verify:boliga
// Identifies which propertyType number corresponds to "rækkehus" in zip 5800

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

for (let type = 1; type <= 7; type++) {
  const url =
    `https://api.boliga.dk/api/v2/search/results` +
    `?propertyType=${type}&zipCodes=${ZIP}&pageSize=100&page=1&sort=daysForSale-asc`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.log(`Type ${type} (${TYPE_LABELS[type]}): HTTP ${res.status}`);
      continue;
    }
    const data = await res.json();
    const results = data.results ?? [];
    const count = results.length;
    const totalCount = data.meta?.totalCount ?? count;

    const preview = results
      .slice(0, 3)
      .map((r) => `  - ${r.street}, ${r.zipCode} ${r.city} (${r.price?.toLocaleString("da-DK")} kr)`)
      .join("\n");

    console.log(
      `\nType ${type} — ${TYPE_LABELS[type] ?? "Ukendt"}: ${count} resultater (total: ${totalCount})`
    );
    if (preview) console.log(preview);
  } catch (err) {
    console.log(`Type ${type}: FEJL — ${err.message}`);
  }
}
