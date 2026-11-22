# Nate Audio - Project State

## Status

**Project:** Nate Audio  
**Repository:** nateaudio.github.io  
**Platform:** GitHub Pages / Jekyll  
**Current phase:** Baseline cleanup and modernization  
**Development status:** Existing live site is functional; cleanup is beginning from a known-good baseline.

---

# 1. Project Purpose

Nate Audio is a personal music portfolio and blog.

The primary purpose of the site is to provide a distinctive place to showcase music and sound-design work, particularly work relevant to video games and other interactive or independent projects.

The site should be useful when sharing work with potential collaborators, musicians, producers, game developers, or other people interested in working together.

The blog provides a separate place for longer-form thoughts about music, sound design, game audio, technology, creative work, and related subjects.

The goal is not to turn the site into a large or complicated web application.

The site should remain:

- lightweight
- personal
- visually distinctive
- understandable
- reliable
- maintainable
- easy to update

---

# 2. Development Philosophy

The existing website is a working project, not a failed prototype.

Modernization should therefore happen incrementally rather than through a complete rewrite.

The guiding rule is:

> Preserve working behavior first. Improve implementation second. Redesign creatively only when intentional.

Technical cleanup should not remove personality merely for the sake of architectural purity.

The desired standard is:

**Clean + understandable + maintainable + accessible + reliable + expressive.**

---

# 3. Source of Truth and Development Workflow

The authoritative development copy is the local Git repository:

C:\Users\nwn27\Documents\Projects\nateaudio.github.io

Git provides local version history.

The GitHub repository provides the remote repository and deployment source for the live GitHub Pages website.

A separate OneDrive copy is used as a collaboration checkpoint so Microsoft Copilot can inspect the current project state:

C:\Users\nwn27\OneDrive\Projects\nateaudio.github.io

The OneDrive copy is NOT a second development repository.

Changes flow in one direction:

Local working repository
→ Git history
→ OneDrive checkpoint for review

and, when ready for publication:

Local Git repository
→ GitHub
→ GitHub Pages

---

# 4. OneDrive Checkpoint Workflow

The repository contains:

`sync-to-onedrive.ps1`

This PowerShell script mirrors the current local source tree into the OneDrive checkpoint.

The script intentionally excludes generated or unnecessary development directories including:

- `.git`
- `_site`
- `vendor`
- `node_modules`

The local repository remains authoritative.

Do not manually develop separate versions of files in the OneDrive checkpoint.

---

# 5. Git Baseline

At the start of the cleanup project:

- Branch: `main`
- Git working tree was clean.
- Local `main` matched `origin/main`.
- Last pre-cleanup site commit: `9c6dc88` (`Blog Test`)
- Repository remote:
  `https://github.com/NateAudio/nateaudio.github.io`

The OneDrive checkpoint script was subsequently added in commit:

`49720d3` - `Add OneDrive checkpoint script`

At that point local `main` was one commit ahead of `origin/main`.

This establishes the known-good starting point for the modernization work.

---

# 6. Current Architecture

Nate Audio is a small custom Jekyll website hosted using GitHub Pages.

Important project areas include:

## Site configuration

`_config.yml`

Contains Jekyll site configuration, including the site title, description, URL, Markdown configuration, and plugins.

## Homepage

`index.html`

The homepage currently uses `layout: null` and contains its own HTML document structure.

It contains:

- site navigation
- hero section
- interactive canvas visualizer
- portfolio
- SoundCloud embeds
- blog preview
- contact section
- audio element
- JavaScript include

## Shared content layout

`_layouts/default.html`

Used primarily by blog/content pages.

It provides:

- standard HTML document structure
- navigation
- global stylesheet
- page content container
- JavaScript include

## Blog index

`blog/index.md`

Automatically loops through Jekyll posts and displays their titles, dates, excerpts, and links.

## Blog posts

`_posts/`

Posts use Jekyll's standard date-prefixed filename convention:

`YYYY-MM-DD-title.md`

Posts use YAML front matter for page metadata.

## Styles

`css/style.css`

Contains the visual design of the website, responsive behavior, synthwave styling, animations, portfolio/blog presentation, visualizer styling, and content-page styling.

## JavaScript

`js/main.js`

Contains the interactive homepage behavior, including:

- canvas sizing
- idle visualizer animation
- audio analysis
- audio-reactive rendering
- reactive title/navigation effects
- playback interaction
- visualizer start/stop state

## Static assets

`assets/`

Contains audio, images, and other static media used by the site.

---

# 7. Current Visual Identity

The existing site intentionally uses a synthwave-inspired aesthetic.

Important characteristics include:

- very dark blue/black backgrounds
- cyan accents
- magenta accents
- glowing elements
- grid imagery
- animated elements
- retro visualizer imagery
- music-note motifs

These characteristics are part of the site's personality and should not be removed merely as part of technical cleanup.

Creative redesign decisions will happen separately after the existing implementation has been cleaned and documented.

---

# 8. Known-Good Behaviors

The following behavior should be preserved during the cleanup phase unless a change is explicitly intentional.

## Homepage

- Site loads successfully.
- Fixed navigation is present.
- Home navigation reaches the hero.
- Portfolio navigation reaches the portfolio section.
- Blog navigation reaches the blog section.
- Contact navigation reaches the contact section.
- Hero content displays correctly.
- Homepage sections use the existing scrolling experience.

## Portfolio

- Three portfolio entries are currently displayed.
- SoundCloud players render.
- SoundCloud tracks can be accessed from the portfolio area.

## Blog

- Homepage automatically displays recent Jekyll posts.
- "View all posts" opens the blog index.
- Blog index automatically lists posts.
- Individual blog posts render through the Jekyll content system.

## Interactive audio / visualizer

- The hero includes an interactive music-note control.
- The control starts audio playback.
- Canvas visualization responds to audio.
- Navigation and hero visual effects react while audio is playing.
- Stopping/ending playback returns the visualizer toward its idle state.
- Idle animation and active playback rendering are intended to remain separate animation loops.

## Contact

- Contact section displays the Nate Audio email address.
- Email address functions as a mail link.

---

# 9. Read-Only Audit Summary

The initial repository audit found that the overall architecture is appropriate for this project.

A complete rewrite is NOT recommended.

Most technical debt appears to have resulted from iterative additions and fixes rather than a fundamentally poor architecture.

The cleanup project should therefore focus on clarification, consolidation, reliability, accessibility, and documentation.

---

# 10. KEEP

The following concepts should currently be preserved.

- Jekyll
- GitHub Pages
- `_posts` blog architecture
- shared blog/content layout
- lightweight static-site architecture
- CSS custom properties/design tokens
- synthwave visual identity
- SoundCloud portfolio concept
- interactive homepage audio
- audio-reactive canvas concept
- automatic homepage blog preview
- automatic blog index
- intentionally custom visual effects

"KEEP" does not mean the implementation can never be improved.

It means these concepts are currently considered part of the site's good foundation.

---

# 11. CLEAN

The following areas work but should be made easier to understand and maintain.

## CSS organization

Current CSS shows evidence of iterative development.

Cleanup candidates include:

- overlapping responsive declarations
- repeated selectors
- repeated properties
- historical/workaround comments
- unclear separation between desktop and mobile behavior
- opportunities to organize related rules into clearer sections

The cleanup must respect CSS cascade behavior and should not blindly consolidate rules without testing.

## Homepage HTML

Potential cleanup includes:

- clearer organization
- reducing presentation styles embedded directly in markup
- especially repetitive SoundCloud attribution styling
- improving comments

## Comments

Comments should explain:

- why code exists
- what a section controls
- browser-specific workarounds
- relationships between components
- values likely to be safely changed later

Comments should not simply narrate obvious syntax.

They should be useful to a future maintainer who is not an experienced programmer.

## Git housekeeping

`.gitignore` is currently very small and should eventually be reviewed against the actual files produced by the local development workflow.

---

# 12. FIX

These items may represent actual correctness or reliability problems rather than cosmetic cleanup.

## Audio playback state

The current JavaScript begins visual "playing" behavior immediately after requesting audio playback.

If `audio.play()` fails, the interface may still enter its playing state.

Playback state should eventually reflect successful audio playback rather than merely the request to begin playback.

## README

The current README does not meaningfully document the project.

It should eventually explain:

- what Nate Audio is
- repository structure
- local development
- Jekyll workflow
- how to add blog posts
- how to update portfolio content
- how to test changes
- checkpoint workflow
- deployment workflow

## Blog front matter

Blog post front matter should be checked directly in the source repository for consistency before modifying any posts.

Do not assume that formatting differences seen through search/indexing necessarily represent malformed local source.

---

# 13. IMPROVE

These are worthwhile improvements but are not considered evidence that the current site is broken.

## Accessibility

Review:

- keyboard focus styling
- audio control state
- screen-reader labeling
- reduced-motion behavior
- color contrast
- navigation semantics
- mobile interaction behavior

The existing visual identity should be retained while improving accessibility.

## Maintainability

Consider:

- clearer organization of JavaScript responsibilities
- improved configuration grouping
- reusable portfolio data/templates
- consistent Jekyll conventions
- better site metadata
- clearer developer documentation

---

# 14. LATER / CREATIVE REDESIGN

Do not mix these changes into the initial technical cleanup.

They require a separate creative discussion.

Potential future areas include:

- improved portfolio presentation
- stronger emphasis on video-game music
- improved presentation of individual projects
- visual identity refinements
- canvas visualizer redesign
- richer music interaction
- blog categories/tags
- social sharing metadata
- article/content revisions
- clearer collaboration/call-to-action messaging

The existing visualizer should not be removed merely because its implementation can be improved.

Its core concept, a music portfolio whose visual presentation reacts to music, is considered valuable and worth exploring further.

---

# 15. Current Cleanup Roadmap

The planned cleanup sequence is:

## Phase 0 - Development workflow

Status: COMPLETE

- Verify Git repository
- Verify GitHub remote
- Verify clean baseline
- Create OneDrive checkpoint workflow
- Test PowerShell synchronization
- Git-track checkpoint script

## Phase 1 - Repository audit and documentation

Status: IN PROGRESS

- Perform read-only repository audit
- Create PROJECT_STATE.md
- Expand README.md
- Establish regression checklist

## Phase 2 - Structural cleanup

Planned:

1. HTML organization
2. CSS consolidation
3. JavaScript organization
4. Playback-state reliability fix
5. Comment/documentation improvements

Each change should be small enough to test and understand before continuing.

## Phase 3 - Accessibility

Planned:

- keyboard behavior
- focus states
- reduced-motion support
- interactive-control state
- contrast review
- mobile interaction review

## Phase 4 - Clean baseline validation

Planned:

- run local Jekyll build
- run regression checklist
- verify desktop behavior
- verify mobile behavior
- verify blog behavior
- verify audio/visualizer behavior
- Git commit
- OneDrive checkpoint
- push to GitHub
- verify GitHub Pages deployment

At completion:

**OLD NATE AUDIO = CLEAN**

## Phase 5 - Creative modernization

Only after the technical baseline is clean:

- review what should be kept
- review what should change
- reconsider portfolio presentation
- reconsider homepage experience
- explore visualizer 2.0
- develop stronger Nate Audio identity
- expand and refine blog direction

---

# 16. Regression Rule

Before changing an existing behavior, first determine whether the change is intentional.

If an existing behavior changes unexpectedly:

1. Stop.
2. Identify which change caused the regression.
3. Fix the regression or revert the change.
4. Do not stack additional cleanup on top of unexplained behavior.

Git should be used to create small known-good checkpoints throughout the cleanup.

---

# 17. Working Agreement

During collaborative development:

- The local repository is authoritative.
- Git records meaningful milestones.
- OneDrive provides review checkpoints.
- GitHub provides remote version history and live deployment.
- Changes should be explained in beginner-friendly language.
- Important code should contain explanatory comments.
- Complete replacement files are preferred when fragmented edits would be error-prone.
- Working behavior should not be changed accidentally during cleanup.
- Creative redesign should remain separate from technical cleanup unless intentionally combined.

---

# 18. Immediate Next Steps

1. Add this PROJECT_STATE.md file.
2. Review it for accuracy.
3. Commit it as a documentation-only checkpoint.
4. Sync the repository to OneDrive.
5. Verify the synced PROJECT_STATE.md.
6. Begin the README/documentation cleanup.
7. Establish the regression checklist before modifying functional website code.