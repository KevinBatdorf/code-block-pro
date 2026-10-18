<?php

defined('ABSPATH') or die;

/**
 * @return array{slug: string, json: string, css: string|null}
 */
function code_block_pro_theme(string $slug): array
{
    $dir = dirname(__DIR__) . '/build/themes';
    // The slug comes from block attributes and becomes part of a file path.
    $shipped = preg_match('/^[a-z0-9-]+$/', $slug) && is_file("$dir/$slug.json");

    /** @var array<string, string> slug => path to a VS Code theme JSON file */
    $extra = $shipped ? [] : (array) apply_filters('blocks.codeBlockPro.themeFiles', []);
    if (isset($extra[$slug])) {
        return ['slug' => $slug, 'json' => (string) $extra[$slug], 'css' => null];
    }

    $slug = $shipped ? $slug : 'nord';

    return ['slug' => $slug, 'json' => "$dir/$slug.json", 'css' => is_file("$dir/$slug.css") ? "$dir/$slug.css" : null];
}

/**
 * The colors a theme can paint, with shiki 0.14's default foreground and background so plain text keeps 1.x's color.
 *
 * @return array{fg: string, bg: string, colors: list<string>}
 */
function code_block_pro_theme_colors(string $json): array
{
    static $cache = [];
    if (isset($cache[$json])) {
        return $cache[$json];
    }

    $theme = is_file($json) ? json_decode((string) file_get_contents($json), true) : null;
    $theme = is_array($theme) ? $theme : [];
    $rules = is_array($theme['tokenColors'] ?? null) ? $theme['tokenColors'] : (is_array($theme['settings'] ?? null) ? $theme['settings'] : []);
    $hex = function (mixed $color): ?string {
        return is_string($color) && preg_match('/^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/iD', $color) ? strtolower($color) : null;
    };

    $global = [];
    $colors = [];
    foreach ($rules as $rule) {
        if (!is_array($rule) || !is_array($rule['settings'] ?? null)) {
            continue;
        }
        if (!$global && empty($rule['name']) && empty($rule['scope'])) {
            $global = $rule['settings'];
        }
        if ($color = $hex($rule['settings']['foreground'] ?? null)) {
            $colors[$color] = true;
        }
    }
    $light = ($theme['type'] ?? '') === 'light';
    $themeColors = is_array($theme['colors'] ?? null) ? $theme['colors'] : [];

    return $cache[$json] = [
        'fg' => $hex($global['foreground'] ?? null) ?? $hex($themeColors['editor.foreground'] ?? null) ?? ($light ? '#333333' : '#bbbbbb'),
        'bg' => $hex($global['background'] ?? null) ?? $hex($themeColors['editor.background'] ?? null) ?? ($light ? '#fffffe' : '#1e1e1e'),
        'colors' => array_keys($colors),
    ];
}

function code_block_pro_color_class(string $color, string $condition = ''): string
{
    return 'cbp-' . ($condition === '' ? '' : "$condition-") . preg_replace('/[^0-9a-z]/', '', strtolower($color));
}

/**
 * Language picks each condition's theme: a theme set for the language wins over the condition's own.
 *
 * @param CodeBlockProProfile $profile
 * @return non-empty-array<string, array{slug: string, json: string, css: string|null}> Condition id => theme, base first.
 */
function code_block_pro_profile_themes(array $profile, string $language): array
{
    $themes = [];
    $overrides = $profile['languages'] ? $profile['languages'][code_block_pro_language($language)] ?? [] : [];
    foreach ($profile['conditions'] as $condition) {
        $themes[$condition['id']] = code_block_pro_theme($overrides[$condition['id']] ?? $condition['theme']);
    }

    return $themes;
}

/**
 * @param CodeBlockProProfile $profile
 */
function code_block_pro_cache_key(string $code, string $language, array $profile, string $version = CODE_BLOCK_PRO_VERSION): string
{
    $themes = [];
    foreach (code_block_pro_profile_themes($profile, $language) as $id => $theme) {
        // A theme file from the filter can change without this plugin updating.
        $themes[] = [$id, $theme['slug'], $theme['json'], is_file($theme['json']) ? filemtime($theme['json']) : 0];
    }

    // Prefixed by profile, so a profile's save can delete the renders it made stale.
    $prefix = $profile['id'] ? "code_block_pro_p{$profile['id']}_" : 'code_block_pro_';

    return $prefix . md5(serialize([$code, $language, $themes, $profile['slug'], $profile['stamp'], $version]));
}

/**
 * @param CodeBlockProProfile $profile
 */
function code_block_pro_highlight(string $code, string $language, array $profile): string
{
    $code = preg_replace("/\n\z/", '', str_replace(["\r\n", "\r"], "\n", $code)) ?? $code;
    $themes = code_block_pro_profile_themes($profile, $language);
    // A profile stylesheet names the colors of themes that have no stylesheet of their own.
    $classes = reset($themes)['css'] !== null || code_block_pro_profile_needs_stylesheet($profile);

    // Further conditions are colored by the profile stylesheet alone.
    $base = reset($themes);
    if ($base['css']) {
        wp_enqueue_style(
            "code-block-pro-theme-{$base['slug']}",
            plugins_url("build/themes/{$base['slug']}.css", __DIR__),
            [],
            (string) filemtime($base['css'])
        );
    }

    // ANSI escapes carry arbitrary colors, which no prebuilt stylesheet can name.
    if (!code_block_pro_can_upgrade() || in_array($language, ['ansi', 'terminal'], true)) {
        return code_block_pro_plain($code, $themes, $classes);
    }

    $key = code_block_pro_cache_key($code, $language, $profile);
    $cached = get_transient($key);
    if (is_string($cached)) {
        return $cached;
    }

    try {
        // Phiki reads byte offsets from mb_ereg_* and slices with mb_substr, so both must count bytes.
        $saved = [mb_regex_encoding(), mb_internal_encoding(), mb_regex_set_options()];
        mb_regex_encoding('UTF-8');
        mb_internal_encoding('8bit');
        mb_regex_set_options('pr');

        require_once dirname(__DIR__) . '/vendor/autoload.php';
        // Another plugin's phiki would make the transformer class fail to compile, uncatchably.
        $parent = new \ReflectionClass(\Phiki\Transformers\AbstractTransformer::class);
        if (!str_starts_with((string) $parent->getFileName(), dirname(__DIR__) . '/vendor/')) {
            return code_block_pro_plain($code, $themes, $classes);
        }
        require_once __DIR__ . '/highlight-transformer.php';
        require_once __DIR__ . '/highlight-theme.php';

        // One instance per request keeps the grammars and themes it has already parsed.
        static $phiki = null, $parsed = [], $registered = [];
        $phiki ??= new \Phiki\Phiki();
        $conditions = [];
        foreach ($themes as $id => $theme) {
            if (($registered[$theme['slug']] ?? null) !== $theme['json']) {
                $parsed[$theme['json']] ??= CodeBlockProTheme::fromFile($theme['json']);
                $phiki->theme($theme['slug'], $parsed[$theme['json']]);
                $registered[$theme['slug']] = $theme['json'];
            }
            $conditions[$id] = ['slug' => $theme['slug'], 'fg' => code_block_pro_theme_colors($theme['json'])['fg']];
        }
        if (!$phiki->environment->grammars->has($language)) {
            return code_block_pro_plain($code, $themes, $classes);
        }

        $html = $phiki->codeToHtml($code, $language, array_map(fn ($condition) => $condition['slug'], $conditions))
            ->transformer(new CodeBlockProTransformer($conditions, $classes))
            ->toString();
    } catch (\Throwable $e) {
        return code_block_pro_plain($code, $themes, $classes);
    } finally {
        if (isset($saved)) {
            mb_regex_encoding((string) $saved[0]);
            mb_internal_encoding((string) $saved[1]);
            mb_regex_set_options($saved[2]);
        }
    }

    set_transient($key, $html, MONTH_IN_SECONDS);

    return $html;
}

/**
 * @param non-empty-array<string, array{slug: string, css: string|null}> $themes Condition id => theme, base first.
 */
function code_block_pro_plain(string $code, array $themes, bool $classes): string
{
    $lines = array_map(function ($line) {
        return '<span class="line">' . htmlspecialchars($line, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') . '</span>';
    }, explode("\n", $code));

    $names = [];
    foreach ($themes as $id => $theme) {
        $names[] = $names ? "cbp-$id-theme-{$theme['slug']}" : "cbp-theme-{$theme['slug']}";
    }
    $class = $classes ? ' class="' . implode(' ', $names) . '"' : '';

    return code_block_pro_inert_brackets("<pre$class tabindex=\"0\"><code>" . implode("\n", $lines) . '</code></pre>');
}

function code_block_pro_inert_brackets(string $html): string
{
    // do_shortcode runs over rendered blocks, so brackets in the code would run shortcodes.
    return str_replace(['[', ']'], ['&#91;', '&#93;'], $html);
}
