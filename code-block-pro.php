<?php
/**
 * Plugin Name:       Code Block Pro
 * Description:       Code highlighting powered by the VS Code engine
 * Requires at least: 6.0
 * Requires PHP:      7.0
 * Version:           1.9.3
 * Author:            Kevin Batdorf
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       code-block-pro
 *
 * @package           kevinbatdorf
 */

add_action('init', function () {
    register_block_type(__DIR__ . '/build');
    wp_set_script_translations('kevinbatdorf/code-block-pro', 'code-block-pro');
    wp_add_inline_script('kevinbatdorf-code-block-pro-view-script', 'window.codeBlockPro = ' . wp_json_encode([
        'pluginUrl' => esc_url_raw(plugin_dir_url(__FILE__)),
    ]) . ';');
});

add_action('admin_init', function () {
    wp_add_inline_script('kevinbatdorf-code-block-pro-editor-script', 'window.codeBlockPro = ' . wp_json_encode([
        'pluginUrl' => esc_url_raw(plugin_dir_url(__FILE__)),
    ]) . ';');
});

include_once(__DIR__ . '/php/compatibility.php');
include_once(__DIR__ . '/php/settings.php');
