// Run: node scripts/check-external-links.mjs — tries every link to another site in the content (articles, pages,
// resources, career quiz…) and lists the dead ones. Runs weekly (.github/workflows/weekly.yml), which opens an issue with the
// list. Only clear failures count (page not found, gone, or a domain that no longer exists): many sites refuse
// automated visits (403, 429…), and those are skipped rather than reported.
import { readFileSync, readdirSync } from "node:fs";

// The lab exercises' data is left out: its links are made up on purpose (phishing examples, fake logs…)
const labs = ["phishing", "loghunt", "decode", "rules", "permissions", "triage", "infections", "query"].map((lab) => `${lab}.json`);
const files = [
  ...["src/content/articles", "src/content/people", "src/content/pages"].flatMap((dir) => readdirSync(dir).map((f) => `${dir}/${f}`)),
  ...readdirSync("src/data").filter((f) => !labs.includes(f)).map((f) => `src/data/${f}`),
];
// Addresses reserved for examples never work: example.com, *.example, *.test, *.invalid
const example = /^https?:\/\/([^/]*\.)?(example\.(com|org|net)|[^/]*\.(example|test|invalid))([/:]|$)/;
const links = new Map(); // link → the first file that has it
for (const file of files)
  for (const [url] of readFileSync(file, "utf8").matchAll(/https?:\/\/[^\s"'`<>)\]\\]+/g))
    if (!/^https?:\/\/((www\.)?cyberheaven\.eu|cyberheaven\.github\.io|localhost)/.test(url) && !example.test(url) && !links.has(url)) links.set(url, file);

async function dead(url) {
  const visit = (method) => fetch(url, { method, redirect: "follow", signal: AbortSignal.timeout(20000), headers: { "User-Agent": "Mozilla/5.0 (CyberHeaven link check)" } });
  try {
    let response = await visit("HEAD");
    if (response.status >= 400) response = await visit("GET"); // some sites don't answer HEAD
    if (![404, 410].includes(response.status)) return null;
    await new Promise((done) => setTimeout(done, 10000)); // a site having a bad minute isn't a dead link: ask again
    response = await visit("GET");
    return [404, 410].includes(response.status) ? `${response.status}` : null;
  } catch (error) {
    return error.cause?.code === "ENOTFOUND" ? "the domain doesn't exist" : null; // timeouts and refusals: skipped
  }
}

const found = [];
const queue = [...links.keys()];
await Promise.all(Array.from({ length: 8 }, async () => { // 8 at a time
  for (let url; (url = queue.shift()); ) {
    const reason = await dead(url);
    if (reason) found.push(`- ${url} (${reason}), in \`${links.get(url)}\``);
  }
}));

if (found.length) {
  console.log(`${found.length} dead link(s) out of ${links.size}:\n${found.sort().join("\n")}`);
  process.exit(1);
}
console.log(`external links: ok (${links.size} checked)`);
