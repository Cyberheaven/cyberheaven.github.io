# CMS sign-in ("Sign In with GitHub")

How volunteers sign in to the CMS at <https://cyberheaven.eu/admin/>, what keeps it working, and how to fix
it.

> **Status:** working since 21 Oct 2026 (tested by signing in on the live site). Who may do what once signed in: [access-levels.md](access-levels.md). The CMS itself: [cms.md](cms.md).

## Why there's a separate login service

Signing in with GitHub ends with swapping a one-time code for an access token, and GitHub only does that swap for
someone who knows the OAuth app's **client secret**. A static site can't keep a secret (everything on GitHub Pages
is public), so a tiny service does the swap: **sveltia-cms-auth**, made by the Sveltia team, running free on
Cloudflare Workers. (Sveltia has a no-server option, PKCE, on its roadmap; it isn't available for GitHub yet.)

Without it, Sveltia falls back to Netlify's login service, which doesn't know this site: the sign-in popup shows
`api.netlify.com/auth?...` and **Not Found**.

## The pieces and where they live

| Piece | Where | Who can manage it |
| --- | --- | --- |
| Login service (Worker `sveltia-cms-auth`) | Cloudflare account **cyberheavenhq@proton.me** (account id `980d3a553e327394723e423ce87b7a88`) → *Workers & Pages* → `sveltia-cms-auth`. URL: **<https://sveltia-cms-auth.cyberheavenhq.workers.dev>** | Whoever has the login of that shared Cloudflare account (one account on the project email, by choice: no separate members). Hand its password over with the project email. |
| Its code | Not in this repo: it's upstream [sveltia/sveltia-cms-auth](https://github.com/sveltia/sveltia-cms-auth), deployed as-is (commit `5623041`, 20 Oct 2026). One file, `src/index.js`, MIT licence. | — |
| GitHub OAuth app **CyberHeaven CMS** | <https://github.com/organizations/Cyberheaven/settings/applications> (owned by the organisation, not a person). Callback URL: `https://sveltia-cms-auth.cyberheavenhq.workers.dev/callback` | Organisation owners (currently PurpleShonen, medhansh5, timo123421). |
| Worker settings | Cloudflare → `sveltia-cms-auth` → *Settings → Variables and Secrets*: `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` (both must be type **Secret**: a *Variable*'s value is shown to anyone looking at the page, and Cloudflare even prints it in its "update your Wrangler configuration" hint), `ALLOWED_DOMAINS` = `cyberheaven.eu,localhost` (since 28 Oct 2026; set there, or by the deploy command below). | Cloudflare account. |
| CMS setting | `public/admin/config.yml` → `backend:` → `base_url: https://sveltia-cms-auth.cyberheavenhq.workers.dev` | Anyone who can change the repo. |

**Never commit the client secret** or paste it into issues or chats. It only lives in the GitHub OAuth app page
(shown once, when generated) and in the Worker's secrets.

## What happens when someone signs in

1. *Sign In with GitHub* opens a popup at `<worker>/auth?provider=github&site_id=<site>&scope=public_repo`.
2. The Worker checks that `<site>` is in `ALLOWED_DOMAINS`, then sends the popup to GitHub's *Authorize
   CyberHeaven CMS* page. The scope is `public_repo` (`auth_scope` in `config.yml`): access to public repos only.
3. GitHub sends the popup back to `<worker>/callback` with a one-time code. The Worker swaps it for a token using
   the client secret, and hands the token to the CMS window, but only if that window is on an allowed domain.
4. The CMS keeps the token in the browser. The Worker stores nothing.

## Updating or redeploying the Worker

The code changes rarely. To update it, or to redeploy after a change to `ALLOWED_DOMAINS`:

```sh
git clone --depth 1 https://github.com/sveltia/sveltia-cms-auth.git /tmp/sveltia-cms-auth
cd /tmp/sveltia-cms-auth
npx wrangler login      # log in as the CyberHeaven Cloudflare account (cyberheavenhq@proton.me)
npx wrangler deploy --var ALLOWED_DOMAINS:cyberheaven.eu,localhost
npx wrangler logout     # don't leave the shared account logged in on your machine
```

- **Always pass `--var ALLOWED_DOMAINS:…`**: a deploy replaces the Worker's plain variables with what the command
  gives it. `cyberheaven.github.io` and `www.cyberheaven.eu` aren't needed: both redirect to `cyberheaven.eu`, so
  the CMS never runs there. The two `GITHUB_*` values are *secrets*, which survive deploys; keep them as secrets.
- Read upstream's changes before updating (it's one short file), then note the new commit in the table above.
- Check afterwards with the test below.

## Testing it

```sh
W=https://sveltia-cms-auth.cyberheavenhq.workers.dev
curl -s "$W/auth?provider=github&site_id=evil.example" | grep -o UNSUPPORTED_DOMAIN       # another site: refused
curl -s -o /dev/null -w "%{http_code}\n" "$W/auth?provider=github&site_id=cyberheaven.eu"   # ours: 302 (to GitHub)
```

Then sign in on <https://cyberheaven.eu/admin/> in a private window, in Firefox and Chrome. The same test runs every
Monday and opens an issue if it fails ([hosting.md](hosting.md#weekly-look-outs)).

## Changing the domain

The site moved from `cyberheaven.github.io` to `cyberheaven.eu` on 28 Oct 2026. For a future move, do all of these,
in this order:

1. Own the domain and point it at GitHub Pages: *Settings → Pages → Custom domain* ([hosting.md](hosting.md)).
2. Redeploy the Worker with the new domain added:
   `npx wrangler deploy --var ALLOWED_DOMAINS:<new domain>,cyberheaven.eu,localhost` (drop `cyberheaven.eu` once
   it redirects to the new domain, and as soon as we no longer own it)
3. In the OAuth app, set *Homepage URL* to the new address (the callback URL stays the Worker's).
4. In `astro.config.mjs`, change `site` to the new address.

**Only list domains we control.** Whoever controls a listed domain could use this service to collect volunteers'
GitHub tokens, so remove a domain from `ALLOWED_DOMAINS` as soon as we stop owning it.

## When it goes wrong

| What you see | Cause | Fix |
| --- | --- | --- |
| Popup at `api.netlify.com/auth…`: **Not Found** | `base_url` is missing from `config.yml`. | Add it (see the table at the top). |
| "Your domain is not allowed to use the authenticator" (`UNSUPPORTED_DOMAIN`) | The site's address isn't in `ALLOWED_DOMAINS`. | Redeploy with it added. |
| "OAuth app client ID or secret is not configured" (`MISCONFIGURED_CLIENT`) | A `GITHUB_*` secret is missing on the Worker. | Add it under *Variables and Secrets* (type Secret), deploy. |
| GitHub says **"The redirect_uri is not associated with this application"** | The OAuth app's redirect URI (callback URL) isn't exactly `<worker>/callback`. | Fix it in the OAuth app settings. |
| Volunteers get signed out every few hours | *Expire user access tokens* is on in the OAuth app. | Turn it off. |
| "Potential CSRF attack detected" | The popup took over 10 minutes, or the browser blocked the Worker's cookie. | Try again; allow cookies for `workers.dev`. |
| GitHub error **"bad_verification_code"** or sign-in suddenly fails for everyone | The client secret was regenerated or deleted. | Generate a new secret in the OAuth app and put it in the Worker's `GITHUB_CLIENT_SECRET`. |
| Nothing opens | The browser blocked the popup. | Allow popups for `cyberheaven.eu`. |
| Signed in, but Publish fails ("Couldn't publish the entry") | Not a sign-in problem: the change needs an approval. | [access-levels.md](access-levels.md). |

If the service is down, volunteers can still use *Sign In Using Access Token* with a classic personal access token
(`public_repo` scope).

## If a token or the secret leaks

- **Client secret:** in the OAuth app (*Generate a new client secret*), then in Cloudflare → `sveltia-cms-auth` →
  *Settings → Variables and Secrets*: delete `GITHUB_CLIENT_SECRET` and add it again with type **Secret** and the new
  value. Test sign-in, then *Delete* the old secret in the OAuth app. Nobody's sign-in is lost: tokens already given
  out keep working. (Done on 28 Oct 2026, after it had been stored as a plain variable and showed in a screenshot;
  both `GITHUB_*` values are Secrets since.)
- **Everyone's sign-ins:** the OAuth app's *Revoke all user tokens* signs everyone out; they just sign in again.
- **One person's token:** they revoke it at <https://github.com/settings/applications> (*Authorized OAuth Apps*).

## Rebuilding it from nothing

If the Worker or the OAuth app is lost:

1. Deploy the Worker (commands above) to the CyberHeaven Cloudflare account; note its URL.
2. Create the OAuth app at <https://github.com/organizations/Cyberheaven/settings/applications/new>:
   - *Application name* `CyberHeaven CMS`; *Homepage URL* `https://cyberheaven.eu`; *Application
     description* `Sign in to write and edit the CyberHeaven site.` (volunteers see it on GitHub's Authorize page)
   - *Redirect URI* (older GitHub pages call it *Authorization callback URL*): `<worker URL>/callback`, only that one
   - *Allow wildcard matching*: **off** (it would let tokens go to addresses we don't control)
   - *Enable Device Flow*: **off** (not used)
   - *Expire user access tokens*: **off** (the Worker doesn't handle refresh tokens, so volunteers would be signed
     out every 8 hours)
   - *Register application*, then *Generate a new client secret*.
3. In Cloudflare, add `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` to the Worker as **Secrets**.
4. Put the Worker URL in `base_url` in `public/admin/config.yml`, and update the table at the top of this page.
5. Test (above).
