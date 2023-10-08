<?php

defined('ABSPATH') or die;

add_action('rest_api_init', function () {
    CBPRouter::post('/settings', function ($payload) {
        if (isset($payload['code_block_pro_settings'])) {
            update_option('code_block_pro_settings', $payload['code_block_pro_settings']);
        }
        if (isset($payload['code_block_pro_settings_2'])) {
            update_option('code_block_pro_settings_2', $payload['code_block_pro_settings_2']);
        }
        return new WP_REST_Response(
            [
                'code_block_pro_settings' => get_option('code_block_pro_settings'),
                'code_block_pro_settings_2' => get_option('code_block_pro_settings_2'),
            ]
        );
    });

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
