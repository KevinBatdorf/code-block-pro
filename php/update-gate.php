<?php

defined('ABSPATH') or die;

function code_block_pro_can_highlight()
{
    return (bool) apply_filters('blocks.codeBlockPro.canHighlight', function_exists('mb_ereg_search_init'));
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

// wp-cli and the update screens run the upgrader without consulting the transient.
add_filter('upgrader_pre_install', function ($response, $hook_extra) {
    if (code_block_pro_can_highlight()) {
        return $response;
    }

    if (($hook_extra['plugin'] ?? '') !== code_block_pro_basename()) {
        return $response;
    }

    return new WP_Error(
        'code_block_pro_missing_mbregex',
        __('Code Block Pro needs mbregex, part of the PHP mbstring extension, to highlight code. This server was built without it, so the update was stopped.', 'code-block-pro')
    );
}, 10, 2);
