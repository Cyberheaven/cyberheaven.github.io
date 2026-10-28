// Rules for content, shared by scripts/check-content.mjs (pull request checks), the CMS's "Before you submit" card
// (public/admin/cms.js, served by src/pages/admin/content-rules.mjs.ts) and the CMS's "Content health" page
// (src/pages/admin/health.astro).
// Tested against Sveltia 0.253.1.
//
// Why the safety rules matter: the site shows HTML written in Markdown as-is, scripts included, and the site
// shares its address with the CMS, where everyone's sign-in is kept. So content may not contain HTML (except the
// interactive widget line) or links that run code (javascript:).

// Markdown the CMS editor (Sveltia) changes or breaks when someone edits and saves the page there
const editorRules = [
  [/^\s*<table/, "HTML table: the CMS escapes it as text. Use a Markdown table (| a | b |)"],
  [/^\s*<iframe/, "embed: paste the YouTube link on its own line instead, e.g. [Video title](https://www.youtube.com/watch?v=…)"],
  [/^\* \* \*$/, "'* * *' line: the CMS turns it into a bullet point. Use *** for a divider"],
];

// A link that runs code instead of opening a page. Browsers ignore spaces and line breaks inside the scheme.
export const runsCode = (url) => /^(javascript|vbscript|data):/i.test(url.replace(/[\x00-\x20]/g, ""));

// Safety rules for one line of a Markdown body
function unsafe(line) {
  const prose = line
    .replace(/(`+)[^`][\s\S]*?\1/g, "") // `code` is shown as text, so anything goes there
    .replace(/\\</g, "")
    .replace(/<div data-widget="[a-z-]+"><\/div>/g, ""); // Insert → Interactive widget
  const found = [];
  if (/<\/?[a-z][a-z0-9-]*[\s>/]|<!--/i.test(prose))
    found.push("HTML: the site would show it as-is, scripts included. Use Markdown, or put code in `backticks`");
  const links = [
    ...prose.matchAll(/\]\(\s*<?([^\s)>]*)/g), // [text](link) and ![alt](image)
    ...prose.matchAll(/<([a-z][a-z0-9+.-]*:[^\s>]*)>/gi), // <https://…>
    ...prose.matchAll(/^ {0,3}\[[^\]]+\]:\s*<?([^\s>]+)/g), // [name]: link
  ].map((m) => m[1]);
  // & before the first / could spell javascript: in HTML codes, like &#106;avascript:
  for (const link of links)
    if (runsCode(link) || /^[^/?#]*&/.test(link)) found.push(`link "${link}" would run code, not open a page`);
  return found;
}

// Every problem in a Markdown body, as { line (1 = the body's first line), message }. Code blocks are skipped.
export function bodyProblems(body) {
  const problems = [];
  let fence = false;
  body.split("\n").forEach((text, i) => {
    if (text.startsWith("```")) fence = !fence;
    if (fence) return;
    const found = editorRules.filter(([pattern]) => pattern.test(text)).map(([, message]) => message);
    for (const message of found.length ? found : unsafe(text)) problems.push({ line: i + 1, message });
  });
  return problems;
}

// What to fix in an article before it goes live, as { text, quote } (quote: the line of Markdown it's about).
// article: the article's fields as plain values, with its Markdown as body. live: the addresses of the articles and
// people on the site and every tag in use ({ articles: [...], team: [...], tags: [...] }), or null to skip those
// checks. bodyProblems() and the leftover outline would also stop it from being published (check-content.mjs);
// the rest are good habits the checks don't enforce.
export function articleProblems(article, live) {
  const found = [];
  const excerpt = (article.excerpt || "").trim();
  const body = article.body || "";
  if (!excerpt) found.push({ text: "No excerpt: it's the summary on the articles list and in Google results." });
  else if (excerpt.length > 160) found.push({ text: `The excerpt is ${excerpt.length} characters: Google cuts it at about 160.` });
  if (article.cover && !(article.coverAlt || "").trim()) found.push({ text: "The cover image has no alt text (Cover alt text)." });
  for (const tag of article.tags ?? []) {
    const close = live?.tags?.find((other) => other !== tag && similar(other, tag));
    if (close && !(article.tags.includes(close) && close < tag)) // a pair in this article: once
      found.push({ text: `The tag “${tag}” looks like “${close}”: if they mean the same, use one, so their articles are listed together.` });
  }
  if (body.includes(outlineMark)) found.push({ text: `The starting outline’s ${outlineMark} notes are still there: replace them with your text.` });
  if (oldEmail.test(`${article.title} ${excerpt}`)) found.push({ text: "The title or excerpt has an old @cyberheaven.eu email address: use cyberheavenhq@proton.me." });
  for (const { line, message } of bodyProblems(body)) found.push({ text: message[0].toUpperCase() + message.slice(1), quote: body.split("\n")[line - 1] });
  let fence = false;
  let level = 1; // the title is the page's heading 1
  for (const line of body.split("\n")) {
    if (line.startsWith("```")) fence = !fence;
    if (fence) continue;
    const heading = line.match(/^(#{1,6})\s/)?.[1].length;
    if (heading === 1) found.push({ text: "Heading 1 in the text: the title is already the page's main heading. Use Heading 2.", quote: line });
    else if (heading > level + 1) found.push({ text: `Heading ${heading} right after heading ${level}: don't skip a level.`, quote: line });
    if (heading) level = heading;
    if (/!\[\s*\]\(/.test(line)) found.push({ text: "An image without alt text: describe it between the [ ].", quote: line });
    if (oldEmail.test(line)) found.push({ text: "An old @cyberheaven.eu email address: use cyberheavenhq@proton.me.", quote: line });
    if (ownSite.test(line)) found.push({ text: "A link to our own site with its address: write it as /articles/…, so it works on any address.", quote: line });
    for (const [, kind, id] of line.matchAll(/\]\((?:https?:\/\/[\w.]*cyberheaven\.(?:eu|github\.io))?\/(articles|team)\/([\w-]+)/g))
      if (live && !live[kind].includes(id)) found.push({ text: `Link to ${kind === "team" ? "a team member" : "an article"} that isn't on the site: /${kind}/${id}`, quote: line });
  }
  return found;
}

const oldEmail = /[\w.+-]+@cyberheaven\.eu\b/i; // the project's address is cyberheavenhq@proton.me
const ownSite = /\]\(https?:\/\/(www\.)?cyberheaven\.(eu|github\.io)\b/i;

// A new article's body starts with an outline (public/admin/config.yml); its notes start with this mark
export const outlineMark = "✏️";

// Tags that are probably the same thing: "Malware Analysis" and "malware-analysis tools", "Linux Command" and
// "Linux Commands", but not "Linux" and "Linux Networking" (the shorter must be most of the longer)
const tagKey = (tag) => tag.toLowerCase().replace(/[^a-z0-9]/g, "").replace(/s$/, "");
function similar(a, b) {
  const [short, long] = [tagKey(a), tagKey(b)].sort((x, y) => x.length - y.length);
  return long.includes(short) && short.length >= 0.7 * long.length;
}
