<?php

require '/wordpress/wp-load.php';

require __DIR__ . '/../setup.php';

wp_mkdir_p(WPMU_PLUGIN_DIR);
copy(__DIR__ . '/mu-plugin.php', WPMU_PLUGIN_DIR . '/cbp-fixture-themes.php');

$theme = get_theme_root() . '/cbp-baseline';
wp_mkdir_p($theme);
foreach (['style.css', 'index.php', 'functions.php'] as $file) {
    copy(__DIR__ . "/theme/$file", "$theme/$file");
}
switch_theme('cbp-baseline');
