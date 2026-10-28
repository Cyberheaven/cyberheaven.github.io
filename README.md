<p align="center">
  <img src="public/assets/logo-mark.webp" alt="" width="88" height="88">
</p>

<h1 align="center">CyberHeaven</h1>

<p align="center">
  <b>Free, practical cybersecurity learning, run by the people who use it.</b><br>
  Guides, hands-on tools and hand-picked resources for every aspiring defender.
</p>

<p align="center">
  <a href="https://cyberheaven.eu"><b>cyberheaven.eu</b></a> ·
  <a href="https://discord.gg/QH8mRSCdW9">Discord</a> ·
  <a href="https://twitter.com/cyberheaven0x">X (Twitter)</a> ·
  <a href="https://www.linkedin.com/company/cyberheaven">LinkedIn</a> ·
  <a href="mailto:cyberheavenhq@proton.me">cyberheavenhq@proton.me</a>
</p>

---

For eight years CyberHeaven published practical guides for cybersecurity learners. Today it is a
**community-driven, volunteer-run project**: no pricing, no paid courses, no paywalls, no tracking.
Everything is free for everyone, and anyone can help keep it going.

## What’s inside

- **Articles**: beginner-friendly guides on OSINT, digital forensics and incident response, malware analysis, SOC careers and Linux.
- **Interactive tools**: find your career path, spot the phish, route SOC alerts, explore malware families. All in the browser, no sign-up.
- **Glossary**: 160+ cybersecurity terms in plain English.
- **Resources**: 130+ hand-picked courses, labs, tools, certifications, books and communities from across the web.
- **Discussion**: comments under every article, powered by [giscus](https://giscus.app) and this repo’s Discussions.

## Ways to help

You don’t need to be an expert, and you don’t need to know how to code.

| You want to… | How |
| --- | --- |
| Write an article | Pitch your idea on [Discord](https://discord.gg/QH8mRSCdW9) or by [email](mailto:cyberheavenhq@proton.me?subject=Article%20idea). |
| Suggest a resource or glossary term | Open an [issue](../../issues) or a [discussion](../../discussions), or tell us on Discord. |
| Fix a typo or an outdated detail | Edit the file on GitHub and open a pull request, or use the content editor (below). |
| Help other learners | Join the [Discord](https://discord.gg/QH8mRSCdW9) and answer questions. |
| Improve the site | Pick an [issue](../../issues), or propose something in [Discussions](../../discussions). |

### Editing content without code

Anyone can sign in at **`/admin`** (Sveltia CMS, GitHub login). Every change is saved as a draft (a pull request
on GitHub) and goes live when an editor or maintainer publishes it: who can do what is in
[docs/access-levels.md](docs/access-levels.md). The CMS always shows what’s on GitHub, not your local copy, so push
your local changes before editing the same thing in the CMS.

The CMS has a short guide for volunteers, **Start here** (the waving hand in its top bar; `src/pages/admin/start.astro`).
Its “Where everything is” table repeats the one below: change both together.

Here’s where to find each thing on the site:

| In the CMS | What you can change |
| --- | --- |
| **Articles** | Every article: title, category, date, author, summary, cover image and body. Saving keeps a draft; it goes live once it’s published. |
| **Pages → Home** | The carousel articles at the top (pick and drag to set the order; leave it empty for the 5 newest), the tagline, the About band, the values cards, the scrolling ticker, the topics, the labs and resources headings, the FAQ and the contact section. |
| **Pages → Articles** | The heading and intro of the articles list. |
| **Pages → Interactive** | The heading and intro of the Interactive page, and every lab and tool listed on it: its card, whether it’s featured on the homepage, its topic, and the heading and intro on its own page (this includes the career quiz and the glossary). |
| **Pages → Resources** | The heading, intro, disclaimer and closing note of the resources page. |
| **Pages → About** | The heading, intro, story text and the “ways in” list. |
| **Pages → Team** | The heading and intro, the past members heading and the “Join us” row. |
| **Pages → Join** | The heading and intro, the “Where to find us” list and the ways to help. |
| **Pages → Terms, privacy & cookies** | The whole legal page. |
| **Pages → Page not found** | The 404 page’s text and buttons. |
| **Team members** | Everyone’s profile: photo, roles, bio and links. Articles pick their author from here. |
| **Resource list** | Every recommended resource, its cost and level, and which ones are featured on the homepage. |
| **Glossary** | Every glossary term. |
| **Lab exercises** | The exercises inside the labs: phishing messages, log hunt cases, decoding challenges, detection rule rounds, permission tasks, SOC alerts, malware cases and SQL fixes; and the career quiz (paths, questions, answers and their points). |
| **Settings → Site** | The site name, contact email, Discord link, top menu, footer menu, social links, footer note and copyright year. |
| **Settings → Categories** | The categories for articles and resources, the glossary topics and the team roles. |

Pages and Settings only show in the sidebar for maintainers ([docs/access-levels.md](docs/access-levels.md)).

How the CMS is built, themed and tested (and how to update Sveltia safely): [docs/cms.md](docs/cms.md). In short:
the look is `public/admin/theme.css`; the previews, which copy `src/pages/articles/[slug].astro` and
`src/pages/team/[person].astro`, are in `public/admin/cms.js`: if you change the markup of one of those pages,
change it in `cms.js` too.

The CMS editor rewrites the Markdown when it saves, and some Markdown doesn’t survive that (HTML tables, `<iframe>`
embeds, `* * *` dividers). If you edit content files directly, run the checks below before pushing.

Some text has placeholders in curly brackets, like `{count} terms`. Keep them as they are: the site fills in the
real number when it builds, so it never goes out of date. Each field’s hint says which placeholders it supports.

Changing these still needs code: the Shell quest, Real or fake link and Hash and salt labs, a new career path's
points field (`public/admin/config.yml`), and small interface text such as search boxes, filter buttons and lab controls.

Writing tips: to embed a YouTube video, paste its link on a line of its own. To show an interactive widget in an
article, add `<div data-widget="soc-ladder"></div>` or `<div data-widget="malware-explorer"></div>` on its own line.

## Docs for maintainers

- [docs/hosting.md](docs/hosting.md): where the site runs (GitHub Pages) and how changes get online
- [docs/access-levels.md](docs/access-levels.md): who can publish what, and the GitHub setup behind it
- [docs/cms-login.md](docs/cms-login.md): how "Sign In with GitHub" works (login service on Cloudflare), and fixing it
- [docs/cms.md](docs/cms.md): how the CMS is built, themed and tested
- [docs/checks.md](docs/checks.md): the checks every change must pass before it can be published

## Running it locally

You need [Node.js](https://nodejs.org) 22 or newer.

```sh
npm install
npm run dev       # http://localhost:4321
npm run build     # static site in dist/
npm run preview   # serve the built site
```

Every pull request runs the checks in [docs/checks.md](docs/checks.md) (content safety, data, labs, the build,
links), and a change can't be published until they pass. Run them yourself before pushing:

```sh
node scripts/check-content.mjs && node scripts/check-data.mjs && node scripts/check-labs.mjs \
  && node scripts/check-career.mjs && node scripts/check-youtube.mjs && node scripts/check-roles.mjs \
  && npm run build && node scripts/check-links.mjs
```

## How it’s built

A static [Astro](https://astro.build) site. No server, no database, no build-time secrets.

```
src/
  content/articles/   articles (Markdown)
  content/pages/      the text of every page: home.json, interactive.json, about.md, legal.md…
  content/people/     team profiles (one Markdown file per person, bio in the body)
  content/site.json   site name, email, navigation, socials, footer, comments settings
  data/               resources, glossary, categories, quiz and game data (JSON)
  pages/              one file per route (articles, resources, glossary, team, join, play/…)
  components/         page sections, widgets, PageHead, YouTube, Comments
  scripts/            scroll effects, smooth scrolling, list filtering
  styles/             global.css (design tokens and shared styles), prose.css (article text)
public/admin/         Sveltia CMS (config.yml must stay in sync with src/content.config.ts)
```

Keep it simple: this is a volunteer project, so code should stay approachable for contributors of every skill level.

## Credits

The visual design builds on the **elias-vent** theme by Alex Prokhorov, used under the MIT License (see
[`THEME-LICENSE`](THEME-LICENSE)). Articles are written by CyberHeaven’s contributors and credited on each article.

Please read the site’s [terms, privacy and community guidelines](src/content/pages/legal.md) before contributing.
