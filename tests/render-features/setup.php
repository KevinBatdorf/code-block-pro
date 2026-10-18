<?php

require '/wordpress/wp-load.php';

require __DIR__ . '/../setup.php';

wp_mkdir_p(WPMU_PLUGIN_DIR);
copy(__DIR__ . '/../strict-csp/mu-plugin.php', WPMU_PLUGIN_DIR . '/cbp-strict-csp.php');

$block = function (array $attributes, array ...$panes) {
    foreach ($panes as $i => $pane) {
        // Escaped, as the editor stores it.
        $panes[$i] = ['code' => htmlspecialchars($pane['code'], ENT_NOQUOTES)] + $pane + ['language' => 'javascript'];
    }
    $attributes += ['version' => 2, 'profile' => 'features', 'panes' => $panes];

    return '<!-- wp:kevinbatdorf/code-block-pro ' . serialize_block_attributes($attributes) . ' /-->';
};

code_block_pro_insert_profile('features', [
    'settings' => ['lineNumbers' => true, 'highlightingHover' => true, 'headerType' => 'headlights', 'footerType' => 'simpleStringEnd', 'seeMoreType' => 'blockLeft', 'seeMoreCollapse' => true],
    'conditions' => [
        ['id' => 'light', 'name' => 'Light', 'theme' => 'github-light'],
        ['id' => 'dark', 'name' => 'Dark', 'theme' => 'dracula', 'trigger' => ['type' => 'button']],
    ],
    'languages' => ['php' => ['light' => 'nord']],
    'buttons' => [
        ['type' => 'copy', 'icon' => 'textSimple'],
        ['type' => 'toggle', 'conditions' => ['light', 'dark']],
        ['type' => 'custom', 'id' => 'run', 'label' => 'Run'],
    ],
], 'Features');

$long = "const line = '" . str_repeat('x', 300) . "';";
$thirty = implode("\n", array_map(fn ($n) => "const n$n = $n;", range(1, 30)));

$posts = [
    'lines' => [
        $block(['anchor' => 'lines', 'lineAnchors' => true], [
            'code' => "const a = 1;\nconst b = 2; // [!code ++]\nconst c = 3; // [!code --]\n$long\nexport { a, b };\n",
            'startLine' => 10,
            'highlightLines' => '10',
        ]),
        $block(['removeBlurOnHover' => true], ['code' => "blurred();\nsharp();\nblurred();", 'sharpLines' => '2']),
        $block([], ['code' => "focused();\nfocused();\ndimmed();", 'focusLines' => '1-2']),
        $block(['anchor' => 'fold', 'lineAnchors' => true], ['code' => $thirty, 'seeMoreAfter' => 5]),
    ],
    'panes' => [
        $block(
            [],
            ['code' => "const greet = (name) => {\n  return `Hello, \${name}`;\n};\n\ngreet('you');", 'label' => 'greet.js', 'highlightLines' => '2', 'sharpLines' => '1-3'],
            ['code' => "<?php\nfunction greet(string \$name): string\n{\n    return \"Hello, {\$name}\";\n}", 'language' => 'php']
        ),
        $block([], ['code' => 'second();']),
    ],
];

foreach ($posts as $slug => $blocks) {
    wp_insert_post(wp_slash([
        'post_title' => $slug,
        'post_name' => $slug,
        'post_status' => 'publish',
        'post_content' => implode("\n\n", $blocks),
    ]));
}
