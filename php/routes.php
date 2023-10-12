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

    CBPRouter::get('/code', function (WP_REST_Request $request) {
        $parsedUrl = wp_parse_url($request->get_param('url'));

        $validHosts = ['gist.githubusercontent.com', 'raw.githubusercontent.com', 'github.com'];

        if (!in_array($parsedUrl['host'], $validHosts)) {
            return new WP_REST_Response([
                'message' => 'Invalid URL'
            ]);
        }

        if ($parsedUrl['host'] === 'github.com') {
            $parsedUrl['host'] = 'raw.githubusercontent.com';
            $parsedUrl['path'] = str_replace('/blob', '', $parsedUrl['path']);
            $payload['url'] = $parsedUrl['scheme'] . '://' . $parsedUrl['host'] . $parsedUrl['path'];
        }

        $response = wp_remote_get($payload['url']);

        if ($response['headers']['content-type'] !== 'text/plain; charset=utf-8') {
            return new WP_REST_Response([
                'message' => 'Invalid Content-Type'
            ]);
        }

        return new WP_REST_Response([
            'code' => $response['body']
        ]);
    });
});
