<?php

add_action('wp_enqueue_scripts', function () {
    wp_enqueue_style('cbp-baseline', get_stylesheet_uri());
});

// The fixed admin bar covers a block scrolled to the top, and shows in its screenshot.
add_filter('show_admin_bar', '__return_false');

// Some WordPress versions swap emoji for images, changing any block text that has emoji.
remove_action('wp_head', 'print_emoji_detection_script', 7);
remove_action('wp_print_styles', 'print_emoji_styles');
remove_action('wp_enqueue_scripts', 'wp_enqueue_emoji_styles');
