<?php

$abspath = getenv('WP_ABSPATH');

if (!$abspath || !file_exists(rtrim($abspath, '/') . '/wp-includes/version.php')) {
    fwrite(STDERR, "WP_ABSPATH must point at a WordPress core directory.\n");
    fwrite(STDERR, "e.g. WP_ABSPATH=/path/to/wordpress composer test\n");
    exit(1);
}

define('ABSPATH', rtrim($abspath, '/') . '/');

define('DB_NAME', getenv('WP_DB_NAME') ?: 'cbp_test');
define('DB_USER', getenv('WP_DB_USER') ?: 'root');
define('DB_PASSWORD', getenv('WP_DB_PASSWORD') ?: '');
define('DB_HOST', getenv('WP_DB_HOST') ?: '127.0.0.1:3306');
define('DB_CHARSET', 'utf8');
define('DB_COLLATE', '');

$table_prefix = 'wptests_';

define('WP_TESTS_DOMAIN', 'example.org');
define('WP_TESTS_EMAIL', 'admin@example.org');
define('WP_TESTS_TITLE', 'Code Block Pro Tests');
define('WP_PHP_BINARY', 'php');
define('WP_DEBUG', true);
