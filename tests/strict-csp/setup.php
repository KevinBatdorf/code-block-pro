<?php

require '/wordpress/wp-load.php';

require __DIR__ . '/../setup.php';

wp_mkdir_p(WPMU_PLUGIN_DIR);
copy(__DIR__ . '/mu-plugin.php', WPMU_PLUGIN_DIR . '/cbp-strict-csp.php');

$block = function ($theme, $language, $code) {
    // Escaped, as the editor stores it.
    $attributes = ['version' => 2, 'theme' => $theme, 'panes' => [['language' => $language, 'code' => htmlspecialchars($code, ENT_NOQUOTES)]]];

    return '<!-- wp:kevinbatdorf/code-block-pro ' . serialize_block_attributes($attributes) . ' /-->';
};

wp_insert_post(wp_slash([
    'post_title' => 'Two themes',
    'post_name' => 'two-themes',
    'post_status' => 'publish',
    'post_content' => implode("\n\n", [
        $block('nord', 'javascript', "// Nord\nconst greeting = 'hello';\nexport default greeting;\n"),
        $block('github-light', 'php', "<?php\n// GitHub Light\nfunction greet(string \$name): string\n{\n    return \"Hello, {\$name}\";\n}\n"),
    ]),
]));
