<?php

defined('ABSPATH') or die;

const CODE_BLOCK_PRO_SAMPLE = ['language' => 'typescript', 'code' => "const greet = (name) => {\n  // Say hello\n  return `Hi, \${name}!`;\n};"];

/**
 * @return list<string>
 */
function code_block_pro_theme_slugs(): array
{
    $slugs = array_map(fn ($file) => basename($file, '.json'), glob(dirname(__DIR__) . '/build/themes/*.json') ?: []);
    $extra = array_map('strval', array_keys((array) apply_filters('blocks.codeBlockPro.themeFiles', [])));

    return array_values(array_unique([...$slugs, ...$extra]));
}

/**
 * @return list<array{slug: string, title: string, background: string, foreground: string, dark: bool}>
 */
function code_block_pro_manager_themes(): array
{
    $themes = [];
    foreach (code_block_pro_theme_slugs() as $slug) {
        $file = code_block_pro_theme($slug)['json'];
        $json = is_file($file) ? json_decode((string) file_get_contents($file), true) : null;
        ['bg' => $bg, 'fg' => $fg] = code_block_pro_theme_colors($file);
        $hex = substr($bg, 1);
        $hex = strlen($hex) < 6 ? $hex[0] . $hex[0] . $hex[1] . $hex[1] . $hex[2] . $hex[2] : substr($hex, 0, 6);
        $channels = array_map(fn ($pair) => hexdec($pair) / 255, str_split($hex, 2));
        $themes[] = [
            'slug' => $slug,
            'title' => is_array($json) && is_string($json['name'] ?? null) && $json['name'] !== '' ? $json['name'] : $slug,
            'background' => $bg,
            'foreground' => $fg,
            'dark' => 0.2126 * $channels[0] + 0.7152 * $channels[1] + 0.0722 * $channels[2] < 0.5,
        ];
    }

    return $themes;
}

/**
 * @return list<array{value: string, label: string, href: string}>
 */
function code_block_pro_manager_fonts(): array
{
    $fonts = [];
    foreach (glob(dirname(__DIR__) . '/build/fonts/Code-Pro-*.css') ?: [] as $file) {
        $name = basename($file, '.css');
        $fonts[] = [
            'value' => $name,
            'label' => str_replace('-', ' ', substr($name, strlen('Code-Pro-'))),
            'href' => add_query_arg('ver', (string) filemtime($file), plugins_url("build/fonts/$name.css", __DIR__)),
        ];
    }

    return $fonts;
}

/**
 * The code a profile previews themes with, when it has its own.
 *
 * @return array{language: string, code: string}|null
 */
function code_block_pro_profile_sample(int $id): ?array
{
    $sample = get_post_meta($id, 'code_block_pro_sample', true);

    return is_array($sample) && is_string($sample['code'] ?? null) && $sample['code'] !== '' ? ['language' => (string) ($sample['language'] ?? ''), 'code' => $sample['code']] : null;
}

/**
 * The sample colored by every theme, inline, so the theme picker loads no theme stylesheets.
 *
 * @param array{language: string, code: string} $sample
 * @return array<string, string> theme slug => HTML
 */
function code_block_pro_theme_samples(array $sample): array
{
    $slugs = code_block_pro_theme_slugs();
    // A profile's own sample changes as it is typed, so only the shared one is stored.
    $files = array_map(fn ($slug) => @filemtime(code_block_pro_theme($slug)['json']), $slugs);
    $key = $sample === CODE_BLOCK_PRO_SAMPLE ? 'code_block_pro_samples_' . md5(serialize([CODE_BLOCK_PRO_VERSION, $slugs, $files])) : '';
    $cached = $key !== '' ? get_transient($key) : null;
    if (is_array($cached)) {
        return $cached;
    }

    $samples = [];
    $saved = [mb_regex_encoding(), mb_internal_encoding(), mb_regex_set_options()];
    try {
        // The byte-counting setup code_block_pro_render_code() explains.
        mb_regex_encoding('UTF-8');
        mb_internal_encoding('8bit');
        mb_regex_set_options('pr');
        require_once dirname(__DIR__) . '/vendor/autoload.php';
        require_once __DIR__ . '/highlight-theme.php';
        $phiki = new \Phiki\Phiki();
        $language = $phiki->environment->grammars->has($sample['language']) ? $sample['language'] : 'txt';
        foreach ($slugs as $slug) {
            $phiki->theme($slug, CodeBlockProTheme::fromFile(code_block_pro_theme($slug)['json']));
            $samples[$slug] = $phiki->codeToHtml($sample['code'], $language, $slug)->toString();
        }
    } catch (\Throwable) {
        $samples = array_fill_keys($slugs, '<pre><code>' . esc_html($sample['code']) . '</code></pre>');
        $key = '';
    } finally {
        mb_regex_encoding((string) $saved[0]);
        mb_internal_encoding((string) $saved[1]);
        mb_regex_set_options($saved[2]);
    }
    if ($key !== '') {
        set_transient($key, $samples, DAY_IN_SECONDS);
    }

    return $samples;
}

/**
 * @return list<array{slug: string, title: string, data: CodeBlockProProfileData, sample: array{language: string, code: string}|null}>
 */
function code_block_pro_manager_profiles(): array
{
    $posts = get_posts([
        'post_type' => CODE_BLOCK_PRO_PROFILE_TYPE,
        'post_status' => 'publish',
        'numberposts' => -1,
        'orderby' => 'title',
        'order' => 'ASC',
        'no_found_rows' => true,
        'suppress_filters' => true,
    ]);
    $profiles = array_map(fn (WP_Post $post) => [
        'slug' => $post->post_name,
        'title' => $post->post_title ?: $post->post_name,
        'data' => code_block_pro_sanitize_profile(json_decode($post->post_content, true)),
        'sample' => code_block_pro_profile_sample($post->ID),
    ], $posts);
    usort($profiles, fn ($a, $b) => ($b['slug'] === 'default') <=> ($a['slug'] === 'default'));

    return $profiles;
}

/**
 * Per profile: how many blocks use it, on how many pages, and each page with its own count.
 * Drafts and private pages count, since a change reaches them too.
 *
 * @return array{blocks: array<string, int>, pages: array<string, int>, list: array<string, list<array{id: int, title: string, url: string, blocks: int}>>}
 */
function code_block_pro_profile_usage(): array
{
    global $wpdb;
    $rows = $wpdb->get_results($wpdb->prepare(
        "SELECT ID, post_content FROM {$wpdb->posts} WHERE post_status IN ('publish', 'future', 'draft', 'pending', 'private') AND post_type NOT IN ('revision', %s) AND post_content LIKE %s",
        CODE_BLOCK_PRO_PROFILE_TYPE,
        '%' . $wpdb->esc_like('<!-- wp:kevinbatdorf/code-block-pro ') . '%'
    ));
    $counts = [];
    $walk = function (array $blocks, int $id) use (&$walk, &$counts): void {
        foreach ($blocks as $block) {
            if (($block['blockName'] ?? '') === 'kevinbatdorf/code-block-pro' && (int) ($block['attrs']['version'] ?? 1) >= 2) {
                $slug = (string) ($block['attrs']['profile'] ?? 'default');
                $counts[$slug][$id] = ($counts[$slug][$id] ?? 0) + 1;
            }
            $walk($block['innerBlocks'] ?? [], $id);
        }
    };
    foreach ($rows as $row) {
        $walk(parse_blocks($row->post_content), (int) $row->ID);
    }

    $usage = ['blocks' => [], 'pages' => [], 'list' => []];
    foreach ($counts as $slug => $byPost) {
        $usage['blocks'][$slug] = array_sum($byPost);
        $usage['pages'][$slug] = count($byPost);
        foreach ($byPost as $id => $blocks) {
            $usage['list'][$slug][] = ['id' => $id, 'title' => get_the_title($id) ?: __('(no title)', 'code-block-pro'), 'url' => (string) get_permalink($id), 'blocks' => $blocks];
        }
    }

    return $usage;
}

/**
 * An unsaved profile rendered once per swap, with nothing stored. Swaps share one stylesheet, so they may change markup only.
 *
 * @param array<mixed> $swaps Each with settings and buttons to use in place of the profile's.
 * @param array<mixed> $attributes
 * @return array{items: list<string>, css: string, styles: list<array{handle: string, href: string}>}
 */
function code_block_pro_render_draft(mixed $data, array $swaps, array $attributes, string $slot): array
{
    $data = code_block_pro_sanitize_profile($data);
    // Previews show the Light theme, whatever the browser's scheme.
    $base = $data['conditions'][0];
    $data['conditions'] = [$base];
    $data['languages'] = array_filter(array_map(fn ($themes) => array_intersect_key($themes, [$base['id'] => true]), $data['languages']));

    $slug = "draft_$slot";
    $result = ['items' => [], 'css' => '', 'styles' => []];
    try {
        foreach (array_slice($swaps, 0, 24) as $i => $swap) {
            $swap = is_array($swap) ? $swap : [];
            $draft = $data;
            $draft['settings'] = array_merge($draft['settings'], is_array($swap['settings'] ?? null) ? $swap['settings'] : []);
            $draft['buttons'] = is_array($swap['buttons'] ?? null) ? $swap['buttons'] : $draft['buttons'];
            $profile = ['id' => 0, 'slug' => $slug, 'stamp' => ''] + code_block_pro_sanitize_profile($draft);
            code_block_pro_draft_profile($profile);
            $rendered = code_block_pro_preview(['profile' => $slug] + $attributes, false, "draft-$slot-$i");
            $result['items'][] = $rendered['html'];
            array_push($result['styles'], ...$rendered['styles']);
            if ($i === 0 && code_block_pro_profile_needs_stylesheet($profile)) {
                $result['css'] = code_block_pro_profile_css($profile);
            }
        }
    } finally {
        code_block_pro_draft_profile(false);
    }

    return $result;
}

add_action('rest_api_init', function () {
    $route = function (string $path, string $method, callable $callback) {
        register_rest_route('code-block-pro/v1', "/manage/$path", [
            'methods' => $method,
            'callback' => $callback,
            // Blocks anyone else from restyling every block on the site, or listing private pages that use a profile.
            'permission_callback' => fn () => current_user_can('edit_theme_options'),
        ]);
    };
    $text = function (WP_REST_Request $request, string $name): string {
        $value = $request->get_param($name);

        return is_string($value) ? $value : '';
    };

    $route('meta', 'GET', fn () => new WP_REST_Response([
        'themes' => code_block_pro_manager_themes(),
        'fonts' => code_block_pro_manager_fonts(),
        'headers' => CODE_BLOCK_PRO_HEADERS,
        'footers' => CODE_BLOCK_PRO_FOOTERS,
        'seeMore' => CODE_BLOCK_PRO_SEE_MORE,
        // A new profile starts from this.
        'base' => code_block_pro_sanitize_profile([]),
        'sample' => CODE_BLOCK_PRO_SAMPLE,
    ]));

    // Empty code means the shared sample.
    $route('samples', 'POST', function (WP_REST_Request $request) use ($text) {
        $code = mb_substr($text($request, 'code'), 0, 2000);
        $language = code_block_pro_language($text($request, 'language'));

        return new WP_REST_Response(code_block_pro_theme_samples(trim($code) === '' ? CODE_BLOCK_PRO_SAMPLE : ['language' => $language ?: 'txt', 'code' => $code]));
    });

    $route('profiles', 'GET', function () {
        $usage = code_block_pro_profile_usage();

        return new WP_REST_Response([
            'profiles' => code_block_pro_manager_profiles(),
            'usage' => (object) $usage['blocks'],
            'pages' => (object) $usage['pages'],
            'pageList' => (object) $usage['list'],
        ]);
    });

    // No slug adds a profile. Data or sample left out stays as it is; a null sample goes back to the shared one.
    $route('profiles', 'POST', function (WP_REST_Request $request) use ($text) {
        $title = sanitize_text_field($text($request, 'title'));
        $slug = $text($request, 'slug');
        $post = $slug !== '' ? code_block_pro_profile_post($slug) : null;
        if ($slug !== '' && !$post) {
            return new WP_Error('rest_not_found', __('That profile does not exist or is not published.', 'code-block-pro'), ['status' => 404]);
        }
        $stored = $post ? json_decode($post->post_content, true) : null;
        // Saving would drop what this release can't read.
        if (is_array($stored) && (int) ($stored['version'] ?? 1) > 1) {
            return new WP_Error('rest_conflict', __('A newer version of Code Block Pro saved this profile. Update the plugin to change it.', 'code-block-pro'), ['status' => 409]);
        }

        $data = $request->get_param('data');
        $id = $post->ID ?? 0;
        if (!$post) {
            $base = sanitize_title($title) ?: 'profile';
            $slug = $base;
            for ($i = 2; code_block_pro_profile_post($slug); $i++) {
                $slug = "$base-$i";
            }
        }
        if (!$post || is_array($data)) {
            $id = code_block_pro_insert_profile($slug, is_array($data) ? $data : [], $title ?: ($post ? '' : $slug));
        }
        if (!$id) {
            return new WP_Error('rest_cannot_create', __('The profile could not be saved.', 'code-block-pro'), ['status' => 500]);
        }

        if ($request->has_param('sample')) {
            $sample = $request->get_param('sample');
            $code = is_array($sample) && is_string($sample['code'] ?? null) ? mb_substr($sample['code'], 0, 2000) : '';
            if (trim($code) === '') {
                delete_post_meta($id, 'code_block_pro_sample');
            } else {
                update_post_meta($id, 'code_block_pro_sample', wp_slash(['language' => code_block_pro_language(is_string($sample['language'] ?? null) ? $sample['language'] : '') ?: 'txt', 'code' => $code]));
            }
        }

        return new WP_REST_Response(['slug' => get_post_field('post_name', $id)]);
    });

    $route('render', 'POST', function (WP_REST_Request $request) use ($text) {
        $attributes = $request->get_param('attributes');
        $swaps = $request->get_param('swaps');
        if (!is_array($attributes) || ($attributes !== [] && array_is_list($attributes))) {
            return new WP_Error('rest_invalid_param', __('The block attributes must be an object.', 'code-block-pro'), ['status' => 400]);
        }
        $slot = substr((string) preg_replace('/[^a-z0-9]/', '', strtolower($text($request, 'slot'))), 0, 8) ?: 'a';

        return new WP_REST_Response(code_block_pro_render_draft($request->get_param('data'), is_array($swaps) ? array_values($swaps) : [[]], $attributes, $slot));
    });
});

add_action('enqueue_block_editor_assets', function () {
    $dir = dirname(__DIR__) . '/build';
    // Its routes refuse everyone else, so they get no menu items that would fail.
    if (!current_user_can('edit_theme_options') || !is_file("$dir/profiles.js")) {
        return;
    }
    $asset = include "$dir/profiles.asset.php";
    wp_enqueue_script('code-block-pro-profiles', plugins_url('build/profiles.js', __DIR__), $asset['dependencies'], $asset['version'], true);
    wp_set_script_translations('code-block-pro-profiles', 'code-block-pro');
    // The previews render in the editor's own document, outside the canvas iframe.
    wp_enqueue_style('code-block-pro-profiles', plugins_url('build/profiles.css', __DIR__), ['wp-components', 'code-block-pro'], $asset['version']);
});
