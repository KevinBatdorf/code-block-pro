<?php
require '/wordpress/wp-load.php';

// Set WordPress to an RTL locale (Farsi)
update_option('WPLANG', 'fa_AF');

$userId = 1;

$userSettings = [
	'core/edit-post' => ['welcomeGuide' => false],
	'core/edit-site' => ['welcomeGuide' => false],
	'core' => ['enableChoosePatternModal' => false],
	'_modified' => gmdate('c'),
];
update_user_meta($userId, 'wp_persisted_preferences', $userSettings);
