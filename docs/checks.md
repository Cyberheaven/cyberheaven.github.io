# Checks before publishing

Every pull request, including each change saved in the CMS, runs the checks in
[`.github/workflows/checks.yml`](../.github/workflows/checks.yml). A change can't be published until they pass:
the ruleset *Checks pass before publishing*
([`.github/rulesets/checks-pass.json`](../.github/rulesets/checks-pass.json)) requires the check called `Checks`.
Unlike the review rule ([access-levels.md](access-levels.md)), maintainers can't skip it; only repo admins can.

## What is checked

| Script | Fails when |
| --- | --- |
| `scripts/check-roles.mjs` | Someone who isn't a maintainer changed team roles ([access-levels.md](access-levels.md#the-four-levels)). It asks GitHub for the access of whoever opened the pull request. |
| `scripts/check-content.mjs` | An article's cover has no alt text; an old `@cyberheaven.eu` email address; the CMS's starting outline notes (✏️) left in. Content contains HTML (other than the interactive widget line) or a link that runs code (`javascript:`), or Markdown the CMS editor would break (HTML tables, `<iframe>`, `* * *`). |
| `scripts/check-data.mjs` | A category, glossary topic or team role isn't in `src/data/categories.json`; a glossary term or resource link is listed twice; a content file has a field the CMS form (`public/admin/config.yml`) doesn't. |
| `scripts/check-labs.mjs` | A lab exercise can't be solved, or its answer isn't in its data. |
| `scripts/check-career.mjs` | A career quiz path can't win, or a run asks too many questions. |
| `scripts/check-youtube.mjs` | The YouTube link reader is broken. |
| `npm run build` | The site doesn't build (the build has its own checks, e.g. an article whose author doesn't exist). |
| `scripts/check-links.mjs` | A link or image on the built site points to a page or file of the site that doesn't exist. |

The Markdown rules of `check-content.mjs` live in `src/lib/content-rules.mjs`; the CMS's "Before you submit" card
uses the same file, so volunteers see those problems while writing ([cms.md](cms.md#behaviour-added-in-cmsjs)).

All of them run on every pull request, even after one fails, so one run lists everything to fix. Run them
yourself before pushing:

```sh
node scripts/check-content.mjs && node scripts/check-data.mjs && node scripts/check-labs.mjs \
  && node scripts/check-career.mjs && node scripts/check-youtube.mjs && node scripts/check-roles.mjs \
  && npm run build && node scripts/check-links.mjs
```

**Why content may not contain HTML.** The site shows HTML written in Markdown as-is, scripts included. The site
and the CMS share one address (`cyberheaven.eu`), and the CMS keeps everyone's sign-in in the browser there,
so a script slipped into an article could act as any maintainer who opens it. Reviewers can miss a line hidden in
a long article; the check doesn't. The interactive widget line (`<div data-widget="…"></div>`) is the one
exception. Code shown in an article belongs in `backticks` or a code block, where anything goes.

Pull requests that change the CMS itself also run *CMS check* (`.github/workflows/cms-check.yml`), which opens the
CMS in Chrome and Firefox; it isn't required by the rule, see [cms.md](cms.md#testing-the-cms-locally). Dependabot's
weekly update pull requests run the checks above like any other ([hosting.md](hosting.md#keeping-packages-up-to-date)).

## When a check fails

- **In the CMS:** *Publish* says *"Couldn't publish the entry. Please try again."* (the same message as a missing
  approval). The reason is on the pull request on GitHub: *Checks* tab → the red step → its output names the file
  and line.
- **Publishing while the checks still run:** the CMS turns on GitHub's auto-merge, says nothing, and goes back to
  the list; the change goes live by itself once they pass (repo setting `allow_auto_merge`, see
  [access-levels.md](access-levels.md)). GitHub can take a few minutes to notice the checks passed.
- **Contributors' pull requests** (from a fork): GitHub doesn't run workflows for someone's first contribution until
  a maintainer presses *Approve and run* on the pull request (repo setting: Actions → *Require approval for
  first-time contributors*). Until then the check shows as waiting.
- **Contributors' forks** fall behind whenever a file in `.github/workflows` changes: the CMS signs contributors in
  without GitHub's `workflow` permission (`auth_scope: public_repo` in `config.yml`), so it can't copy workflow
  changes into their fork. Their pull requests still work and contain only their edit. Adding `workflow` to
  `auth_scope` would fix it, but would let the CMS change GitHub Actions in every repo the contributor can push to.

Tested on 21 Oct 2026 in a sandbox copy (Sveltia 0.250.0): a contributor whose fork predated the workflow saved an
article (pull request with only that file; its checks waited for *Approve and run*, then passed); a writer's
approved change with a `javascript:` link failed the content check, and *Publish* gave the message above; a
writer's approved change published while checks ran was merged by auto-merge once they passed.

## Changing the checks

- Add a check: a script in `scripts/` that prints what's wrong and exits with 1, plus a step in `checks.yml` with
  `if: ${{ !cancelled() }}`. Add it to the table above and the command above.
- Keep the job's `name: Checks`: the ruleset asks for a check with that name from GitHub Actions
  (`integration_id` 15368). Renaming the job without changing the ruleset blocks every pull request.
- Apply the ruleset to a repo: `gh api -X POST repos/<owner>/<repo>/rulesets --input .github/rulesets/checks-pass.json`.
