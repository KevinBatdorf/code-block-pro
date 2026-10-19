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

    // Profiles are hidden from REST, and reading them there needs edit_theme_options.
    CBPRouter::get('/profiles', function () {
        $posts = get_posts([
            'post_type' => CODE_BLOCK_PRO_PROFILE_TYPE,
            'post_status' => 'publish',
            'numberposts' => -1,
            'orderby' => 'title',
            'order' => 'ASC',
            'no_found_rows' => true,
            'suppress_filters' => true,
        ]);
        $profiles = array_map(fn (WP_Post $post) => ['slug' => $post->post_name, 'title' => $post->post_title ?: $post->post_name], $posts);
        usort($profiles, fn ($a, $b) => ($b['slug'] === 'default') <=> ($a['slug'] === 'default'));
        // Until an admin's visit seeds it, blocks render with the built-in default.
        if (($profiles[0]['slug'] ?? '') !== 'default') {
            array_unshift($profiles, ['slug' => 'default', 'title' => __('Default', 'code-block-pro')]);
        }

        return new WP_REST_Response($profiles);
    });

    CBPRouter::post('/preview', function (WP_REST_Request $request) {
        $attributes = $request->get_param('attributes');
        $uid = $request->get_param('uid');
        if (!is_array($attributes) || ($attributes !== [] && array_is_list($attributes))) {
            return new WP_Error('rest_invalid_param', __('The block attributes must be an object.', 'code-block-pro'), ['status' => 400]);
        }

        return new WP_REST_Response(code_block_pro_preview($attributes, filter_var($request->get_param('keepMarkers'), FILTER_VALIDATE_BOOLEAN), is_string($uid) ? $uid : ''));
    });
});
