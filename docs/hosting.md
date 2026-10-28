# Hosting

The site is a static Astro build served free by **GitHub Pages** at **<https://cyberheaven.eu>** (since 28 Oct 2026;
before that at `cyberheaven.github.io`, which now redirects there), from the repo `Cyberheaven/cyberheaven.github.io`.
GitHub serves an organisation's own site only from a repo with exactly that name, which is why the repo has it.

## How a change gets online

1. Something lands on `main`: a pushed commit, or a change published from the CMS ([access-levels.md](access-levels.md)).
2. The workflow [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml) builds the site with Node 22
   (`withastro/action`) and publishes `dist/` to Pages. It takes a few minutes; progress is on the repo's
   *Actions* tab.
3. If the build fails (for example a CMS entry broke the content schema in `src/content.config.ts`), the live site
   stays as it was and the failed run shows the error. Fix it on `main` and the next run deploys.

To redeploy without a change: *Actions → Deploy to GitHub Pages → Run workflow*.
To go back to an older version: revert the bad commit on `main` (or re-run an older successful run).

## Settings

- *Settings → Pages*: **Source: GitHub Actions**. (If it says "Deploy from a branch", GitHub publishes the raw repo
  files instead of the built site: switch it back.) **Custom domain: `cyberheaven.eu`**, with *Enforce HTTPS* on
  (GitHub offers it once its certificate for the domain is issued). The `CNAME` file at the repo root is what
  GitHub's "add domain" button commits; with an Actions deploy GitHub ignores it, and the setting is what counts.
- DNS for `cyberheaven.eu` (at the domain's registrar), as GitHub asks: `A` records for `185.199.108.153`,
  `185.199.109.153`, `185.199.110.153`, `185.199.111.153`; `AAAA` records for `2606:50c0:8000::153`,
  `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153`; `www` as a `CNAME` to
  `cyberheaven.github.io` (GitHub then sends `www.cyberheaven.eu` to `cyberheaven.eu`). A wrong record can stop
  GitHub from issuing the HTTPS certificate: compare with `dig +short cyberheaven.eu AAAA`.
- `astro.config.mjs` → `site: "https://cyberheaven.eu"`. It's used for canonical links, social previews,
  `robots.txt` and the sitemap. Change it if the address changes.
- The old WordPress site was on the same domain: `redirects` in `astro.config.mjs` send its addresses (each
  article's `/<slug>/`, `/privacy-policy/`, `/contact/`, `/courses/`…) to the same content here, so old links and
  search results keep working.
- Pages serves `dist/404.html` for unknown addresses, and the redirects in `astro.config.mjs` (`/privacy` →
  `/legal#privacy`, …) are built as small HTML pages, since Pages has no server-side redirects.
- **No other repo in the Cyberheaven organisation may turn on GitHub Pages without its own custom domain.** Every
  organisation Pages site without one is served under the organisation's domain, `cyberheaven.eu/<repo>/`: the same
  web address as the CMS.
  The CMS keeps each signed-in person's GitHub token in the browser's storage for that address, so a script on any
  such page could read it. (CyberBot's page was there until 21 Oct 2026; it was taken down for this reason.) Check:
  `gh api orgs/Cyberheaven/repos --jq '.[]|select(.has_pages)|.name'` lists only `cyberheaven.github.io`.

## Keeping packages up to date

Dependabot ([`.github/dependabot.yml`](../.github/dependabot.yml)) checks weekly and opens one pull request for
the site's npm packages and one for the GitHub Actions in `.github/workflows`, when there are updates. They go
through the same checks and review as any change: if the checks pass, a maintainer approves and merges; if not, the
failing step says what the update broke. Sveltia CMS isn't an npm package here, so it's watched separately
([cms.md](cms.md#updating-sveltia)).

## Weekly look-outs

Every Monday [`.github/workflows/weekly.yml`](../.github/workflows/weekly.yml) runs three jobs. None of them fails
anything: each opens an issue when it finds something, or updates its issue if one is already open
([`.github/issue.sh`](../.github/issue.sh)), so there's never a pile. Close the issue once it's dealt with.
*Actions → Weekly → Run workflow* runs them now.

| Job | Issue | What it checks |
| --- | --- | --- |
| New Sveltia version | *Update Sveltia CMS to …* | The pinned version against npm ([cms.md](cms.md#updating-sveltia)). |
| Dead links | *Dead links in the content* | Every link to another site in articles, pages, people, resources, glossary and the career quiz ([`scripts/check-external-links.mjs`](../scripts/check-external-links.mjs)). Only pages that are gone (404, 410, or a domain that doesn't exist) count; sites that refuse automated visits are skipped. The labs' made-up addresses and example domains are left out. |
| Sign-in service | *Sign-in service isn't working* | The two tests from [cms-login.md](cms-login.md): the login service refuses other sites and sends ours to GitHub. The address is `base_url` in `config.yml`. |

## Changing the domain

To move the site to another domain (or back to `cyberheaven.github.io`):

1. Own the domain. Add it under *Settings → Pages → Custom domain*; GitHub lists the DNS records to create there.
2. Change `site` in `astro.config.mjs`, and the address shown in the CMS's Google card (`SearchCard` in
   `public/admin/cms.js`) and the sign-in test in `.github/workflows/weekly.yml`.
3. Let the CMS sign-in work on it: add it to the login service's `ALLOWED_DOMAINS` and update the OAuth app's
   homepage ([cms-login.md](cms-login.md#changing-the-domain)).
4. Once GitHub has issued the certificate, turn on *Enforce HTTPS*.

Content links to the site's own pages are written as `/articles/…` (the "Before you submit" card asks for that), so
they don't depend on the address. People signed in to the CMS on the old address sign in again on the new one.

## Signing in to the CMS on the live site

"Sign In with GitHub" goes through a small login service on Cloudflare Workers: [cms-login.md](cms-login.md).

## Renamed repo

The repo was called `Cyberheaven/CyberHeaven` until 21 Oct 2026. GitHub redirects the old URL and old git remotes,
but update your clone anyway: `git remote set-url origin git@github.com:Cyberheaven/cyberheaven.github.io.git`.
