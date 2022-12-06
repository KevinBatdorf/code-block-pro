=== Code Block Pro - Beautiful Syntax Highlighting ===
Contributors:      kbat82
Tags:              block, code, syntax, snippet, highlighter, JavaScript, php, vs code, shiki
Tested up to:      6.1
Stable tag:        1.9.3
License:           GPL-2.0-or-later
License URI:       https://www.gnu.org/licenses/gpl-2.0.html

Code highlighting powered by the VS Code engine. Performance focused. No bloat.

== Description ==

Show off your beautiful code, don't just display it! This block plugin provides you with a code block editor that runs your code directly through the same rendering engine that is used by the popular VS Code editor. This block provides fast, native, code highlighting that renders perfectly in any language and theme supported by VS Code.

Beautiful syntax highlighting that makes sense.

= Values =
- Performance first - Web vitals. Pre-rendering. Minimal asset loading.
- Lightweight - No bloat. Simple functions. Clean, maintainable code.
- Practical/useful - Focused on the user experience and presentation.
- Beautiful - Your code should look great!

= Features =
- Includes 25+ built-in themes to choose from.
- Supports over 140 programming languages
- Modern programming web fonts - locally hosted
- Line numbers
- Line highlighting
- Blur highlighting
- Header styles
- Footer styles
- Copy button
- Native Gutenberg block
- Core functionality works in headless mode (see FAQ)
- Converting from the default code block (and others)

= More info =
- Follow [@kevinbatdorf](https://twitter.com/kevinbatdorf) on Twitter
- View on [GitHub](https://github.com/KevinBatdorf/code-block-pro)

= Tips =
- Try combining line highlighting with the blur effect to add some extra depth and focus on the important parts of the code without losing context
- All settings are per block, but some settings are remembered when you add the next block.
- Add a link in the code footer (some footers support this, not all) that points to a https://codepen.io demo

= Coming soon =
- Diff highlighting
- More themes, headers, footers
- In browser, safe code execution - experimental

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

= Included Coding Languages =
- ABAP
- ActionScript 3
- Ada
- Apache
- Apex
- APL
- AppleScript
- ASM
- Astro
- Awk
- Ballerina
- BAT
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
- Diff
- Docker
- DreamMaker
- Elixir
- Elm
- ERB
- Erlang
- Fish
- F#
- Gherkin
- Git Commit
- Git Rebase
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
- INI
- Java
- JavaScript
- Jinja HTML
- JSON
- JSONC
- JSONnet
- JSSM
- JSX
- Julia
- Kotlin
- LaTeX
- LESS
- Liquid
- Lisp
- Logo
- Lua
- Make
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
- PLSQL
- PostCSS
- PowerShell
- Prisma
- Prolog
- Pug
- Puppet
- PureScript
- Python
- R
- Raku
- Razor
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
- ShellScript (bash, zsh, sh, shell)
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
- VB
- Verilog
- VHDL
- VimL
- Vue HTML
- Vue
- WASM
- Wenyan
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

== Changelog ==

= 1.9.3 - 2022-12-05 =
- Fix: Adjusted editor padding for line numbers to better match the front end
- Fix: Removed the TW border default in the editor as it was overriding some wp defaults
- Fix: Updated a typo on the word "focus"
- Testing: Adds coverage for every main feature.

= 1.9.2 - 2022-11-22 =
- Compatibility: Adds a method override to allow users to activate when prismatic is installed.

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
