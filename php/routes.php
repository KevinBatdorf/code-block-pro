<?php

defined('ABSPATH') or die;

add_action('rest_api_init', function () {
    CBPRouter::get('/settings', function () {
        return new WP_REST_Response(
            [
                'code_block_pro_settings' => get_option('code_block_pro_settings'),
                'code_block_pro_settings_2' => get_option('code_block_pro_settings_2'),
            ]
        );
    });

    CBPRouter::get('/can-save-html', function () {
        return new WP_REST_Response(current_user_can('unfiltered_html'));
    });
});
