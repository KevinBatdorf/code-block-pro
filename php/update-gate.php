<?php

defined('ABSPATH') or die;

function code_block_pro_can_highlight()
{
    return (bool) apply_filters('blocks.codeBlockPro.canHighlight', function_exists('mb_ereg_search_init'));
}

// Without mbregex nothing renders, and only a different PHP build can add it.
add_filter('site_transient_update_plugins', function ($transient) {
    if (code_block_pro_can_highlight()) {
        return $transient;
    }

    if (!isset($transient->response) || !is_array($transient->response)) {
        return $transient;
    }

    unset($transient->response[plugin_basename(dirname(__DIR__) . '/code-block-pro.php')]);

    return $transient;
});
