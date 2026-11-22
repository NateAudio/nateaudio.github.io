## Purpose
Provide concise, actionable guidance for AI coding agents working on this Jekyll-based portfolio site.

## Quick start (local)
- Install Ruby gems from the `Gemfile`: `bundle install`.
- Serve locally: `bundle exec jekyll serve --livereload --incremental` (site root, preview at http://localhost:4000).
- For a single build: `bundle exec jekyll build`.

## Where to look (important files)
- Site config: [_config.yml](_config.yml) — uses `kramdown`, `jekyll-feed`, `baseurl` is blank for a user site.
- Home/entry: [index.html](index.html)
- Layouts: [_layouts/default.html](_layouts/default.html)
- Posts: [_posts/]( _posts/ ) — date-prefixed filenames, e.g. [_posts/2026-01-28-first_post_1.md](_posts/2026-01-28-first_post_1.md).
- Assets: [css/style.css](css/style.css), [js/main.js](js/main.js), [assets/](assets/)
- Project README: [README.md](README.md)

## Content & conventions (discoverable rules)
- Blog posts live in `_posts/` and follow the standard Jekyll filename format `YYYY-MM-DD-title.md`.
- Use YAML front matter for metadata. Common fields used here include `title`, `date`, and `layout` (see existing posts in `_posts/`).
- Markdown flavor: repository sets `markdown: kramdown` in [_config.yml](_config.yml).
- The site uses a minimal custom layout in [_layouts/default.html](_layouts/default.html); modify the layout for global style changes.

## Editing examples
- Add a new post: create a file under `_posts/` named `YYYY-MM-DD-your-title.md` with YAML front matter and body content — mirror format used in existing `_posts/*.md` files.
- Update CSS/JS: edit [css/style.css](css/style.css) and [js/main.js](js/main.js); assets are static and referenced directly from templates.

## Build & deploy notes
- The repository includes a `Gemfile`; the canonical local workflow is via `bundle install` + `bundle exec jekyll serve`.
- `_config.yml` has `url: "https://nateaudio.github.io"` and `baseurl: ""` — this is set for a user/org site; do not change `baseurl` unless converting to a project site.

## Integration & external dependencies
- Uses the `jekyll-feed` plugin (declared in `_config.yml`). No other build scripts or CI files are present in the repo.

## What I could not discover
- No CI configuration (GitHub Actions) or tests present — assume local `bundle exec jekyll` for verification.

## How to help me next
- If you want more targeted guidance, specify a task: e.g., "add post with tags and open-graph metadata" or "convert layout to include a nav partial."  

---
If anything here is unclear or you want additional rules (naming, commit message style, or deployment steps), tell me which area to expand.
