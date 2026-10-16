---
path: tests/**
---

# Playwright + WP Playground Testing Guidelines

## Architecture

- Each `*.spec.ts` file is its own Playwright project, CI matrix job, and WP Playground instance.
- `playwright.config.ts` auto-discovers specs by finding `*.spec.ts` files under `tests/` and walking up from the spec's directory to find the closest `blueprint.json`. A shared blueprint in `tests/` serves all specs unless a subdirectory provides its own override.
- Multiple specs sharing the same `blueprint.json` share a Playground instance. To isolate a test, give it its own directory with its own `blueprint.json`.
- Each spec = one separate GitHub Actions runner = one fresh WP Playground instance. They do NOT share state across specs. Tests within the same spec DO share state.
- `playwright.yml` runs every suite inside `mcr.microsoft.com/playwright` at the tag matching the exact `@playwright/test` pin, on arm64. Screenshot tests run only there (`PW_IMAGE` is set); locally use `npm run test:e2e:screens`. The nightly WP matrix runs outside the image, so it skips them.
- `tests_old/` holds the 1.x editor suites, parked as reference. Nothing discovers or runs them.

## Editor Canvas vs Page

WordPress renders the block editor inside an iframe.

- `editor.canvas` — use for anything inside the editor: blocks, text content, inline styles.
- `page` — use for sidebar panels, toolbar buttons, settings controls.

## Common Pitfalls

- **Never use `page.goBack()`.** WP Playground crashes. Split into separate tests instead.
- **Retries are CI-only.** `retries: process.env.CI ? 1 : 0` in config. One CI retry absorbs runner flakes; local runs stay at 0 so real failures surface.
- **State leaks between tests.** Tests in the same spec share a Playground. Theme, settings, and block defaults persist. Explicitly reset anything a previous test might have changed.
- **Duplicate IDs.** Some WP components render both a visible element and a loading placeholder with the same ID. Use `button#code-block-pro-theme-nord` instead of `#code-block-pro-theme-nord`.
- **Hidden copy-button pre.** The block has a hidden `<pre class="code-block-pro-copy-button-pre">` for clipboard. Use `pre:not(.code-block-pro-copy-button-pre)` when querying the visible code pre.

## Assertions

- Use `toBeInViewport()` not `toBeVisible()` for content hidden by `max-height` / `overflow: hidden`.
- Use `expect.poll()` or `expect(...).toPass({ timeout })` for async operations instead of `waitForTimeout`.
- Use `{ timeout: 10000 }` on `toHaveCSS` when checking dynamically applied styles.

## Preview / Front-End Testing

- `admin.createNewPost()` creates a post, not a page. Preview URL: `/?p=${postId}&preview=true`.
- Save the draft and wait for the saved state before navigating to preview.
- On the front end, use `page.locator('.wp-block-...')` — no `editor.canvas` needed.

## Shared Helpers

`tests/helpers.ts` has `newPost`. The 1.x helpers (`insertCodeBlock`, `setTheme`, …) are in `tests_old/helpers.ts` for reference.

## Config

- Discovery globs `tests/` only, so `tests_old/` and `node_modules/` never load.
- Use `.filter((s): s is { ... } => s !== null)` instead of `.filter(Boolean)` for type narrowing.
