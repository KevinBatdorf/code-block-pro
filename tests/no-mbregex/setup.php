<?php

require '/wordpress/wp-load.php';

require __DIR__ . '/../setup.php';

wp_mkdir_p(WPMU_PLUGIN_DIR);
copy(__DIR__ . '/mu-plugin.php', WPMU_PLUGIN_DIR . '/cbp-no-mbregex.php');

wp_insert_post(wp_slash([
    'post_title' => 'A 1.x block',
    'post_name' => 'a-1x-block',
    'post_status' => 'publish',
    'post_content' => file_get_contents(__DIR__ . '/../fixtures/blocks/04-no-trailing-newline.html'),
]));
