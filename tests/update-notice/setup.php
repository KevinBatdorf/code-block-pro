<?php
require '/wordpress/wp-load.php';

$userId = 1;

$userSettings = [
	'core/edit-post' => ['welcomeGuide' => false, 'fullscreenMode' => false],
	'core/edit-site' => ['welcomeGuide' => false],
	'core' => ['enableChoosePatternModal' => false],
	'_modified' => gmdate('c'),
];
update_user_meta($userId, 'wp_persisted_preferences', $userSettings);

wp_mkdir_p(WPMU_PLUGIN_DIR);
copy(__DIR__ . '/no-mbregex.php', WPMU_PLUGIN_DIR . '/no-mbregex.php');
