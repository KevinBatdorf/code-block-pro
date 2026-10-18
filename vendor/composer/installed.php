<?php return array(
    'root' => array(
        'name' => 'kevinbatdorf/code-block-pro',
        'pretty_version' => 'dev-main',
        'version' => 'dev-main',
        'reference' => null,
        'type' => 'wordpress-plugin',
        'install_path' => __DIR__ . '/../../',
        'aliases' => array(),
        'dev' => true,
    ),
    'versions' => array(
        'kevinbatdorf/code-block-pro' => array(
            'pretty_version' => 'dev-main',
            'version' => 'dev-main',
            'reference' => null,
            'type' => 'wordpress-plugin',
            'install_path' => __DIR__ . '/../../',
            'aliases' => array(),
            'dev_requirement' => false,
        ),
        'phiki/phiki' => array(
            'pretty_version' => 'v2.2.1',
            'version' => '2.2.1.0',
            'reference' => '0a9ff7efad9d433d9b173aff36b2a1905ef13c57',
            'type' => 'library',
            'install_path' => __DIR__ . '/../phiki/phiki',
            'aliases' => array(),
            'dev_requirement' => false,
        ),
        'psr/simple-cache' => array(
            'dev_requirement' => false,
            'replaced' => array(
                0 => '*',
            ),
        ),
    ),
);
