<?php

/**
 * @var array<string, mixed> $attributes
 * @var string $content
 */

defined('ABSPATH') or die;

if (!isset($attributes['version'])) {
    wp_enqueue_script('kevinbatdorf-code-block-pro-view-script');
    wp_enqueue_style('kevinbatdorf-code-block-pro-style');
    echo $content;
    return;
}

echo code_block_pro_render_block($attributes); // phpcs:ignore -- Built from escaped parts.
