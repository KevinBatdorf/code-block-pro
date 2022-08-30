=== Code Block Pro ===
Contributors:      kbat82
Tags:              block, code, syntax, highlighting, snippet
Tested up to:      6.0
Stable tag:        1.2.4
License:           GPL-2.0-or-later
License URI:       https://www.gnu.org/licenses/gpl-2.0.html

Code highlighting powered by the VS Code engine

== Description ==

Show off your beautiful code. This plugin provides you with an editor that runs your code directly through the same rendering engine that is used by the popular VS Code editor. This provides fast, native, code highlighting that renders perfectly in any language and theme supported by VS Code.

Beautiful syntax highlighting made easy.

= Features =
- Includes 28 themes built in to choose from.
- Supports over 140 programming languages
- Optionally add a copy button to let users copy the code
- Native Gutenberg block output - no special requirements
- No frontend JavaScript required - works in headless mode
- Supports converting from the default code block

= More info =
- Follow [@kevinbatdorf](https://twitter.com/kevinbatdorf) on Twitter
- View on [GitHub](https://github.com/KevinBatdorf/code-block-pro)

= Included VS Code Themes =
- Dark Plus
- Dracula Soft
- Dracula
- GitHub Dark Dimmed
- Github Dark
- Github Light
- HC Light
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
- ShellScript
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

= I'm not using the Copy feature =

You can add the following snippet to your functions.php file to prevent loading the related script. The script is only required if you are using the copy feature, so you can safely remove it without concern.
`
add_action('wp_enqueue_scripts', function() {
    wp_dequeue_script('kevinbatdorf-code-block-pro-view-script');
});
`

== Screenshots ==

1. Quickly swap over themes in the editor
2. A view from the front end with the copy button

== Changelog ==

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
