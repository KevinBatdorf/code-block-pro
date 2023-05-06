=== Code Block Pro - Beautiful Syntax Highlighting ===
Contributors:      kbat82
Tags:              block, code, syntax, snippet, highlighter, JavaScript, php, vs code
Tested up to:      6.2
Stable tag:        1.17.0
License:           GPL-2.0-or-later
License URI:       https://www.gnu.org/licenses/gpl-2.0.html

Code highlighting powered by the VS Code engine. Performance focused. No bloat.

== Description ==

Show off your beautiful code, don't just display it! This block plugin provides you with a code block editor that runs your code directly through the same rendering engine that is used by the popular VS Code editor. This block provides fast, native, code highlighting that renders perfectly in any language and theme supported by VS Code.

Beautiful syntax highlighting that makes sense.

Visit [code-block-pro.com](https://code-block-pro.com/?utm_campaign=plugin&utm_source=readme-body&utm_medium=textlink) to learn more.

= Values =
- Performance first - Web vitals. Pre-rendering. Minimal asset loading.
- Lightweight - No bloat. Simple functions. Clean, maintainable code.
- Practical/useful - Focused on the user experience and presentation.
- Beautiful - Your code should look great!

Star [Code Block Pro](https://github.com/KevinBatdorf/code-block-pro) on GitHub!

= Features =
- Includes 25+ built-in themes to choose from.
- Supports over 140 programming languages
- Modern programming web fonts - locally hosted
- Line numbers
- Line highlighting (static and on hover)
- Blur highlighting (with reveal on hover)
- Header styles
- Footer styles
- Copy button
- Native Gutenberg block
- Core functionality works in headless mode (see FAQ)
- Converting from the default code block (and others)
- Max height with scrollable section (optional expand button)

= More info =
- Follow [@kevinbatdorf](https://twitter.com/kevinbatdorf) on Twitter
- View on [GitHub](https://github.com/KevinBatdorf/code-block-pro)

= Tips =
- Try combining line highlighting with the blur effect to add some extra depth and focus on the important parts of the code without losing context
- All settings are per block, but some settings are remembered when you add the next block.
- Add a link in the code footer (some footers support this, not all) that points to a https://codepen.io demo

= Included VS Code Themes =
- Dark Plus
- Dracula Soft
- Dracula
- GitHub Dark Dimmed
- Github Dark
- Github Light
- HC Light - temporarily disabled
- Light Plus
- Material Darker
- Material Default
- Material Lighter
- Material Ocean
- Material Palenight
- Min Dark
- Min Light
- Monokai
- Nord
- One Dark Pro
- Poimandres
- Rose Pine Dawn
- Rose Pine Moon
- Rose Pine
- Slack Dark
- Slack Ochin
- Solarized Dark
- Solarized Light
- Vitesse Dark
- Vitesse Light

Get more themes at [code-block-pro.com/themes](https://code-block-pro.com/themes?utm_campaign=themes&utm_source=readme-body&utm_medium=textlink)

= Theme Pack (Paid) Includes =
- Custom Dynamic Theme [read more](https://github.com/KevinBatdorf/code-block-pro/discussions/168)
- Ayu Dark
- Ayu Mirage
- Ayu Light
- Night Owl
- Night Owl Light
- Noctis
- Noctis Azureus
- Noctis Bordo
- Noctis Hibernus
- Noctis Lilac
- Noctis Lux
- Noctis Minimus
- Noctis Obscuro
- Noctis Sereno
- Noctis Uva
- Noctis Viola
- Palenight
- Pico 8
- Shades of Purple
- Shades of Purple Super Dark
- Synthwave '84
- Tokyo Night
- Tokyo Night Storm
- Tokyo Night Light
- Winter is Coming
- Winter is Coming Light
- Winter is Coming Dark

= Included Coding Languages =
- ABAP
- ActionScript 3
- Ada
- ANSI (control codes rendered)
- Apache
- Apex
- APL
- AppleScript
- Ara
- ASM
- Astro
- Awk
- Ballerina
- BAT (Batchfile)
- Berry
- BibTeX
- BICEP
- Blade
- C
- Cadence
- Clarity
- Clojure
- CMake
- COBOL
- CodeQL
- CoffeeScript
- C++
- Crystal
- C#
- CSS
- CUE
- D
- Dart
- DAX
- Diff
- Dockerfile
- DreamMaker
- Elixir
- Elm
- ERB
- Erlang
- Fish
- F#
- GDResource (Godot)
- GDScript (Godot)
- GDShader (Godot)
- Gherkin
- Git Commit
- Git Rebase
- GLSL
- Gnuplot
- Go
- GraphQL
- Groovy
- Hack
- HAML
- Handlebars
- Haskell
- HCL
- HLSL
- HTML
- HTTP
- INI
- Java
- JavaScript
- Jinja HTML
- Jison
- JSON
- JSON5
- JSONC
- JSONnet
- JSSM
- JSX
- Julia
- Kotlin
- Kusto
- LaTeX
- LESS
- Liquid
- Lisp
- Logo
- Lua
- Makefile
- Markdown
- Marko
- MATLAB
- MDX
- Mermaid
- Nginx
- Nim
- Nix
- Objective-C
- Objective-C++
- OCaml
- Pascal
- Perl
- PHP
- Plaintext
- PLSQL
- PostCSS
- Power Query
- PowerShell
- Prisma
- Prolog
- Protocol Buffers
- Pug
- Puppet
- PureScript
- Python
- R
- Raku
- Razor
- Windows Registry
- Rel
- RISC-V
- RST
- Ruby
- Rust
- SAS
- Sass
- Scala
- Scheme
- SCSS
- ShaderLab
- Bash
- ShellScript
- Zsh
- Smalltalk
- Solidity
- SPARQL
- SQL
- SSH Config
- Stata
- Stylus
- Svelte
- Swift
- SystemVerilog
- TASL
- TCL
- TeX
- TOML
- TSX
- Turtle
- Twig
- TypeScript
- V
- VB
- Verilog
- VHDL
- VimL
- Vue HTML
- Vue
- WASM
- Wenyan
- WGSL
- Wolfram
- XML
- XSL
- YAML
- ZenScript

== Installation ==

1. Activate the plugin through the 'Plugins' screen in WordPress

== Frequently Asked Questions ==

= Font size is too small/big =

Look under the "Styling" tab and turn on "Clamp Values", which will compute the rem values relative to a 16px-24px base * the selected rem values. e.g. clamp(20px, 1.25rem, 30px).

= How to use in headless =

Themes are rendered inside the editor as you type or make changes, so the code block itself will work without CSS or JavaScript. However, the font loading, copy button, and line highlighting require a tiny bit of JavaScript to funciton. Additionally, line blur uses a tiny bit of CSS which you will need to load in yourself or impliment your own. The code tokens and theme styles are inline though, so no need to manipulate the DOM.

== Screenshots ==

1. Choose from more than 25 themes.
2. Customize fonts, themes, and behavior.
3. Disable padding and inline the code for a fluent experience.
4. Use highlighting and blur to focus on parts of the code.
5. ANSI support for rendering control sequences

== Changelog ==

= 1.16.1 - 2023-05-06 =
- Feature: Add line highlighting on hover
- Tweak: Updated the line highlighting sidebar language to be more clear (hopefully)
- Fix: Removed pointer events from line highlights so you can select text under it
- Fix: Adds styling to avoid CLS in the editor on page load

= 1.16.1 - 2023-05-01 =
- Tweak: Removes the filtering of bash and zsh filtering
- Fix: Better language sorting (by label instead of key)
- Fix: Fix typo in Wolfram language key

= 1.16.0 - 2023-04-30 =
- Feature: Added new language grammars: GD Script, GD Resource, GD Shader, GLSL, Http, Jison, JSON5, Kusto (kql), Protocol Buffers (.proto), Windows Registry (.reg), V, WGSL, and Wolfram
- Tweak: Removed toolbar language select and added functionality to focus on the sidebar setting
- Refactor: Moved header/footer settings out of the language select into their own panels

= 1.15.0 - 2023-04-08 =
- Feature: Add notice to users who do not have permission to update
- Feature: Added hooks to allow users to add their own themes (or via the theme pack)
- Feature: Add plaintext option to allow rendering as text

= 1.14.0 - 2023-03-26 =
- Feature: Added theme identifier to toolbar
- Feature: Added some filters for attributes and buttons
- Tweak: Updated various styles
- Testing: Updated Cypress to test against latest RC on main push
- Testing: Integration tests now run concurrently to isolate flakey failures
- Fix: Added custom endpoint for settings, allowing edit_post cap users
- Fix: Removed a type conversion to false, causing dirty posts on focus
- Accessibility: Added keydown events to frontend copy button

= 1.13.0 - 2023-02-05 =
- Feature: Add scrollable max height area with no button (Max Height panel)
- Feature: Add expanding code area with max height based online number
- Feature: Added ANSI rendering support - some themes do not look perfect yet
- Fix: Disabled font ligatures in the editor as it broke cursor positioning on wraps

= 1.12.0 - 2023-01-28 =
- Feature: Added Ara, Power Query, and DAX language support
- Fix: Fixed preview output on theme selection
- Fix: Fixed theme selection font rendering (to match preview better)

= 1.11.3 - 2023-01-08 =
- Fix: Encode and decode html entities to prevent script tag bug

= 1.11.2 - 2023-01-04 =
- Fix: Update shiki renderer wasm loader to use ArrayBuffer
- Tweak: Expose init function as global to allow late init

= 1.11.1 - 2023-01-04 =
- Fix: Revert code parser as there is a wasm loading error

= 1.11.0 - 2023-01-03 =
- Feature: Add theme name text search
- Feature: Add theme visibility manager to limit visible themes
- Tweak: Show better error when theme is missing
- Fix: Renderer source url has a double slash

= 1.10.0 - 2022-12-21 =
- Feature: Add footer with left aligned text
- Tweak: Load scripts (copy button, highlight) on multiple lifecycle points
- Tweak: Make the above scripts idempotent so they can run multiple times safely
- Fix: Removes inner focus outline from Gutenberg update

= 1.9.3 - 2022-12-05 =
- Fix: Adjusted editor padding for line numbers to better match the front end
- Fix: Removed the TW border default in the editor as it was overriding some wp defaults
- Fix: Updated a typo on the word "focus"
- Testing: Adds coverage for every main feature

= 1.9.2 - 2022-11-22 =
- Compatibility: Adds a method override to allow users to activate when prismatic is installed

= 1.9.1 - 2022-11-21 =
- Fix: Fixed a situations where the highlighter was miscalculating its width

= 1.9.0 - 2022-11-20 =
- Feature: Added line highlights
- Feature: Added blur effect to highlight lines
- Tweak: Added the copy button to the editor preview
- Tweak: Removed HC Light - will follow up on rendering issues
- Fix: Selected text no longer leaves padding exposed on the right

= 1.8.0 - 2022-11-17 =
- Feature: Added footer styles
- Accessibility: Increased line number color contrast
- Accessibility: Increased copy button contrast
- Tweak: Disabled autocomplete on settings inputs
- Tweak: Added help context to variations that have inputs
- Fix: Fixed a bug where disabling padding on one block would update all
- Fix: Line numbers + disabled padding no longer formats weird in the editor
- Fix: Scrollbars are now using auto instead of scroll
- Fix: The loading screen on the theme viewer now fills the container
- Fix: With line numbers, changing the font now will recalculate the width

= 1.7.0 - 2022-11-09 =
- Feature: Add line number support

= 1.6.0 - 2022-09-09 =
- Feature: Add additional header styles
- Feature: Allow overriding the label in the header
- Tweak: Adjust copy button opacity interactions

= 1.5.2 - 2022-09-08 =
- Fix: Fix padding on copy button when padding is disabled

= 1.5.1 - 2022-09-05 =
- Tweak: Allow users to disable padding
- Fix: Fixes a bug where the header type set to none doesn't persist
- Fix: Clamp font settings were not being persisted

= 1.5.0 - 2022-09-05 =
- Feature: Add toggle so users can clamp font sizes to reasonable values.
- Show font styling in theme select sidebar

= 1.4.0 - 2022-09-04 =
- Feature: Add header "window controls" style option
- Feature: Add dynamic coding font imports
- Feature: Add "recent languages" section to quick switch
- Feature: Add alternate way to transform from core block

= 1.3.0 - 2022-09-04 =
- Feature: Add font size controls
- Feature: Add Line height controls
- Feature: Persist settings in the database instead of localStorage
- Fix: Fix overflow editor bug

= 1.2.8 - 2022-08-31 =
- Compatibility: Disable Prismatic. They use an encoding function on all code indiscriminately, breaking this plugin.

= 1.2.7 - 2022-08-31 =
- Fix: Add style overrides for the Hueman theme (and generally good overrides)

= 1.2.6 - 2022-08-30 =
- Fix: Force disable wrapping and overflow for bootstrap based themes.

= 1.2.5 - 2022-08-30 =
- Fix: Force disable wrapping and overflow for some themes.

= 1.2.4 - 2022-08-30 =
- Fix: Limit alignments to wide and full only.

= 1.2.3 - 2022-08-29 =
- Fix: Force left text alignment in the editor
- Tweak: Set WP default alignment to "none"
- Testing: Add item verification on scroll before click

= 1.2.2 - 2022-08-28 =
- Fix: Zeros out margins on pre elements for better theme compatibility

= 1.2.1 - 2022-08-27 =
- Fix: Remove nested pre tags (changed to div) in editor
- Feature: Added test coverage with cypress

= 1.2.0 - 2022-08-27 =
- Feature: Convert code from the core code block
- Feature: Convert code from SyntaxHighlighter Evolved
- Feature: Add toolbar language select
- Feature: Add language "nice names"
- Fix: Remove line wrap from frontend

= 1.1.0 - 2022-08-22 =
- Feature: Add filters to hook into output
- Tweak: Set copy button on by default

= 1.0.0 - 2022-08-20 =
- Initial release
