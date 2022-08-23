=== Code Block Pro ===
Contributors:      kbat82
Tags:              block, code, syntax, highlighting, snippet
Tested up to:      6.0
Stable tag:        1.1.0
License:           GPL-2.0-or-later
License URI:       https://www.gnu.org/licenses/gpl-2.0.html

Code highlighting powered by the VS Code engine

== Description ==

Show off your beautiful code. This plugin provides you with an editor that runs your code directly through the same rendering engine that is used by the popular VS Code editor. This provides fast, native, code highlighting that renders perfectly in any language and theme supported by VS Code.

Beautiful syntax highlighting made easy.

= Features =
- Includes 28 themes built in to choose from.
- Supports over 140 languages
- Optionally add a copy button to let users copy the code
- Native Gutenberg block output - no special requirements

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

= 1.1.0 =
- Add filters to hook into output
- Set copy button on by default

= 1.0.0 =
- Initial release
