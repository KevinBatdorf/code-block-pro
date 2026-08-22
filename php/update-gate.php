<?php

defined('ABSPATH') or die;

function code_block_pro_can_highlight()
{
    return (bool) apply_filters('blocks.codeBlockPro.canHighlight', function_exists('mb_ereg_search_init'));
}

function code_block_pro_next_php()
{
    return '8.2';
}

function code_block_pro_has_next_php()
{
    return (bool) apply_filters(
        'blocks.codeBlockPro.hasNextPhp',
        version_compare(PHP_VERSION, code_block_pro_next_php(), '>=')
    );
}

function code_block_pro_basename()
{
    return plugin_basename(dirname(__DIR__) . '/code-block-pro.php');
}

// Without mbregex nothing renders, and only a different PHP build can add it.
add_filter('site_transient_update_plugins', function ($transient) {
    if (code_block_pro_can_highlight()) {
        return $transient;
    }

    if (!isset($transient->response) || !is_array($transient->response)) {
        return $transient;
    }

    unset($transient->response[code_block_pro_basename()]);

    return $transient;
});

function code_block_pro_missing_mbregex_error()
{
    return new WP_Error(
        'code_block_pro_missing_mbregex',
        __('Code Block Pro needs mbregex, part of the PHP mbstring extension, to highlight code. This server was built without it, so nothing was installed.', 'code-block-pro')
    );
}

function code_block_pro_source_is_ours($source)
{
    if (!function_exists('get_plugin_data')) {
        require_once ABSPATH . 'wp-admin/includes/plugin.php';
    }

    foreach ((array) glob(trailingslashit($source) . '*.php') as $file) {
        $data = get_plugin_data($file, false, false);

        if (($data['TextDomain'] ?? '') === 'code-block-pro') {
            return true;
        }
    }

    return false;
}

// wp-cli and the update screens run the upgrader without consulting the transient.
add_filter('upgrader_pre_install', function ($response, $hook_extra) {
    if (code_block_pro_can_highlight()) {
        return $response;
    }

    if (($hook_extra['plugin'] ?? '') !== code_block_pro_basename()) {
        return $response;
    }

    return code_block_pro_missing_mbregex_error();
}, 10, 2);

// An upload or a forced install names no plugin, so the package itself has to say.
add_filter('upgrader_source_selection', function ($source) {
    if (code_block_pro_can_highlight()) {
        return $source;
    }

    if (!code_block_pro_source_is_ours($source)) {
        return $source;
    }

    return code_block_pro_missing_mbregex_error();
});
