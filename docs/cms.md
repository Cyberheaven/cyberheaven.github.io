# The CMS (`/admin`)

Volunteers edit the site at `/admin` with [Sveltia CMS](https://github.com/sveltia/sveltia-cms), a Git-based CMS: it
reads and writes the Markdown and JSON files in this repo through GitHub. There is no server and no database.
Who may publish what is in [access-levels.md](access-levels.md); how signing in works is in [cms-login.md](cms-login.md).

This page is for whoever maintains the CMS itself: how it's put together, why it looks the way it does, and how to
check it still works after a change or a Sveltia update.

## Files

| File | What it does |
| --- | --- |
| `public/admin/index.html` | Loads Sveltia (the version is pinned in the script URL), then `theme.css`, then `cms.js`. |
| `public/admin/config.yml` | Every collection and field the CMS shows, with the hints volunteers see. **Must match `src/content.config.ts`.** |
| `public/admin/theme.css` | The CyberHeaven look: dark, Sora, white as the only accent, pill buttons, site-sized headings. |
| `public/admin/cms.js` | Previews that look like the live pages, the "Interactive widget" editor block, the "Start here" page, and small behaviour fixes (below). |
| `public/admin/logo.webp` | The logo on the sign-in screen and in the top bar. |
| `src/pages/admin/preview.css.ts` | Builds `/admin/preview.css` for the preview pane from the site's real stylesheets. |
| `src/pages/admin/youtube.mjs.ts` | Serves `src/lib/youtube.mjs` to `cms.js`, so the preview draws YouTube embeds like the site. |
| `src/pages/admin/content-rules.mjs.ts` | Serves `src/lib/content-rules.mjs` to `cms.js`: the rules shared by `scripts/check-content.mjs`, the "Before you submit" card and "Content health". |
| `src/pages/admin/health.astro` | The "Content health" page inside the CMS: small fixes across the live content, built with the site. |
| `src/pages/admin/start.astro` | The "Start here" guide inside the CMS. Its "Where everything is" table repeats the README's: change both. |
| `.github/CODEOWNERS` | Who must approve changes to which files ([access-levels.md](access-levels.md)). |
| `scripts/cms-preview/` | A local copy of the CMS for testing, plus screenshot and behaviour checks (below). |

## How the theme works

Sveltia has no official theming yet (it's on their roadmap), so `theme.css` works with what Sveltia exposes:

1. **`--sui-*` CSS variables first.** Sveltia draws nearly everything from about 450 of them: colours
   (`--sui-background-color-1-hsl` … `-5`, foregrounds, borders), the accent, the font, corner radii, control
   heights. Most of the look is just new values for these. One variable can drive unrelated things (for example
   `--sui-button-medium-border-radius` also rounds the image drop zone), so check every view after changing one.
2. **Then ARIA and data attributes**, which are stable: `[role="toolbar"][aria-label="Global"]` (top bar),
   `[aria-label="Primary"]` (the editor's bar), `button[data-label="Save"]`, `section.field[data-key-path="title"]`,
   `[aria-label="Switch Page"]`, `nav.primary-sidebar`, `[role="grid"][aria-label="Entries"]`.
3. **Then Sveltia's own class names** (`.search-bar`, `.buttons`, `.toolbar-wrapper`, `img.logo`).
4. **Never the generated `svelte-xxxx` classes**: they change with every Sveltia release.

Things that aren't obvious:

- **Load order.** Sveltia adds its own `<style>` tags to `<head>` when it starts, so a stylesheet in `<head>` loses.
  `theme.css` is linked at the **end of `<body>`**, after the Sveltia script. Keep it there.
- **Dark only.** `:root:root[data-theme]` outranks Sveltia's light, dark and high-contrast blocks, so every editor
  gets the dark look whatever their system or CMS setting says.
- **Sveltia's nested rules are strong.** Some of its rules are nested under a component class, e.g.
  `.toolbar-wrapper.svelte-xxxx > .sui.toolbar .buttons { width: 50% }`. To beat those, start your selector with
  the same parent (`.toolbar-wrapper > [role="toolbar"]…`). To find such a rule, run
  `node scripts/cms-preview/find-css.mjs "<text>"` (it prints every live CSS rule containing that text).
- **Firefox and icon buttons.** Sveltia keeps icon buttons square with `aspect-ratio: 1 / 1`. Chrome grows a button
  to fit added text anyway, Firefox doesn't: when you add a label to an icon button, also set `aspect-ratio: auto`.
- **Iframes.** The preview pane and the "Start here" page are iframes: they need their own
  `color-scheme: dark`, or Firefox draws a light scrollbar in them.
- **Labels added with CSS** (`content: "Workflow"`) must contain words from the element's accessible name, so
  screen-reader users can say what they see.
- **Some rules match names from `config.yml`.** The person icon for team members without a photo matches
  `main[aria-label*="Team members"]`, and the "Start here" rule matches the page's label. The maintainers-only
  sidebar rule matches the labels "Pages" and "Settings". Rename the collection
  or page and you must change `theme.css` too. The Assets page's lead line (Sveltia has no description there)
  is written in `theme.css` as well. The section captions in Pages → Home (Hero, About, Values…) are attached to
  the first field of each homepage section by its `name`, and recognise the Home editor by its `picksHeading`
  field: rename or reorder those fields in `config.yml` and update the list in `theme.css`.
- **Destructive buttons** are a muted red outline (Sveltia's `--sui-error-*` colours), never the white pill used
  for safe actions. List item buttons (move, ⋮, remove ×) grow to 44px on phones.
- **Items in lists and grouped fields** (FAQ items, lab exercises, Home → About) are outlined cards with no grey
  header band; the item number is a small muted caption, and the outline brightens on hover or while editing inside.
- **Field ⋮ menus** (one on every field, rarely needed) are faint until the field is hovered or focused. They
  stay in the Tab order.
- **Optional fields** say "optional" next to their label; Sveltia's required star is hidden, since nearly every
  field is required. Switches (boolean fields) get neither. A hint doesn't need to start with "Optional".
- **Respect `prefers-reduced-motion`** for every animation; keep text contrast at 4.5:1 or more.

## Behaviour added in `cms.js`

- **Previews** for articles and team members use the same markup and classes as `src/pages/articles/[slug].astro`
  and `src/pages/team/[person].astro`, styled by the site's real CSS. If you change those pages, change `cms.js` too.
- **Before you submit** card at the top of the article preview, updated as you type. It lists: no excerpt or one
  over 160 characters, a cover or body image without alt text, a heading 1 in the body or a skipped heading level,
  old `@cyberheaven.eu` email addresses, links to the site written with its address (`https://cyberheaven.eu/…`
  instead of `/…`), links to `/articles/…` or `/team/…` pages that don't exist (hidden articles count
  as missing), the pull request checks' Markdown rules (`src/lib/content-rules.mjs`, shared with
  `check-content.mjs`, so those would also fail the checks), and "Hide from the site" being on. Only what's in the
  preview is checked: it doesn't stop a save.
- **In Google / when shared** under the article preview: the Google result (address, `Title | CyberHeaven`,
  excerpt) with counters that turn red past about 60 and 160 characters, and the card a shared link shows. Shared
  links use the site's image (`/assets/og.jpg`, set in `layouts/Base.astro`), not the cover, so the card does too.
- **Content health** page (`CMS.registerCustomPage`, `src/pages/admin/health.astro`), next to Start here: every
  article with something from the "Before you submit" rules, team members without a photo, headline or bio,
  glossary terms without a definition (or a long one), resources without a description or an `https://` link.
  Built with the site, so it shows the published content as of the last deploy. Each row opens the entry
  (`target="_parent"` link to `../#/collections/…`).
- **Interactive widget** in the article editor's Insert menu (saved as `<div data-widget="…"></div>`).
- **Tip, Warning, Key takeaways** in the Insert menu: saved as a quote starting with a bold label
  (`> **Tip:** …`, `> **Key takeaways**` + `> - …` lines), which the site draws as a quote. `check.mjs` tests that
  the editor keeps them as written.
- **Starting outline:** a new article's body starts with headings and ✏️ notes (`default` of the body field in
  `config.yml`). The card lists notes still there, and `check-content.mjs` refuses to publish them (the mark is
  `outlineMark` in `src/lib/content-rules.mjs`).
- **Writer's notes in the article preview:** the "On this page" list like the live page (its CSS is copied from
  `components/Toc.astro` into `preview.css.ts`: keep them alike), glossary terms underlined with their definition
  on hover (first use of each, from the Glossary entry), "Easier to read" suggestions in the card (sentences over
  30 words, paragraphs over 120), and "Articles you could link to" (same tags or category) under the Google card.
- **Tag suggestions:** the Tags inputs suggest tags other articles use (a browser `<datalist>` filled by the
  preview), and the card flags tags that look alike ("Malware Analysis" / "Malware Analysis Tools").
- **On save** (`preSave` hook): old `@cyberheaven.eu` addresses become `cyberheavenhq@proton.me` in any entry;
  in articles, title and excerpt lose stray spaces and duplicate tags go. An article whose body breaks the
  checks' Markdown rules isn't saved: Sveltia shows "There was an error while saving the entry… Not saved. Body,
  line N: …" (the first sentence is Sveltia's own). The unsaved changes stay in the editor.
- **Lab exercises preview:** each lab's data file (and the career quiz) gets a plain read-through, one card per
  exercise: what players see, then the answer (`labs` table in `cms.js`: per file, its list and which fields go
  where). It's not the lab's own look; that's drawn by each lab's script on the site. A new field in a lab shows up
  in the preview only once it's added to that table.
- **Career quiz** (Lab exercises → Career quiz, `src/data/career.json`): "Points per path" has one number field per
  path ID, listed in `config.yml`; a new path needs its field added there. On save, `cms.js` drops empty points and
  empty "Starting level" / "Follow-up" IDs and keeps empty lists as lists, so the quiz code (`src/lib/career.mjs`)
  gets the shapes it expects. `check-career.mjs` (in the checks) catches a quiz where a path can't win.
- **Home section headings:** the section names in Pages → Home (Hero, About, Values…) are real `<h3>` headings
  added before each section's first field (`homeSections` in `cms.js`, look in `theme.css` `.ch-section`), so screen
  readers can jump between them.
- **Roles field** for team members: unusable (`inert`, dimmed) for everyone but maintainers. The rule itself is
  enforced by `scripts/check-roles.mjs` on every pull request.
- **Start here** page (`CMS.registerCustomPage`). A volunteer's first visit in each browser opens it once.
- **Unsaved changes:** the ← button asks before throwing them away (Sveltia wouldn't); closing the tab asks too.
  The browser's own Back button isn't covered.
- **Clear All** in the editor's ⋮ menu asks before emptying every field (Sveltia wouldn't).
- **New entries:** Sveltia enables Save on a new entry before anything is typed. Until the first click or edit in
  a field, `body[data-fresh]` is set: no "unsaved" ring on Save, and ← leaves without asking.
- **Delete confirm:** focus starts on Cancel instead of Delete (so Enter doesn't delete), and in the editor the
  question names the entry and says it can be brought back from GitHub.
- **Phone editor title:** on phones Sveltia leaves the entry's title out of the editor bar. `cms.js` copies it from
  the browser tab title into `data-title` on the bar's spacer, and `theme.css` shows it after ←.
- **Sidebar per level:** Pages and Settings show only for maintainers. `cms.js` asks GitHub for the signed-in
  person's access to the repo (`GET /repos/<repo>`, the repo read from `config.yml`): `admin` or `maintain` sets
  `body[data-level="maintainer"]`, anything else `"volunteer"`, and `theme.css` hides the two items (and the
  line above Settings). It's only tidying: a direct link still opens them, and GitHub decides what goes live.
  Writers, editors and contributors all count as volunteers (telling them apart needs the `read:org` sign-in scope).
  If GitHub can't be asked, or in the demo, everything shows. `check.mjs` fakes GitHub's answer to test both levels.
- **Team members with articles can't be deleted.** That's Sveltia itself (since 0.250.0 at least): its delete
  dialog lists the articles that name them and switches Delete off. `check.mjs` tests it, so an update that drops
  it fails there. (The site doesn't build without every article's author.)
- **Logo name:** screen readers hear "CyberHeaven: visit the live site", matching what the logo shows.

## Left as Sveltia draws it, on purpose

Decided on 21 Oct 2026 (with [Jev](https://docs.typesafe.ai), a decision model, weighing upkeep against benefit):
dates keep three formats (the browser's date picker, the live page's long date in the preview, a short date in
lists); the editor's ⋮ menu keeps all 9 items (Delete already asks first); × on a list item removes it without
asking (Revert All Changes brings it back before saving); disabled Assets actions stay visible; the coloured ring
on Save means "unsaved changes", not "live". Sveltia's own jargon (Entry, Slug, UTC…) is explained in Start here
rather than rewritten. Unpublished changes have no marker in the list (the Workflow page shows them); articles hidden
with "Hide from the site" (`draft` in the file) read "Hidden · Title" there (`summary` in `config.yml`).

## Uploads

`config.yml` → `media_libraries.default.config.transformations` turns uploaded photos and screenshots (PNG, JPEG…)
into WebP at quality 85, shrunk to fit 2000 × 2000 px (smaller ones keep their size). The upload dialog shows it
("converted from PNG image"). SVGs and files already in `public/media` aren't touched. `check.mjs` tests it.

## The editor rewrites Markdown

Sveltia's rich-text editor re-writes the Markdown body on every save, and some Markdown doesn't survive: HTML
tables, `<iframe>` lines, `* * *` rules. Content is kept in forms that survive, and `node scripts/check-content.mjs`
flags anything that wouldn't. Two bugs we reported are fixed since Sveltia 0.249.1 (backslashes in table code,
[sveltia-cms#1100](https://github.com/sveltia/sveltia-cms/issues/1100); lists indented by 1–3 spaces,
[#1101](https://github.com/sveltia/sveltia-cms/issues/1101)); `check.mjs` tests both, so an update that brings
them back fails there.

## Testing the CMS locally

The CMS normally needs a GitHub sign-in. `scripts/cms-preview/` builds a local copy that runs on the real content
without one (Sveltia's test backend: changes stay in your browser), and checks it in Chrome and Firefox. Both
browsers must work: the main maintainer uses Firefox.

```sh
npm i --no-save puppeteer-core@23.11.1               # drives your installed Chrome and Firefox; no download
node scripts/cms-preview/setup.mjs /tmp/cms-preview   # builds the site and the local CMS
python3 -m http.server 4399 --directory /tmp/cms-preview
# open http://localhost:4399/admin/index.html and click Start Demo

node scripts/cms-preview/check.mjs                    # behaviour checks, both browsers: PASS/FAIL
node scripts/cms-preview/shoot.mjs /tmp/cms-shots      # screenshots of every view, both browsers, desktop + phone
```

The kit links the built site's `dist/_astro` too, so the "Start here" page gets its fonts.
Run `setup.mjs` again after changing `config.yml` or anything in `src/pages/admin` (it copies or builds those).
Browsers are expected at `/usr/bin/google-chrome` and `/usr/bin/firefox`; set `CHROME` / `FIREFOX` otherwise.

GitHub runs the same `setup.mjs` + `check.mjs` on every pull request that changes `public/admin`, `src/pages/admin`
or `scripts/cms-preview` ([`.github/workflows/cms-check.yml`](../.github/workflows/cms-check.yml), check name
*CMS check*; GitHub's Ubuntu runner has both browsers at those paths). The rule on main doesn't require it, since it
only runs for those files: don't merge a CMS change while it's red. It doesn't take screenshots; run `shoot.mjs`
yourself for anything visual.

The demo has no review workflow. To test against a real GitHub repo (a sandbox copy, see
[access-levels.md](access-levels.md#testing-changes-safely)), use `--github owner/repo` and sign in with a token:

```sh
node scripts/cms-preview/setup.mjs /tmp/cms-sandbox --github Cyberheaven/cms-sandbox
python3 -m http.server 4399 --directory /tmp/cms-sandbox
TOKEN=$(gh auth token) node scripts/cms-preview/shoot.mjs /tmp/sandbox-shots
```

## Updating Sveltia

Every Monday [`.github/workflows/weekly.yml`](../.github/workflows/weekly.yml) compares the pinned version with
the latest on npm and, if they differ, opens an issue *"Update Sveltia CMS to … (we use …)"*. There is never more
than one: while it's open it's updated with the newest version. Close it once the update is merged (or if you
decide to skip that version; the next release opens a new one). *Actions → Weekly → Run workflow* checks now.

1. Change the version in the script URL in `public/admin/index.html`, and its `integrity` hash: `setup.mjs` (next
   step) stops and prints the right one, or run
   `curl -sL <script URL> | openssl dgst -sha384 -binary | openssl base64 -A` and put `sha384-` in front. The hash
   makes browsers refuse the script if unpkg ever serves something else for that version. It covers only this
   script: Sveltia loads a few more files from unpkg and jsdelivr while it runs.
2. Run `setup.mjs`, `check.mjs` and `shoot.mjs` (above), and compare the screenshots with ones taken before the
   update (take those first, on the old version; the sign-in background is animated, so it always differs).
   Variable names have stayed the same so far, but Sveltia doesn't promise that.
3. If something broke, find the new markup with your browser's inspector, and Sveltia's rule with `find-css.mjs`.

## Bringing back something deleted

Sveltia has no bin, but every version is in the repo's history. To restore a deleted entry, as a maintainer:

- **On GitHub:** open the folder (e.g. `src/content/articles`) → *History* → the commit that deleted it → the file →
  *View file* at the commit before → copy the content → *Add file* in the folder, same name, paste, commit (as a pull
  request if you're not a maintainer).
- **With git:** `git log --diff-filter=D --oneline -- src/content/articles/<slug>.md` finds the commit; then
  `git checkout <commit>^ -- src/content/articles/<slug>.md`, commit and push.

Images it used are usually still in `public/media` (deleting an entry doesn't delete them).

## Known gaps

- Sveltia shows no collection description (the lead line) on phones.
- The Pages list can't show a description per page: the Pages description says which Home sections also appear
  on About and Join, and those pages' first field has a hint pointing to Home.
- Team members without a photo show a person icon in the list, not their initials like the site (CSS can't
  read the name there).
- Sveltia's message when publishing isn't allowed yet is vague: "Couldn't publish the entry. Please try again."
  It means the change still needs an approval ([access-levels.md](access-levels.md)).
