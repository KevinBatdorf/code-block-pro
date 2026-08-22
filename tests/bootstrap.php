<?php

require_once dirname(__DIR__) . '/vendor/autoload.php';

putenv('WP_PHPUNIT__TESTS_CONFIG=' . __DIR__ . '/wp-tests-config.php');

$testsDir = dirname(__DIR__) . '/vendor/wp-phpunit/wp-phpunit';

require_once $testsDir . '/includes/functions.php';

tests_add_filter('muplugins_loaded', function () {
    require dirname(__DIR__) . '/code-block-pro.php';
});

require $testsDir . '/includes/bootstrap.php';
