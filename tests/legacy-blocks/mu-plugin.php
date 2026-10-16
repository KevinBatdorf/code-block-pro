<?php
/**
 * Plugin Name: Code Block Pro fixture themes
 *
 * Fixture 21 stores a theme the add-on pack registers through the themes
 * filter. Without it the editor rebuilds the block without the theme's custom
 * properties and calls the stored markup invalid.
 */

add_action('enqueue_block_editor_assets', function () {
	$path = WP_PLUGIN_DIR . '/code-block-pro/tests/fixtures/css-var-theme.json';
	if (!is_readable($path)) {
		return;
	}
	$theme = wp_json_encode(json_decode(file_get_contents($path), true));
	wp_add_inline_script(
		'wp-hooks',
		"wp.hooks.addFilter('blocks.codeBlockPro.themes','cbp-fixtures',"
			. "function(themes){return Object.assign({},themes,"
			. "{'inherit-from-global':{$theme}});});"
	);
});
