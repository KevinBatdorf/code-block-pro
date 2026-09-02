<?php

defined('ABSPATH') or die;

function code_block_pro_can_upgrade()
{
    // The mb_ereg_* set phiki v2.2.1 calls; phiki is not a dependency, so drift goes unnoticed.
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
