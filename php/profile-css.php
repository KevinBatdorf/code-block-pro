<?php

defined('ABSPATH') or die;

/**
 * Condition triggers, custom backgrounds and filter themes have no rules in the build.
 *
 * @param CodeBlockProProfile $profile
 */
function code_block_pro_profile_needs_stylesheet(array $profile): bool
{
    if ($profile['slug'] === null) {
        return false;
    }
    if (count($profile['conditions']) > 1 || $profile['conditions'][0]['background']['type'] !== 'theme') {
        return true;
    }

    return (bool) array_filter(code_block_pro_condition_themes($profile, $profile['conditions'][0]['id']), fn ($theme) => $theme['css'] === null);
}

/**
 * @param CodeBlockProProfile $profile
 * @return array<string, array{slug: string, json: string, css: string|null}> Every theme the condition can render with.
 */
function code_block_pro_condition_themes(array $profile, string $id): array
{
    $slugs = [];
    foreach ($profile['conditions'] as $condition) {
        if ($condition['id'] === $id) {
            $slugs[] = $condition['theme'];
        }
    }
    foreach ($profile['languages'] as $themes) {
        if (isset($themes[$id])) {
            $slugs[] = $themes[$id];
        }
    }

    $themes = [];
    foreach ($slugs as $slug) {
        $theme = code_block_pro_theme($slug);
        $themes[$theme['slug']] = $theme;
    }

    return $themes;
}

/**
 * @param CodeBlockProProfile $profile
 */
function code_block_pro_profile_css(array $profile): string
{
    $scope = '.cbp-profile-' . $profile['slug'];
    $conditions = $profile['conditions'];
    $base = array_shift($conditions);
    $baseThemes = code_block_pro_condition_themes($profile, $base['id']);
    // Scoped to the theme a page was rendered with, so a page cached before an edit falls back to the base whole.
    $basePre = ':is(' . implode(',', array_map(fn ($slug) => ".cbp-theme-$slug", array_keys($baseThemes))) . ')';
    $slots = array_filter($profile['conditions'], fn ($condition) => $condition['background']['type'] === 'slot');
    $rules = [];

    foreach ($baseThemes as $theme) {
        if ($theme['css'] === null) {
            array_push($rules, ...code_block_pro_base_theme_rules($theme));
        }
    }
    if ($slots) {
        array_push($rules, "$scope{position:relative}", "$scope .cbp-background{position:absolute;inset:0;pointer-events:none;display:none}", "$scope pre{position:relative}");
    }
    if ($base['background']['type'] === 'color') {
        $rules[] = "$scope $basePre{background-color:{$base['background']['value']}}";
    }
    if ($base['background']['type'] === 'slot') {
        array_push($rules, "$scope $basePre{background-color:transparent}", "$scope .cbp-background:where([data-cbp-condition=\"{$base['id']}\"]){display:block}");
    }

    foreach ($conditions as $condition) {
        $id = $condition['id'];
        $themes = code_block_pro_condition_themes($profile, $id);
        $pre = ':is(' . implode(',', array_map(fn ($slug) => ".cbp-$id-theme-$slug", array_keys($themes))) . ')';
        $own = [];
        $colors = [];
        foreach ($themes as $theme) {
            $palette = code_block_pro_theme_colors($theme['json']);
            array_push($colors, ...$palette['colors'], ...[$palette['fg']]);
            $background = match ($condition['background']['type']) {
                'color' => $condition['background']['value'],
                'slot' => 'transparent',
                default => $palette['bg'],
            };
            $own[] = "$scope .cbp-$id-theme-{$theme['slug']}{color:{$palette['fg']};background-color:$background}";
            $own[] = "$scope .cbp-$id-theme-{$theme['slug']} code{color:{$palette['fg']}}";
        }
        foreach (array_unique($colors) as $color) {
            $own[] = "$scope $pre ." . code_block_pro_color_class($color, $id) . "{color:$color}";
        }
        // One class per token sets every font property, so an earlier condition's style never shows through.
        for ($bits = 0; $bits < 16; $bits++) {
            $decoration = trim(($bits & 4 ? 'underline ' : '') . ($bits & 8 ? 'line-through' : '')) ?: 'none';
            $own[] = "$scope $pre span.cbp-$id-font$bits{font-style:" . ($bits & 1 ? 'italic' : 'inherit') . ';font-weight:' . ($bits & 2 ? 'bold' : 'inherit') . ";text-decoration:$decoration}";
        }
        if ($slots) {
            $own[] = "$scope .cbp-background{display:none}";
        }
        if ($condition['background']['type'] === 'slot') {
            $own[] = "$scope .cbp-background:where([data-cbp-condition=\"$id\"]){display:block}";
        }
        array_push($rules, ...code_block_pro_triggered($condition, $scope, $own));
    }

    return implode("\n", $rules) . "\n";
}

/**
 * The rules scripts/theme-css.js writes for a shipped theme, for one that came through the themes filter.
 *
 * @param array{slug: string, json: string} $theme
 * @return list<string>
 */
function code_block_pro_base_theme_rules(array $theme): array
{
    $colors = code_block_pro_theme_colors($theme['json']);
    $rules = [
        ".cbp-theme-{$theme['slug']}{color:{$colors['fg']};background-color:{$colors['bg']}}",
        ".cbp-theme-{$theme['slug']} code{color:{$colors['fg']}}",
    ];
    foreach ($colors['colors'] as $color) {
        $rules[] = '.' . code_block_pro_color_class($color) . "{color:$color}";
    }

    return [
        ...$rules,
        '.cbp-italic{font-style:italic}',
        '.cbp-bold{font-weight:bold}',
        '.cbp-underline{text-decoration:underline}',
        '.cbp-strike{text-decoration:line-through}',
        '.cbp-underline.cbp-strike{text-decoration:underline line-through}',
    ];
}

/**
 * A condition applies while its trigger is active, unless the block names a condition itself, as a toggle does.
 *
 * @param CodeBlockProCondition $condition
 * @param list<string> $rules Each starts with $scope.
 * @return list<string>
 */
function code_block_pro_triggered(array $condition, string $scope, array $rules): array
{
    // :where() adds no specificity, so of two active conditions the later one wins.
    $prefix = function (string $prefix) use ($scope, $rules): array {
        return array_map(fn ($rule) => $prefix . substr($rule, strlen($scope)), $rules);
    };
    $untouched = "$scope:where(:not([data-cbp-condition]))";
    $chosen = $prefix("$scope:where([data-cbp-condition~=\"{$condition['id']}\"])");

    return match ($condition['trigger']['type']) {
        'media' => ["@media {$condition['trigger']['value']}{" . implode('', $prefix($untouched)) . '}', ...$chosen],
        'class' => [...$prefix(":where(.{$condition['trigger']['value']}) $untouched"), ...$chosen],
        default => $chosen,
    };
}

/**
 * @param CodeBlockProProfile $profile
 */
function code_block_pro_profile_style_version(array $profile): string
{
    $files = [];
    foreach ($profile['conditions'] as $condition) {
        foreach (code_block_pro_condition_themes($profile, $condition['id']) as $theme) {
            $files[] = [$theme['json'], is_file($theme['json']) ? filemtime($theme['json']) : 0];
        }
    }

    return substr(md5(serialize([$profile['stamp'], CODE_BLOCK_PRO_VERSION, $files])), 0, 12);
}

/**
 * @param CodeBlockProProfile $profile
 */
function code_block_pro_enqueue_profile_style(array $profile): void
{
    if (!code_block_pro_profile_needs_stylesheet($profile)) {
        return;
    }

    // A URL, never inline: strict CSP sites refuse <style> elements.
    wp_enqueue_style(
        "code-block-pro-profile-{$profile['slug']}",
        add_query_arg('code-block-pro-profile', $profile['slug'], home_url('/')),
        [],
        code_block_pro_profile_style_version($profile)
    );
}

/**
 * Every published profile's stylesheet, built when profiles change so a visitor's request never builds or writes one.
 * One option, so a request for a slug that doesn't exist reads nothing new.
 */
function code_block_pro_store_profile_styles(): void
{
    $styles = [];
    foreach (get_posts(['post_type' => CODE_BLOCK_PRO_PROFILE_TYPE, 'post_status' => 'publish', 'numberposts' => -1, 'suppress_filters' => true]) as $post) {
        $profile = code_block_pro_profile($post->post_name);
        if ($profile['slug'] !== $post->post_name || !code_block_pro_profile_needs_stylesheet($profile)) {
            continue;
        }
        $styles[$post->post_name] = ['version' => code_block_pro_profile_style_version($profile), 'css' => code_block_pro_profile_css($profile)];
    }
    update_option('code_block_pro_profile_styles', $styles, false);
    update_option('code_block_pro_css_built', CODE_BLOCK_PRO_VERSION);
}

/**
 * @return array{status: int, headers: array<string, string>, body: string}|null Null unless the stored copy is the version asked for.
 */
function code_block_pro_stored_profile_style_response(string $slug, string $version, string $etag): ?array
{
    $stored = get_option('code_block_pro_profile_styles');
    $style = is_array($stored) ? $stored[$slug] ?? null : null;
    // The version covers the plugin release and every theme file, so a pack switched on or off misses here.
    if (!is_array($style) || $version === '' || ($style['version'] ?? '') !== $version) {
        return null;
    }

    return code_block_pro_style_response((string) $style['css'], $version, $version, $etag);
}

/**
 * @return array{status: int, headers: array<string, string>, body: string}
 */
function code_block_pro_profile_style_response(string $slug, string $version, string $etag = ''): array
{
    // A missing slug resolves to default, whose stylesheet that block already links; default itself may not be saved yet.
    $profile = code_block_pro_profile($slug);
    if ($profile['slug'] !== $slug) {
        return ['status' => 404, 'headers' => ['Content-Type' => 'text/css; charset=UTF-8', 'Cache-Control' => 'no-cache'], 'body' => ''];
    }
    $css = code_block_pro_profile_needs_stylesheet($profile) ? code_block_pro_profile_css($profile) : '';

    return code_block_pro_style_response($css, code_block_pro_profile_style_version($profile), $version, $etag);
}

/**
 * @return array{status: int, headers: array<string, string>, body: string}
 */
function code_block_pro_style_response(string $css, string $current, string $requested, string $etag): array
{
    $headers = [
        'Content-Type' => 'text/css; charset=UTF-8',
        'X-Content-Type-Options' => 'nosniff',
        'ETag' => '"' . md5($css) . '"',
        // A page cached before the last edit asks for an old version; it gets today's rules, briefly.
        'Cache-Control' => $requested === $current ? 'public, max-age=31536000, immutable' : 'public, max-age=300',
    ];

    return $etag === $headers['ETag'] ? ['status' => 304, 'headers' => $headers, 'body' => ''] : ['status' => 200, 'headers' => $headers, 'body' => $css];
}

/**
 * @param array{status: int, headers: array<string, string>, body: string} $response
 */
function code_block_pro_send_style(array $response): never
{
    status_header($response['status']);
    // Another plugin's cookie would keep shared caches from storing the stylesheet.
    header_remove('Set-Cookie');
    header_remove('Expires');
    header_remove('Pragma');
    foreach ($response['headers'] as $name => $value) {
        header("$name: $value");
    }
    echo $response['body']; // phpcs:ignore -- CSS built from sanitized profile data.
    exit;
}

function code_block_pro_style_request(): ?string
{
    $slug = $_GET['code-block-pro-profile'] ?? null;
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

    return is_string($slug) && in_array($method, ['GET', 'HEAD'], true) && !is_admin() ? $slug : null;
}

// Before the theme and init load: most stylesheet requests are answered from the stored copy.
add_action('plugins_loaded', function () {
    $slug = code_block_pro_style_request();
    if ($slug === null) {
        return;
    }
    $response = code_block_pro_stored_profile_style_response(
        $slug,
        is_string($_GET['ver'] ?? null) ? $_GET['ver'] : '',
        is_string($_SERVER['HTTP_IF_NONE_MATCH'] ?? null) ? wp_unslash($_SERVER['HTTP_IF_NONE_MATCH']) : ''
    );
    if ($response) {
        code_block_pro_send_style($response);
    }
});

add_action('wp_loaded', function () {
    $slug = code_block_pro_style_request();
    if ($slug === null) {
        return;
    }
    code_block_pro_send_style(code_block_pro_profile_style_response(
        $slug,
        is_string($_GET['ver'] ?? null) ? $_GET['ver'] : '',
        is_string($_SERVER['HTTP_IF_NONE_MATCH'] ?? null) ? wp_unslash($_SERVER['HTTP_IF_NONE_MATCH']) : ''
    ));
});

add_action('save_post_' . CODE_BLOCK_PRO_PROFILE_TYPE, function ($id) {
    code_block_pro_store_profile_styles();
    // Renders cached under the old version would sit in wp_options for a month.
    if (!wp_using_ext_object_cache()) {
        global $wpdb;
        $wpdb->query($wpdb->prepare(
            "DELETE FROM $wpdb->options WHERE option_name LIKE %s OR option_name LIKE %s",
            $wpdb->esc_like("_transient_code_block_pro_p{$id}_") . '%',
            $wpdb->esc_like("_transient_timeout_code_block_pro_p{$id}_") . '%'
        ));
    }
});

// After core clears its post cache, or the rebuild would still find the deleted profile.
add_action('after_delete_post', function ($id, $post) {
    if ($post instanceof WP_Post && $post->post_type === CODE_BLOCK_PRO_PROFILE_TYPE) {
        code_block_pro_store_profile_styles();
    }
}, 10, 2);

// A theme pack update changes theme files under stylesheets already stored.
add_action('upgrader_process_complete', 'code_block_pro_store_profile_styles');

// An update of this plugin runs its old code, so the next admin visit rebuilds.
add_action('admin_init', function () {
    // Keeps visitors, who reach admin_init through admin-ajax.php, from triggering a write.
    if (current_user_can('edit_theme_options') && !wp_doing_ajax() && get_option('code_block_pro_css_built') !== CODE_BLOCK_PRO_VERSION) {
        code_block_pro_store_profile_styles();
    }
});
