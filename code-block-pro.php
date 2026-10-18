<?php

/**
 * Plugin Name:       Code Block Pro
 * Description:       Code highlighting powered by the VS Code engine
 * Plugin URI:        https://code-block-pro.com
 * Author:            Kevin Batdorf
 * Author URI:        https://code-block-pro.com
 * Requires at least: 7.0
 * Requires PHP:      8.2
 * Version:           1.28.0
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       code-block-pro
 *
 * @package           kevinbatdorf
 */

defined('ABSPATH') or die;

define('CODE_BLOCK_PRO_BASENAME', plugin_basename(__FILE__));
define('CODE_BLOCK_PRO_VERSION', '1.28.0');

add_action('init', function () {
    // 1.x's handles and versions, so cached copies and handle-based site tweaks keep working.
    wp_register_script(
        'kevinbatdorf-code-block-pro-view-script',
        plugin_dir_url(__FILE__) . 'build/front/front.js',
        [],
        '897e78bb623a899126f1',
        ['strategy' => 'defer']
    );
    wp_add_inline_script('kevinbatdorf-code-block-pro-view-script', 'window.codeBlockPro = ' . wp_json_encode([
        'pluginUrl' => esc_url_raw(plugin_dir_url(__FILE__)),
    ]) . ';');
    wp_register_style('kevinbatdorf-code-block-pro-style', plugin_dir_url(__FILE__) . 'build/style-index.css', [], '1.13.0');
    // WordPress inlines a small stylesheet only when it knows the file's path.
    wp_style_add_data('kevinbatdorf-code-block-pro-style', 'path', __DIR__ . '/build/style-index.css');
    // Never inserted: classic themes print block stylesheets early, others after the theme's CSS.
    register_block_type('kevinbatdorf/code-block-pro-1x-style', [
        'style_handles' => ['kevinbatdorf-code-block-pro-style'],
        'supports' => ['inserter' => false],
    ]);
    // By URL with no path, so WordPress never inlines them into a page a strict CSP guards.
    wp_register_style('code-block-pro', plugin_dir_url(__FILE__) . 'build/front.css', [], (string) @filemtime(__DIR__ . '/build/front.css'));
    $asset = is_file(__DIR__ . '/build/view.asset.php') ? include __DIR__ . '/build/view.asset.php' : ['dependencies' => [], 'version' => CODE_BLOCK_PRO_VERSION];
    wp_register_script('code-block-pro-view', plugin_dir_url(__FILE__) . 'build/view.js', $asset['dependencies'], $asset['version'], ['strategy' => 'defer', 'in_footer' => true]);
    // Not block.json's style field: WordPress would name it after the block, which is 1.x's handle.
    register_block_type(__DIR__ . '/build', ['style_handles' => ['code-block-pro']]);
});

add_action('admin_init', function () {
    wp_add_inline_script('kevinbatdorf-code-block-pro-editor-script', 'window.codeBlockPro = ' . wp_json_encode([
        'pluginUrl' => esc_url_raw(plugin_dir_url(__FILE__)),
        'canUpgrade' => code_block_pro_can_upgrade(),
    ]) . ';');
});

include_once(__DIR__ . '/php/compatibility.php');
include_once(__DIR__ . '/php/lines.php');
include_once(__DIR__ . '/php/highlight.php');
include_once(__DIR__ . '/php/profiles.php');
include_once(__DIR__ . '/php/profile-css.php');
include_once(__DIR__ . '/php/profile-screen.php');
include_once(__DIR__ . '/php/block.php');
include_once(__DIR__ . '/php/update-gate.php');
include_once(__DIR__ . '/php/router.php');
include_once(__DIR__ . '/php/routes.php');
