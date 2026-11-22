# Nate Audio

Nate Audio is my personal music portfolio and blog.

The site is primarily a place to showcase music and sound-design work, especially work related to video games, interactive media, and independent creative projects. It also includes a blog for longer-form thoughts about music, sound design, technology, creative work, and related subjects.

The live website is:

https://nateaudio.github.io/

---

## What This Project Is

This is a lightweight custom website built with Jekyll and hosted with GitHub Pages.

The goal is to keep the site:

- personal
- visually distinctive
- fast and lightweight
- easy to maintain
- easy to update
- understandable even without extensive web-development experience

The project intentionally uses a custom synthwave-inspired design rather than a prebuilt Jekyll theme.

---

# How the Website Works

At a high level, the repository contains two kinds of things:

1. **Source code and content** that I edit.
2. **Jekyll**, which uses those files to build the finished website.

Jekyll is a static-site generator.

Instead of manually creating a separate HTML page for every blog post, I can write posts as Markdown files. Jekyll combines those posts with the site's layouts and configuration to generate the pages that visitors see.

GitHub Pages then publishes the generated site.

---

# Important Files and Folders

## `index.html`

This is the main Nate Audio homepage.

It contains:

- navigation
- hero section
- interactive music visualizer
- portfolio section
- SoundCloud players
- recent blog-post previews
- contact section
- audio used by the visualizer

If something on the main landing page needs structural changes, this is usually the first place to look.

---

## `_config.yml`

This is the main Jekyll configuration file.

It contains site-wide information such as:

- site title
- site description
- website URL
- Markdown configuration
- Jekyll plugins

This generally should not require frequent changes.

---

## `_layouts/default.html`

This is the shared HTML layout used by blog and content pages.

It provides common page structure such as:

- HTML document setup
- navigation
- global stylesheet
- main content area
- JavaScript loading

Jekyll places the contents of an individual page or blog post into this layout when the site is built.

---

## `_posts/`

This folder contains blog posts.

Jekyll blog-post filenames follow this format:

```text
YYYY-MM-DD-title.md
```

For example:

```text
2026-02-26-how-to-make-chiptune.md
```

The date in the filename is important because Jekyll uses it when processing posts.

---

## `blog/index.md`

This creates the main blog listing page.

Rather than manually listing every article, it loops through the posts Jekyll knows about and automatically displays their:

- title
- date
- excerpt
- link

This means adding a properly formatted file to `_posts/` also allows it to appear automatically in the blog listing.

---

## `css/style.css`

This contains most of the visual design of the site.

It controls things such as:

- colors
- typography
- layout
- navigation
- portfolio cards
- blog presentation
- responsive behavior
- mobile layout
- synthwave effects
- animations
- visualizer presentation

Because CSS rules can override one another depending on their position and specificity, changes here should be tested carefully.

---

## `js/main.js`

This contains the interactive JavaScript used by the site.

Its main responsibility is currently the homepage music visualizer.

It handles things such as:

- canvas sizing
- idle animation
- audio analysis
- audio-reactive graphics
- visual effects on the Nate Audio title
- visual effects on the navigation
- audio playback interaction
- starting and stopping visualizer behavior

This is one of the more complex files in the repository and should be changed incrementally and tested after meaningful edits.

---

## `assets/`

This contains static files used by the website, including audio and images.

Current examples include the audio used for the homepage visualizer and images used by blog content.

---

## `PROJECT_STATE.md`

This is the project's technical continuity document.

It records:

- current architecture
- current project status
- known-good behavior
- cleanup decisions
- technical debt
- development workflow
- planned work
- important design intentions

If development stops for a while, this file should make it possible to understand where the project left off without reconstructing everything from Git history.

---

## `sync-to-onedrive.ps1`

This is a development helper script.

It copies the current local repository into the OneDrive checkpoint used during development with Microsoft Copilot.

The local Git repository remains the authoritative working copy.

The OneDrive copy should be treated only as a synchronized review checkpoint.

---

# Local Development

The normal development location is:

```text
C:\Users\nwn27\Documents\Projects\nateaudio.github.io
```

Open this folder in VS Code before making changes.

---

## Install Jekyll Dependencies

The project contains a `Gemfile` for its Ruby/Jekyll dependencies.

From a terminal opened in the repository root:

```powershell
bundle install
```

This installs the Ruby gems required by the project.

This normally only needs to be done when initially setting up the development environment or when dependencies change.

---

## Run the Site Locally

From the repository root:

```powershell
bundle exec jekyll serve --livereload --incremental
```

Jekyll should then make the development site available at:

```text
http://localhost:4000
```

`--livereload` allows the browser to refresh automatically for many changes.

`--incremental` allows Jekyll to rebuild only files affected by a change when possible.

To stop the local server, press:

```text
Ctrl + C
```

in the terminal where Jekyll is running.

---

## Build Without Starting the Development Server

To perform a build only:

```powershell
bundle exec jekyll build
```

Jekyll generates the resulting site into the `_site` directory.

`_site` is generated output, not authoritative source code.

Do not manually develop the website inside `_site`.

---

# Adding a Blog Post

Create a new Markdown file inside:

```text
_posts
```

Use a filename in this format:

```text
YYYY-MM-DD-your-post-title.md
```

A typical post begins with YAML front matter similar to:

```yaml
---
title: "My Post Title"
date: 2026-11-22
excerpt: "A short description of the article."
layout: default
---
```

Write the actual article underneath the closing `---`.

For example:

```markdown
# My Post Title

Here is the opening paragraph of the article.

## A Section

Here is some more content.
```

Before publishing a new post:

1. Run the site locally.
2. Confirm the post appears in the blog.
3. Open the individual post.
4. Check formatting, links, and images.
5. Check the homepage blog preview when appropriate.
6. Commit the finished change to Git.

---

# Project Development Workflow

The project deliberately uses three different systems for three different purposes.

## Local repository

```text
C:\Users\nwn27\Documents\Projects\nateaudio.github.io
```

This is the authoritative development copy.

**Edit files here.**

---

## Git

Git provides local version history.

Useful commands include:

```powershell
git status
```

Shows which files have changed.

```powershell
git add <filename>
```

Stages a file for the next commit.

```powershell
git commit -m "Describe the change"
```

Creates a local version-history checkpoint.

```powershell
git log --oneline
```

Shows recent commits.

A Git commit does NOT automatically publish the website.

---

## OneDrive checkpoint

The OneDrive review copy is located at:

```text
C:\Users\nwn27\OneDrive\Projects\nateaudio.github.io
```

To update it, run:

```powershell
.\sync-to-onedrive.ps1
```

The script mirrors the local repository into the OneDrive checkpoint.

### Important

The OneDrive desktop application must be running for changes in the local OneDrive folder to continue syncing to the OneDrive cloud.

The PowerShell script performs:

```text
Local repository
        ↓
Local OneDrive folder
```

The OneDrive application performs:

```text
Local OneDrive folder
        ↓
OneDrive cloud
```

These are two separate steps.

A successful Robocopy operation proves that the local OneDrive checkpoint was updated. It does not by itself prove that OneDrive has uploaded the new files to the cloud.

The OneDrive copy should not be edited independently.

---

# GitHub and Publishing

The Git remote for this repository is:

```text
https://github.com/NateAudio/nateaudio.github.io
```

Local commits can exist without being published to GitHub.

To send committed changes to GitHub:

```powershell
git push
```

Because this repository backs the GitHub Pages site, changes intended for the live website should be tested locally before they are pushed.

The general publishing workflow is:

```text
Edit locally
    ↓
Test locally
    ↓
Commit with Git
    ↓
Create OneDrive review checkpoint when needed
    ↓
Push to GitHub when ready
    ↓
Verify the live site
```

---

# Safe Development Rules

## Before changing code

Run:

```powershell
git status
```

Ideally, begin a new piece of work from a clean working tree.

---

## Make focused changes

Avoid changing HTML structure, CSS organization, JavaScript behavior, and site content all at once unless the change truly requires them together.

Smaller changes are easier to:

- understand
- test
- debug
- review
- revert

---

## Test before stacking more changes

If something unexpectedly breaks:

1. Stop adding new changes.
2. Determine which change caused the regression.
3. Fix or revert that change.
4. Confirm the known-good behavior has returned.
5. Continue only after the problem is understood.

Do not bury an unexplained problem under additional edits.

---

## Commit meaningful checkpoints

A commit should represent a state worth returning to.

Good commit messages briefly explain what changed.

Examples:

```text
Improve README documentation
Clean homepage HTML structure
Consolidate responsive CSS
Fix visualizer playback state
Add reduced motion support
```

---

# Known-Good Behavior

During the current cleanup phase, preserve these behaviors unless intentionally changing them.

## Homepage

- Navigation works.
- Hero content displays.
- Portfolio section displays.
- Blog preview displays recent posts.
- Contact section displays correctly.
- Existing scrolling behavior works.

## Portfolio

- SoundCloud players display.
- Portfolio tracks remain accessible.

## Blog

- Recent posts appear automatically on the homepage.
- Blog index displays posts.
- Individual post pages render correctly.

## Audio visualizer

- Music-note control starts audio.
- Visualizer reacts to the music.
- Hero/title effects react during playback.
- Navigation effects react during playback.
- Visualizer returns to its idle behavior after playback stops.

## Contact

- Email address displays.
- Email link works.

---

# Current Modernization Strategy

The functioning site is being cleaned incrementally rather than rewritten.

The current order of work is:

1. Documentation and project-state cleanup
2. Establish regression testing
3. HTML cleanup
4. CSS organization and consolidation
5. JavaScript organization and reliability
6. Accessibility improvements
7. Final clean-baseline validation
8. Creative redesign and modernization

The creative redesign phase will happen only after the existing implementation is understood and cleaned.

That later phase may include reconsidering:

- portfolio presentation
- emphasis on game music
- homepage experience
- visual identity
- interactive visualizer
- blog organization
- project presentation
- collaboration messaging

---

# Design Principle

Nate Audio is not intended to become a generic corporate website.

The code should become cleaner without cleaning the personality out of the site.

The target is:

**Clean + understandable + maintainable + accessible + reliable + expressive.**

For detailed technical status and current development decisions, see:

```text
PROJECT_STATE.md
```