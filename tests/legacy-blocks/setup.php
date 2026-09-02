<?php
require '/wordpress/wp-load.php';

require __DIR__ . '/../setup.php';

wp_mkdir_p(WPMU_PLUGIN_DIR);
copy(__DIR__ . '/mu-plugin.php', WPMU_PLUGIN_DIR . '/cbp-fixture-themes.php');
