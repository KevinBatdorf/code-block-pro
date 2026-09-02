# Stored-block fixtures

Fifty Code Block Pro blocks, exactly as the 1.28.0 editor saved them.

The block is being rebuilt — new attributes, a PHP render callback, a different
highlighter. Every one of those blocks is already sitting in `post_content` on a
real site, and none of them can break. This set is how that gets proved:

1. **They still open.** `tests/legacy-blocks` loads each one into the editor and
   asserts the block parses valid and shows no warning.
2. **They still render.** The same spec publishes each one and compares the front
   end against `baseline.json` — text, line count, and the colour of every glyph.
3. **They migrate.** The attributes in each block comment are the input a
   converter has to map to the new shape. Parse them; don't hand-write them.

## Files

| | |
| --- | --- |
| `blocks/*.html` | The artifacts. Frozen `post_content`, one file per fixture. |
| `blocks/all.html` | All fifty in one document, for looking at a page of them. |
| `index.json` | Slug, the file, and what a diff in that fixture tells you. |
| `baseline.json` | What the 1.x front end made of each one. |
| `fixtures.ts` | How they were produced. History, not the source of truth. |
| `code/` | The code samples they hold. Excluded from biome and tsc. |
| `digest.ts`, `publish.ts` | Shared with the regression spec. |

## Do not regenerate them

Regenerating runs the current save path, so the moment that path changes the
generator stops producing 1.x blocks and starts producing whatever the rebuild
produces — which is the one thing this set exists to catch. `blocks/` is the
source of truth from here on.

While 1.x save is still in the tree, the generator is:

```bash
npm run fixtures:build
```

It writes `blocks/`, `index.json` and `baseline.json` from a real editor, so the
markup is whatever WordPress itself serializes — byte for byte, escaping and all.
Two consecutive runs produce identical files.

## Running the regression suite

```bash
RUN_PROJECT=legacy-blocks npx playwright test --project=legacy-blocks
```

## What the render comparison covers

`digest.ts` reads the visible `<pre>`: its text, its `.line` count, the computed
colour of every token, the wrapper's classes, the chrome around it, and the copy
payload. It never reads markup or inline styles — phiki emits different element
classes and moves colours to a stylesheet by design, and neither of those is a
regression. A changed glyph colour is.

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
