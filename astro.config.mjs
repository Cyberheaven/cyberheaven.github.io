// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import { satteri } from "@astrojs/markdown-satteri";
import youtube from "./src/lib/markdown-youtube.mjs";

export default defineConfig({
  output: "static",
  site: "https://cyberheaven.eu", // GitHub Pages with a custom domain: docs/hosting.md
  // Styles go into the page itself, so the first paint does not wait for a stylesheet request.
  build: { inlineStylesheets: "always" },
  // sitemap-index.xml for search engines; the 404 page and the CMS pages (/admin/…) are left out.
  // Old addresses of pages that moved, so existing links keep working.
  // The old WordPress site was at this domain too: its addresses go to the same content here.
  redirects: {
    "/privacy": "/legal#privacy",
    "/terms": "/legal#terms",
    "/cookies": "/legal#cookies",
    "/privacy-policy": "/legal#privacy",
    "/terms-conditions": "/legal#terms",
    "/cookie-policy": "/legal#cookies",
    "/contact": "/about#contact",
    "/learning-paths": "/career",
    "/courses": "/resources",
    "/pricing": "/", // CyberHeaven is free: there's nothing to price
    "/osint-for-beginners-getting-started-with-open-source-intelligence": "/articles/osint-for-beginners-getting-started-with-open-source-intelligence",
    "/the-forensics-guide-to-windows-prefetch-analyzing-execution-spotting-lolbins": "/articles/the-forensics-guide-to-windows-prefetch-analyzing-execution-spotting-lolbins",
    "/career-guide-how-to-become-a-soc-analyst": "/articles/career-guide-how-to-become-a-soc-analyst",
    "/introduction-to-digital-forensics-and-incident-response": "/articles/introduction-to-digital-forensics-and-incident-response",
    "/a-beginners-guide-to-malware-analysis": "/articles/a-beginners-guide-to-malware-analysis",
    "/linux-command-line-cheat-sheet": "/articles/linux-command-line-cheat-sheet",
  },
  // YouTube embeds and links in Markdown become the site's own video player.
  markdown: { processor: satteri({ hastPlugins: [youtube] }) },
  integrations: [sitemap({ filter: (page) => !/\/(404\/?|admin\/.*)$/.test(page) })],
});
