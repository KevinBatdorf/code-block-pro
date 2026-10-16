# Stored-block fixtures

Sixty-five fixtures of Code Block Pro blocks, exactly as the editor saved
them — 1.28.0 for all but three: one from 1.27.3 and two from 1.17.0, because
real sites still hold what those releases saved.

The block is being rebuilt — new attributes, a PHP render callback, a different
highlighter. Every one of those blocks is already sitting in `post_content` on a
real site, and none of them can break. This set is how that gets proved:

1. **They still open.** `tests/legacy-blocks` loads each one into the editor and
   asserts the block parses valid and shows no warning.
2. **They still render.** The same spec publishes each one and compares the front
   end against `baseline.json` — text, every glyph's colour, each line's blur,
   highlight and numbering, typography and height — and, inside the pinned
   Playwright image, against a screenshot of every block, hovered and expanded
   where that changes it.
3. **They migrate.** The attributes in each block comment are the input a
   converter has to map to the new shape. Parse them; don't hand-write them.

## Files

| | |
| --- | --- |
| `blocks/*.html` | The artifacts. Frozen `post_content`, one file per fixture. |
| `blocks/all.html` | All of them in one document, for looking at a page of them. |
| `index.json` | Slug, the file, and what a diff in that fixture tells you. |
| `baseline.json` | What the 1.x front end made of each one. |
| `../legacy-blocks/legacy-blocks.spec.ts-snapshots/` | What each one looked like, inside the pinned Playwright image. |
| `fixtures.ts` | How they were produced. History, not the source of truth. |
| `code/` | The code samples they hold. Excluded from oxfmt, oxlint and tsc. |
| `digest.ts`, `shoot.ts` | Read and screenshot a rendered block. Used by the regression spec. |
| `publish.ts` | Publishes the fixtures for the regression spec. |

Fixture 63 opens invalid in the 1.x editor, as every 1.27.2–1.27.3 block saved
with the copy button's textarea option (`copyButtonUseTextarea`) does since
1.27.4. `opensInvalid` in `index.json` holds the validation test to that, so
accepting those blocks has to be a deliberate change.

## Do not regenerate them

Regenerating runs the current save path, so the moment that path changes the
generator stops producing 1.x blocks and starts producing whatever the rebuild
produces — which is the one thing this set exists to catch. `blocks/` is the
source of truth from here on.

The generator drives the 1.x editor, which this tree no longer has, so it runs
from a release's wordpress.org zip: unzip it, copy in this checkout's `tests/`, `node_modules/` and
`playwright.config.ts` (the release has neither the config nor the npm script),
and from there run
`GENERATE_FIXTURES=1 ONLY=<slug> RUN_PROJECT=generate npx playwright test --project=generate`.
`ONLY=<slug,slug>` writes just those, and a fixture with a `plugin` version is
skipped unless named. Copy back only `blocks/<slug>.html`, and rebuild
`index.json` and `all.html` by hand to match.

It writes `blocks/` and `index.json` from a real editor, so the markup is
whatever WordPress itself serializes — byte for byte, escaping and all. Two
consecutive runs produce identical files.

The baseline and screenshots are captured by the regression spec itself, under
the same blueprint it compares in, and the same rule applies — 1.x only. This
tree is not 1.x, and the spec refuses to capture in it. Capture from the 1.28.0
zip instead, inside the pinned Playwright image:

1. Unzip `https://downloads.wordpress.org/plugin/code-block-pro.1.28.0.zip` into
   an empty folder, so the plugin sits at `<folder>/code-block-pro`.
2. Copy this checkout's `package.json`, `package-lock.json`, `playwright.config.ts`,
   `scripts/` and `tests/` into it.
3. From `<folder>/code-block-pro`, run
   `SKIP_BUILD=1 npm run test:e2e:screens:update` for the screenshots, or
   `SKIP_BUILD=1 CAPTURE_BASELINE=1 scripts/e2e-screens.sh -g 'renders the same'`
   for `baseline.json`.
4. Copy back `tests/legacy-blocks/legacy-blocks.spec.ts-snapshots/` or
   `tests/fixtures/baseline.json`.

## Running the regression suite

```bash
RUN_PROJECT=legacy-blocks npx playwright test --project=legacy-blocks
```

## What the render comparison covers

`digest.ts` reads the visible `<pre>`: its text, the computed colour of every
token, each line's blur, highlight and painted number, the font, padding,
indent, gutter and rendered height, the wrapper's classes, the chrome around
it, and the copy payload. It never reads markup or inline styles — phiki emits different
element classes and moves colours to a stylesheet by design, and neither of
those is a regression. A changed glyph colour is.

The suite renders under `legacy-blocks/theme`, a fixed column and type, because
the block inherits colour and width from the active theme and every WordPress
version ships a different default one.

The screenshots catch what the digest can't name — spacing, chrome, the
highlighter's offset. Font rasterising differs by OS, CPU and Chromium build, so
they are taken only inside `mcr.microsoft.com/playwright` at the tag matching the
`@playwright/test` pin (`npm run test:e2e:screens`, or CI on an arm64 runner) and
the test skips anywhere else. `environment.json` beside the snapshots records the
image, architecture, Chromium and WordPress they were captured on, and a run
anywhere else says so first.

## Two things worth knowing

**Fixture 21 needs the add-on pack.** It stores a theme the pack registers
through the `blocks.codeBlockPro.themes` filter. With no pack installed the
editor rebuilds the block without that theme's custom properties and declares the
stored markup invalid — real 1.x behaviour, and one of the things the render
callback removes. `tests/legacy-blocks/mu-plugin.php` supplies the filter so the
fixture runs the way a site with the pack does.

**Three fixtures hold attributes the editor will not produce.** A missing
`language`, absent tab attributes, and the legacy pixel gutter width all get
refilled or recomputed on sight, so `fixtures.ts` clears them through `unset` and
`strip` after highlighting. The markup is still whatever the current `save()`
emits for those attributes — the validation test is what proves it.
