<?php

defined('ABSPATH') or die;

function code_block_pro_can_upgrade(): bool
{
    // Every mb_ereg_* function phiki calls; UpdateGateTest fails when phiki starts calling another.
    $needed = [
        'mb_ereg_search_init',
        'mb_ereg_search_pos',
        'mb_ereg_search_getregs',
        'mb_ereg_search_setpos',
    ];

    // disable_functions hides these one at a time, so the whole set has to be checked.
    $present = array_filter($needed, 'function_exists');

    return (bool) apply_filters('blocks.codeBlockPro.canUpgrade', count($present) === count($needed));
}

// Without mbregex nothing renders, and only a different PHP build can add it.
add_filter('site_transient_update_plugins', function ($transient) {
    if (code_block_pro_can_upgrade()) {
        return $transient;
    }

    if (!isset($transient->response[CODE_BLOCK_PRO_BASENAME])) {
        return $transient;
    }

    $offered = $transient->response[CODE_BLOCK_PRO_BASENAME]->new_version ?? '';

    // A later 1.x fix must still reach a site without mbregex.
    if ($offered === '' || version_compare($offered, '2.0', '<')) {
        return $transient;
    }

    unset($transient->response[CODE_BLOCK_PRO_BASENAME]);

    return $transient;
});

// A new block can't render without mbregex; blocks already on a page keep their saved HTML.
add_filter('register_block_type_args', function ($args, $name) {
    if ($name === 'kevinbatdorf/code-block-pro' && !code_block_pro_can_upgrade()) {
        $args['supports'] = [...($args['supports'] ?? []), 'inserter' => false];
    }

    return $args;
}, 10, 2);

// With no block to insert, the editor's notice never shows, so the reason needs a place outside it.
add_filter('site_status_tests', function ($tests) {
    $tests['direct']['code_block_pro_mbregex'] = [
        'label' => __('Code Block Pro can color code', 'code-block-pro'),
        'test' => function () {
            $result = [
                'label' => __('Code Block Pro can color code', 'code-block-pro'),
                'status' => 'good',
                'badge' => ['label' => __('Code Block Pro', 'code-block-pro'), 'color' => 'blue'],
                'description' => '<p>' . esc_html__('PHP on this server includes mbregex, which Code Block Pro needs to color code.', 'code-block-pro') . '</p>',
                'actions' => '',
                'test' => 'code_block_pro_mbregex',
            ];
            if (code_block_pro_can_upgrade()) {
                return $result;
            }

            return [
                'label' => __('Code Block Pro cannot color code on this server', 'code-block-pro'),
                'status' => 'critical',
                'badge' => ['label' => __('Code Block Pro', 'code-block-pro'), 'color' => 'red'],
                'description' => '<p>' . esc_html(code_block_pro_missing_mbregex_message()) . '</p>',
                'actions' => sprintf(
                    '<p><a href="%s">%s</a></p>',
                    esc_url('https://wordpress.org/plugins/code-block-pro/advanced/'),
                    esc_html__('Download Code Block Pro 1.x', 'code-block-pro')
                ),
                'test' => 'code_block_pro_mbregex',
            ];
        },
    ];

    return $tests;
});

add_action('after_plugin_row_' . CODE_BLOCK_PRO_BASENAME, function () {
    if (code_block_pro_can_upgrade()) {
        return;
    }
    $table = function_exists('_get_list_table') ? _get_list_table('WP_Plugins_List_Table') : null;
    // Core shades the plugin's own row only while it is active, and the note must match it.
    $active = is_network_admin() ? is_plugin_active_for_network(CODE_BLOCK_PRO_BASENAME) : is_plugin_active(CODE_BLOCK_PRO_BASENAME);
    printf(
        '<tr class="plugin-update-tr%s"><td colspan="%d" class="plugin-update colspanchange"><div class="notice inline notice-error notice-alt"><p>%s</p></div></td></tr>',
        $active ? ' active' : '',
        $table ? $table->get_column_count() : 4,
        esc_html(code_block_pro_missing_mbregex_message())
    );
});

function code_block_pro_missing_mbregex_message(): string
{
    return __('Code Block Pro cannot color code or add new code blocks on this server, because PHP was built without mbregex, a part of the mbstring extension. Code blocks made with 1.x still show as they were saved, and blocks made with 2.x show without colors. Ask your web host to enable mbregex. To edit 1.x blocks until then, install Code Block Pro 1.x.', 'code-block-pro');
}
