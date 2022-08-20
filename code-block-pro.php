<?php
/**
 * Plugin Name:       Code Block Pro
 * Description:       An example block built using Rust and TypeScript
 * Requires at least: 5.8
 * Requires PHP:      7.0
 * Version:           0.1.0
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
});
add_action('admin_init', function () {
    wp_add_inline_script('kevinbatdorf-code-block-pro-editor-script', 'window.codeBlockPro = ' . wp_json_encode([
        'pluginUrl' => esc_url_raw(plugin_dir_url(__FILE__)),
    ]) . ';');
});
