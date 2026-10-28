// Run after `npm run build`: node scripts/check-links.mjs — every link and image on the built site that points to
// the site itself (/articles/…, /media/…, https://cyberheaven.eu/…) must lead to a page or file that exists.
// Catches links to renamed or deleted articles, people and images. Links to other sites are not checked.
import { readFileSync, readdirSync, existsSync } from "node:fs";

// The site's address, and its old one (cyberheaven.github.io now redirects here)
const site = /^https?:\/\/(www\.)?(cyberheaven\.eu|cyberheaven\.github\.io)(?=\/|$)/;
let problems = 0;
for (const file of readdirSync("dist", { recursive: true }).filter((f) => f.endsWith(".html"))) {
  const html = readFileSync(`dist/${file}`, "utf8");
  for (const [, url] of html.matchAll(/<(?:a\s[^>]*?href|img\s[^>]*?src)="([^"]*)"/g)) {
    const link = url.replaceAll("&amp;", "&").replace(site, "");
    if (!link.startsWith("/") || link.startsWith("//")) continue;
    const path = decodeURIComponent(link.split(/[?#]/)[0]);
    if (![path, `${path}/index.html`, `${path}.html`].some((p) => existsSync(`dist${p}`))) {
      console.log(`/${file.replace(/(^|\/)index\.html$/, "")}: link to ${link}, which doesn't exist`);
      problems++;
    }
  }
}
if (problems) process.exit(1);
console.log("links: ok");
