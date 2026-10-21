<?php

require '/wordpress/wp-load.php';

require __DIR__ . '/../setup.php';

wp_mkdir_p(WPMU_PLUGIN_DIR);
copy(__DIR__ . '/../strict-csp/mu-plugin.php', WPMU_PLUGIN_DIR . '/cbp-strict-csp.php');

// The stacked conditions here are the Theme Pack's; this setup and every page request need them on.
$custom = "<?php add_filter('blocks.codeBlockPro.customConditions', '__return_true');\n";
file_put_contents(WPMU_PLUGIN_DIR . '/cbp-custom-conditions.php', $custom);
add_filter('blocks.codeBlockPro.customConditions', '__return_true');

$code = [
    'javascript' => "// Greets someone\nclass Greeter extends Base {\n  static #count = 0;\n  greet(name = 'you') {\n    return `Hello, \${name}` + /\\d+/.source + this.x;\n  }\n}\n",
    'markdown' => "# Title\n\nSome **bold**, _italic_, ~~struck~~ and `code`.\n\n> quoted [link](https://example.com)\n",
    'php' => "<?php\n/** @var string \$name */\nfunction greet(string \$name): string\n{\n    return \"Hello, {\$name}\" . self::class;\n}\n",
];

$block = function (array $attributes, string $language) use ($code) {
    // Escaped, as the editor stores it.
    $attributes += ['version' => 2, 'panes' => [['language' => $language, 'code' => htmlspecialchars($code[$language], ENT_NOQUOTES)]]];

    return '<!-- wp:kevinbatdorf/code-block-pro ' . serialize_block_attributes($attributes) . ' /-->';
};

code_block_pro_insert_profile('twotone', ['conditions' => [
    ['id' => 'light', 'name' => 'Light', 'theme' => 'min-light'],
    ['id' => 'dark', 'name' => 'Dark', 'theme' => 'dracula', 'trigger' => ['type' => 'media', 'value' => '(prefers-color-scheme: dark)']],
]], 'Two tone');

code_block_pro_insert_profile('stacked', [
    'conditions' => [
        ['id' => 'main', 'theme' => 'github-light', 'background' => ['type' => 'color', 'value' => '#fdf6e3']],
        ['id' => 'dark', 'theme' => 'monokai', 'trigger' => ['type' => 'media', 'value' => '(prefers-color-scheme: dark)']],
        ['id' => 'funky', 'theme' => 'dracula', 'trigger' => ['type' => 'class', 'value' => 'is-funky'], 'background' => ['type' => 'color', 'value' => '#101010']],
        ['id' => 'contrast', 'theme' => 'nord', 'trigger' => ['type' => 'button']],
    ],
    'languages' => ['php' => ['dark' => 'solarized-dark']],
], 'Stacked & layered');

$posts = [
    'two-conditions' => [],
    'stacked-conditions' => [],
];
foreach (array_keys($code) as $language) {
    $posts['two-conditions'][] = $block(['profile' => 'twotone'], $language);
    $posts['two-conditions'][] = $block(['profile' => '', 'theme' => 'min-light'], $language);
    $posts['two-conditions'][] = $block(['profile' => '', 'theme' => 'dracula'], $language);

    $posts['stacked-conditions'][] = $block(['profile' => 'stacked'], $language);
    foreach (['github-light', 'monokai', 'dracula', 'nord', 'solarized-dark'] as $theme) {
        $posts['stacked-conditions'][] = $block(['profile' => '', 'theme' => $theme], $language);
    }
}
$posts['uses-default'] = [$block(['profile' => 'default'], 'javascript'), $block(['profile' => '', 'theme' => 'github-light'], 'javascript')];
$posts['also-uses-default'] = [$block(['profile' => 'missing-falls-back-to-default'], 'php')];

foreach ($posts as $slug => $blocks) {
    wp_insert_post(wp_slash([
        'post_title' => $slug,
        'post_name' => $slug,
        'post_status' => 'publish',
        'post_content' => implode("\n\n", $blocks),
    ]));
}
