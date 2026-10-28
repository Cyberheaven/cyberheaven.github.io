# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Primary:** aspiring cybersecurity learners (students, career switchers, beginners) looking for practical, free guides on OSINT, DFIR, malware analysis, SOC careers and Linux.
- **Secondary:** volunteers who write and edit articles, pages and resources through Sveltia CMS (`/admin`), with varying technical skill.

## Product Purpose

CyberHeaven publishes free, practical cybersecurity learning material. After eight years it moved from a funded WordPress site to a community-driven, volunteer-contributed static site to cut hosting costs. Success: learners find and read guides easily, and volunteers can keep content fresh without touching code.

## Positioning

Free for everyone, run by the people who use it. No pricing, paid courses or paid learning paths, ever.

## Operating Context

- Static Astro site; content is Markdown in `src/content/` edited through Sveltia CMS (Git-based, GitHub backend `Cyberheaven/cyberheaven.github.io`, hosted on GitHub Pages at https://cyberheaven.eu).
- Community lives on Discord (discord.gg/QH8mRSCdW9); contact email cyberheavenhq@proton.me.

## Capabilities and Constraints

- Articles (`src/content/articles`), pages (`src/content/pages`), homepage copy (`src/content/site.json`).
- Resources page (`src/data/resources.json`) is a curated, searchable list of external courses, labs, tools, certifications, books and communities, separate from articles and editable in the CMS. Categories for articles, resources and glossary live in `src/data/categories.json` (CMS: Settings).
- CMS schema (`public/admin/config.yml`) must stay in sync with `src/content.config.ts`.
- Code must stay approachable for volunteer contributors.

## Brand Commitments

- Name: CyberHeaven. Logo at `public/assets/logo.webp`.
- CyberHeaven itself never charges: no pricing, paid courses or paid paths. External resources may be marked “Paid” when worth it (owner request, 2026-10-20), but never list prices. CyberHeaven is not affiliated with any listed resource; they are independent recommendations. Never use old @cyberheaven.eu emails.
- Keep the original elias-vent dark theme (Sora, dark ground, scroll-driven sections). Enhance it; never replace it with a different visual style. An Apple-style redesign was tried and rejected.

## Evidence on Hand

- 6 real articles with covers (`public/media/`), topic images (`public/assets/topic-*.webp`).
- No testimonials, member counts or stats. Do not invent them.

## Product Principles

1. Free and open: every page is free to read, no gates.
2. Learner first: clarity and readability beat decoration.
3. Easy to maintain: volunteers edit content in the CMS, not in code.
4. Honest: no fabricated numbers, endorsements or claims.

## Accessibility & Inclusion

Beginner audience; aim for WCAG 2.2 AA, readable body text, reduced-motion support.
