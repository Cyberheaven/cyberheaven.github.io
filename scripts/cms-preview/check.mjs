// Checks the CMS behaviour that public/admin/cms.js, config.yml and theme.css add on top of Sveltia, in Chrome
// and Firefox. Run it after updating Sveltia or changing those files. Uses the demo (setup.mjs without --github).
// Usage: node scripts/cms-preview/check.mjs   → prints PASS/FAIL per check, exits with 1 if anything failed
import { openCms, goTo, wait, clickButton } from "./open.mjs";

let failed = 0;
const check = (name, ok, detail = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  (${detail})` : ""}`);
  if (!ok) failed++;
};
const hashOf = (page) => new URL(page.url()).hash;

for (const browserName of ["chrome", "firefox"]) {
  console.log(`\n${browserName}`);
  const { browser, page } = await openCms(browserName, { width: 1024, height: 768 });
  let acceptLeave = false;
  page.on("dialog", (dialog) => (acceptLeave ? dialog.accept() : dialog.dismiss()));

  // cms.js: a first visit opens the "Start here" guide
  check("first visit opens Start here", hashOf(page) === "#/pages/start", hashOf(page));

  // cms.js: the logo's name for screen readers starts with what it shows
  await goTo(page, "#/collections/articles");
  const logoName = await page.$eval('[aria-label="Global"] button:has(> img.logo)', (b) => b.getAttribute("aria-label"));
  check("logo is named CyberHeaven", logoName.startsWith("CyberHeaven"), logoName);

  // theme.css: the logo, the switches and the search box fit side by side at laptop width
  const overlap = await page.evaluate(() => {
    const right = (s) => document.querySelector(s).getBoundingClientRect().right;
    const left = (s) => document.querySelector(s).getBoundingClientRect().left;
    return right('[aria-label="Switch Page"]') - left('[aria-label="Global"] .search-bar');
  });
  check("top bar items don't overlap at 1024px", overlap <= 0, `${Math.round(overlap)}px`);

  // cms.js: ← asks before throwing away unsaved changes
  await goTo(page, "#/collections/articles/entries/a-beginners-guide-to-malware-analysis");
  await page.click('section.field[data-key-path="title"] input');
  await page.keyboard.type(" (unsaved)");
  await wait(500);
  await page.click('button[aria-label="Cancel Editing"]');
  await wait(800);
  check("← with unsaved changes asks, Cancel stays", hashOf(page).includes("/entries/"), hashOf(page));
  acceptLeave = true;
  await page.click('button[aria-label="Cancel Editing"]');
  await wait(1200);
  check("← with unsaved changes asks, OK leaves", !hashOf(page).includes("/entries/"), hashOf(page));

  // Sveltia itself (since 0.253): the changes left behind are kept in the browser, and reopening the entry offers
  // "Restore Draft". Discard, so the next checks start from the saved article
  await goTo(page, "#/collections/articles/entries/a-beginners-guide-to-malware-analysis");
  const restore = await page.$eval("dialog[open]", (d) => d.innerText).catch(() => "");
  check("reopening after leaving offers Restore Draft", restore.includes("Restore Draft"), restore.replace(/\s+/g, " ").slice(0, 60));
  await clickButton(page, "^\\s*Discard\\s*$");
  await wait(800);

  // cms.js: ⋮ → Clear All asks first; Cancel keeps the fields
  acceptLeave = false;
  await page.click('[role="toolbar"][aria-label="Primary"] button[aria-label="Show Editor Options"]');
  await wait(600);
  await page.evaluate(() => [...document.querySelectorAll('[role="menuitem"]')].find((m) => m.textContent.trim() === "Clear All").click());
  await wait(800);
  const title = await page.$eval('section.field[data-key-path="title"] input', (i) => i.value);
  check("Clear All asks, Cancel keeps the fields", title !== "", title);

  // cms.js: the delete confirm focuses Cancel (so Enter doesn't delete) and names the entry
  await page.keyboard.press("Escape"); // the ⋮ menu is still open from Clear All
  await wait(400);
  await page.click('[role="toolbar"][aria-label="Primary"] button[aria-label="Show Editor Options"]');
  await wait(600);
  await page.evaluate(() => [...document.querySelectorAll('[role="menuitem"]')].find((m) => m.textContent.trim() === "Delete").click());
  await wait(800);
  const confirmDelete = await page.evaluate(() => ({
    focus: document.activeElement?.dataset.label,
    text: document.querySelector('dialog[role="alertdialog"] [id$="-body"]')?.textContent.trim(),
  }));
  check("delete confirm focuses Cancel", confirmDelete.focus === "Cancel", confirmDelete.focus);
  check("delete confirm names the entry", confirmDelete.text?.includes("Malware Analysis"), confirmDelete.text);
  await page.keyboard.press("Escape");

  // theme.css: a field's ⋮ menu is faint until the field is hovered
  const faint = await page.$eval('section.field[data-key-path="category"] button[aria-label="Show Field Options"]', (b) => getComputedStyle(b).opacity);
  check("field ⋮ menu is faint", faint === "0.5", faint);

  // cms.js + theme.css: on a phone the editor bar still shows the entry's title
  await page.setViewport({ width: 390, height: 844 });
  await wait(1000);
  const phoneTitle = await page.evaluate(() => {
    const spacer = document.querySelector('[role="toolbar"][aria-label="Primary"] > .inner > .spacer');
    return spacer && getComputedStyle(spacer, "::before").content;
  });
  check("phone editor bar shows the title", phoneTitle?.includes("Malware Analysis"), phoneTitle);
  await page.setViewport({ width: 1024, height: 768 });

  // cms.js + theme.css: an untouched new article has no "unsaved" ring, and ← leaves without asking
  await goTo(page, "#/collections/articles/new");
  const ring = await page.$eval('[role="toolbar"][aria-label="Primary"] button[data-label="Save"]', (b) => getComputedStyle(b, "::after").opacity);
  check("empty new article: no unsaved ring", ring === "0", ring);
  await page.click('button[aria-label="Cancel Editing"]');
  await wait(800);
  check("empty new article: ← leaves without asking", !hashOf(page).includes("/new"), hashOf(page));

  // config.yml: a new article's date is today; cms.js: its preview shows where the title goes
  await goTo(page, "#/collections/articles/new");
  const date = await page.$eval('section.field[data-key-path="date"] input', (i) => i.value);
  check("new article date defaults to today", date === new Date().toISOString().slice(0, 10), date);
  let previewText = "";
  for (const frame of page.frames()) previewText += await frame.evaluate(() => document.body?.innerText ?? "").catch(() => "");
  check("new article preview shows 'Start with a title'", previewText.includes("Start with a title"));
  check("new article starts with the outline", previewText.includes("What you'll learn") && previewText.includes("✏️"));

  // Sveltia itself: an edit in the rich text editor re-writes the whole body. Before 0.249.1 it dropped "\" before
  // $ or < in table code spans (sveltia-cms#1100) and turned lists indented by 1-3 spaces into code blocks (#1101)
  const toggleMarkdown = () => page.click('section.field[data-key-path="body"] button[aria-label^="Edit in"]');
  const body = "Paths:\n\n| Path |\n| --- |\n| `C:\\$MFT` |\n\nList:\n\n  * one\n  * two\n\n> **Tip:** Save often.\n\n> **Key takeaways**\n> - first\n> - second";
  await toggleMarkdown();
  await wait(800);
  await page.$eval('section.field[data-key-path="body"] textarea', (t, value) => {
    t.value = value;
    t.dispatchEvent(new Event("input", { bubbles: true }));
  }, body);
  await wait(500);
  await toggleMarkdown();
  await wait(1000);
  await page.click('section.field[data-key-path="body"] [contenteditable] p'); // "Paths:"
  await page.keyboard.press("End");
  await page.keyboard.type("!");
  await wait(800);
  await toggleMarkdown();
  await wait(1000);
  const saved = await page.$eval('section.field[data-key-path="body"] textarea', (t) => t.value);
  const rewritten = saved.includes("Paths:!"); // the typed "!" shows the editor really re-wrote the body
  check("editor keeps \\ in table code", rewritten && saved.includes("`C:\\$MFT`"), saved.split("\n")[4]);
  // cms.js: Tip and Key takeaways (Insert menu) survive the editor's rewrite as written
  check("editor keeps Tip and Key takeaways", rewritten && saved.includes("> **Tip:** Save often.") && saved.includes("> **Key takeaways**\n> - first\n> - second"), JSON.stringify(saved.slice(saved.indexOf("> **Tip"))));
  check("editor keeps indented lists as lists", rewritten && saved.includes("\n* one"), JSON.stringify(saved.slice(saved.indexOf("one") - 6)));
  acceptLeave = true; // the article now has unsaved changes

  // cms.js: the "Before you submit" card checks the body as you type (the editor is in Markdown mode here)
  await page.$eval('section.field[data-key-path="body"] textarea', (t) => {
    t.value = "# Big\n\n![](/media/x.png)\n\nSee [this](/articles/no-such-article).\n\n<b>bold</b>";
    t.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await wait(1000);
  let bodyCard = "";
  for (const f of page.frames()) bodyCard ||= await f.$eval(".cms-check", (c) => c.innerText).catch(() => "");
  for (const [name, text] of [["heading 1", "Heading 1 in the text"], ["image alt", "image without alt text"], ["missing article", "/articles/no-such-article"], ["HTML (check-content rule)", "HTML: the site would show it"]])
    check(`card flags ${name}`, bodyCard.includes(text));

  // config.yml: team rows read "Name · Roles", like article rows
  await goTo(page, "#/collections/people");
  const teamRow = await page.$eval('[role="grid"][aria-label="Entries"] [role="row"]', (r) => r.textContent.trim());
  check("team rows read 'Name · Roles'", / · /.test(teamRow), teamRow);

  // theme.css: list items and grouped fields are outlined cards without Sveltia's grey header band
  await goTo(page, "#/collections/pages/entries/home");
  const band = await page.$eval('section.field[data-key-path="about"] .wrapper > .header', (h) => getComputedStyle(h).backgroundColor);
  check("grouped field header has no grey band", band === "rgba(0, 0, 0, 0)", band);
  // cms.js: the names of Home's sections are real headings (Sveltia draws only the fields near the screen)
  const sections = await page.$$eval("h3.ch-section", (list) => list.map((x) => x.textContent));
  check("Home sections have headings", sections[0] === "Hero" && sections.length >= 5, sections.join(", "));

  // cms.js: lab exercises have a read-through preview, one card per exercise (opened from the list: Sveltia
  // doesn't redraw when the address jumps straight from one lab to another)
  await goTo(page, "#/collections/interactive");
  await goTo(page, "#/collections/interactive/entries/phishing");
  let labCards = 0;
  for (const f of page.frames().filter((f) => !f.isDetached())) labCards ||= await f.$$eval(".cms-lab", (l) => l.length).catch(() => 0);
  check("lab preview has a card per exercise", labCards === 8, labCards);
  await goTo(page, "#/collections/articles/entries/a-beginners-guide-to-malware-analysis");
  const frame = await page.$eval('section.field[data-key-path="author"] .field-wrapper > .wrapper', (w) => getComputedStyle(w).borderTopWidth);
  check("radio buttons (Author) have no card outline", frame === "0px", frame);

  // cms.js: a "Before you submit" card above the article preview lists what to fix (here: a long excerpt)
  const card = async () => {
    for (const f of page.frames()) {
      const text = await f.$eval(".cms-check", (c) => c.innerText).catch(() => null);
      if (text) return text;
    }
    return "";
  };
  const malwareCard = await card();
  check("article preview has a 'Before you submit' card", /excerpt is \d+ characters/.test(malwareCard), malwareCard.replace(/\s+/g, " "));

  // cms.js: under the article, how it shows in Google, with the excerpt's counter in red when it's too long
  let search = null;
  for (const f of page.frames())
    search ??= await f.$eval(".cms-search", (s) => ({ text: s.innerText, over: s.querySelector("[data-over]")?.textContent })).catch(() => null);
  check("search card shows the address", search?.text.includes("articles › a-beginners-guide-to-malware-analysis"));
  check("search card flags the long excerpt", /^excerpt \d+\/160$/.test(search?.over ?? ""), search?.over);

  // cms.js + health.astro: "Content health" lists fixes, without Sveltia's title bar, and a row opens the entry
  await goTo(page, "#/pages/health");
  const healthFrame = page.frames().find((f) => f.url().includes("/admin/health"));
  const healthLink = await healthFrame?.$eval('a[target="_parent"][href*="/collections/articles/entries/"]', (a) => a.textContent).catch(() => null);
  check("Content health lists articles to fix", !!healthLink, healthLink);
  const healthBar = await page.$eval('main[aria-label="Content health"] > [role="toolbar"]', (t) => getComputedStyle(t).display).catch(() => "missing");
  check("Content health has one title", healthBar === "none", healthBar);
  await healthFrame?.click('a[target="_parent"][href*="/collections/articles/entries/"]');
  await wait(4000);
  check("Content health row opens the entry", hashOf(page).startsWith("#/collections/articles/entries/"), hashOf(page));

  // Sveltia itself: a team member who still has articles can't be deleted (the site doesn't build without every
  // article's author). cms.js relies on this instead of its own guard
  await goTo(page, "#/collections/people/entries/purpleshonen");
  await page.click('[role="toolbar"][aria-label="Primary"] button[aria-label="Show Editor Options"]');
  await wait(600);
  await page.evaluate(() => [...document.querySelectorAll('[role="menuitem"]')].find((m) => m.textContent.trim() === "Delete").click());
  await wait(800);
  const refused = await page.evaluate(() => {
    const dialog = document.querySelector('dialog[role="alertdialog"][open]');
    return { off: dialog?.querySelector('button[data-label="Delete"]')?.disabled, text: dialog?.querySelector('[id$="-body"]')?.textContent.trim() };
  });
  check("team member with articles can't be deleted", refused.off === true && refused.text?.includes("Articles"), refused.text?.slice(0, 60));
  await page.keyboard.press("Escape");

  // config.yml: "Hide from the site" puts "Hidden ·" before the article in the list, and the card says it's on
  await goTo(page, "#/collections/articles/entries/linux-command-line-cheat-sheet");
  await page.click('section.field[data-key-path="draft"] [role="switch"]');
  await wait(800);
  check("hidden article: the card says so", (await card()).includes("Hide from the site is on"));
  await page.click('[role="toolbar"][aria-label="Primary"] button[data-label="Save"]');
  await wait(2500);
  await goTo(page, "#/collections/articles");
  const rows = await page.$$eval('[role="grid"][aria-label="Entries"] [role="row"]', (r) => r.map((row) => row.textContent.trim()));
  check("hidden article: list row starts with 'Hidden ·'", rows.some((r) => r.startsWith("Hidden · Linux")), rows.find((r) => r.includes("Linux")));

  // config.yml: an uploaded PNG is saved as WebP
  await goTo(page, "#/assets");
  await (await page.$('input[type="file"]')).uploadFile("public/media/2026/08/checksum-1024x576.png");
  await wait(2000);
  const upload = await page.$eval("dialog[open]", (d) => d.innerText.replace(/\s+/g, " ")).catch(() => "");
  check("uploaded PNG becomes WebP", /checksum-1024x576\.webp.*converted from/.test(upload), upload.slice(0, 120));
  await clickButton(page, "^\\s*Cancel\\s*$");

  // cms.js + theme.css: only maintainers see Pages and Settings in the sidebar. The demo has no GitHub sign-in, so
  // this gives it a pretend token and answers GitHub's "what may this person do" request itself.
  // The pretend answer is the "check-permissions" item in localStorage.
  await page.evaluateOnNewDocument(() => {
    const realFetch = window.fetch;
    window.fetch = (url, options) => String(url).startsWith("https://api.github.com/repos/")
      ? Promise.resolve(new Response(`{"permissions":${localStorage.getItem("check-permissions")}}`))
      : realFetch(url, options);
  });
  await page.evaluate(() => localStorage.setItem("sveltia-cms.user", JSON.stringify({ ...JSON.parse(localStorage.getItem("sveltia-cms.user")), token: "demo" })));
  const sidebar = () => page.$$eval('[aria-label="Collection List"] [role="treeitem"]', (items) => items.filter((i) => i.offsetParent).map((i) => i.dataset.label).join(", "));
  for (const [level, perms, expected] of [
    ["volunteer", { push: true }, "Articles, Team members, Resource list, Glossary, Lab exercises"],
    ["maintainer", { push: true, maintain: true }, "Articles, Pages, Team members, Resource list, Glossary, Lab exercises, Settings"],
  ]) {
    await page.evaluate((p) => localStorage.setItem("check-permissions", p), JSON.stringify(perms));
    await goTo(page, "#/collections/articles");
    await page.reload(); // cms.js asks GitHub once per sign-in; a reload is a fresh start
    await wait(3000);
    const shown = await sidebar();
    check(`${level} sidebar`, shown === expected, shown);
    // cms.js + theme.css: only maintainers can use a team member's Roles field
    await goTo(page, "#/collections/people/entries/purpleshonen");
    const locked = await page.$eval('section.field[data-key-path="roles"] .field-wrapper', (w) => w.inert);
    check(`${level}: Roles field ${level === "volunteer" ? "locked" : "usable"}`, locked === (level === "volunteer"), String(locked));
  }

  await browser.close();
}
console.log(failed ? `\n${failed} check(s) failed` : "\nAll checks passed");
process.exit(failed ? 1 : 0);
