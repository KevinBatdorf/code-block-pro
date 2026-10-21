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

    $slug = $shipped ? $slug : CODE_BLOCK_PRO_DEFAULT_THEME;

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
        $slug = $overrides[$condition['id']] ?? $condition['theme'];
        $themes[$condition['id']] = code_block_pro_theme($slug);
        if ($themes[$condition['id']]['slug'] !== $slug) {
            code_block_pro_report_issue('unknown-theme', fn () => sprintf(
                /* translators: 1: the name of a color theme, as saved in the block or its profile. 2: the name of the theme used in its place. */
                __('The theme “%1$s” is not installed, so %2$s is used instead. Choose another theme, or reactivate the plugin that added it.', 'code-block-pro'),
                $slug,
                ucwords(str_replace('-', ' ', CODE_BLOCK_PRO_DEFAULT_THEME))
            ));
        }
    }

    return $themes;
}

/**
 * The classes that color a pane, its header and its footer, or the inline style when a lone theme has no stylesheet.
 *
 * @param non-empty-array<string, array{slug: string, json: string, css: string|null}> $themes Condition id => theme, base first.
 * @return array{class: string, style: string}
 */
function code_block_pro_theme_attributes(array $themes, bool $classes): array
{
    if (!$classes) {
        $colors = code_block_pro_theme_colors(reset($themes)['json']);

        return ['class' => '', 'style' => "--cbp-fg:{$colors['fg']};--cbp-bg:{$colors['bg']};color:{$colors['fg']};background-color:{$colors['bg']}"];
    }

    $names = [];
    foreach ($themes as $id => $theme) {
        $names[] = $names ? "cbp-$id-theme-{$theme['slug']}" : "cbp-theme-{$theme['slug']}";
    }

    return ['class' => implode(' ', $names), 'style' => ''];
}

/**
 * @param CodeBlockProProfile $profile
 * @param non-empty-array<string, array{slug: string, json: string, css: string|null}> $themes
 */
function code_block_pro_uses_classes(array $profile, array $themes): bool
{
    // Feed readers load no stylesheets.
    if (is_feed()) {
        return false;
    }

    // A profile stylesheet names the colors of themes that have no stylesheet of their own.
    return reset($themes)['css'] !== null || code_block_pro_profile_needs_stylesheet($profile);
}

/**
 * @param CodeBlockProProfile $profile
 * @param array<mixed> $context Anything else the output depends on.
 */
function code_block_pro_cache_key(string $code, string $language, array $profile, array $context = [], string $version = CODE_BLOCK_PRO_VERSION): string
{
    $themes = [];
    foreach (code_block_pro_profile_themes($profile, $language) as $id => $theme) {
        // A theme file from the filter can change without this plugin updating.
        $themes[] = [$id, $theme['slug'], $theme['json'], is_file($theme['json']) ? filemtime($theme['json']) : 0];
    }

    // Prefixed by profile, so a profile's save can delete the renders it made stale.
    $prefix = $profile['id'] ? "code_block_pro_p{$profile['id']}_" : 'code_block_pro_';

    return $prefix . md5(serialize([$code, $language, $themes, $profile['slug'], $profile['stamp'], $context, $version]));
}

/**
 * @param array{html: string, lines: int} $render
 */
function code_block_pro_cache_set(string $key, array $render): void
{
    $value = (string) wp_json_encode($render);
    // Four themes on a long file reach 1 MB, memcached's item limit; compressed it is a few percent of that.
    // Base64, because the options table refuses bytes that aren't valid UTF-8.
    if (function_exists('gzdeflate')) {
        $value = 'z:' . base64_encode((string) gzdeflate($value, 6));
    }
    set_transient($key, $value, MONTH_IN_SECONDS);
}

/**
 * @return array{html: string, lines: int}|null
 */
function code_block_pro_cache_get(string $key): ?array
{
    $value = get_transient($key);
    if (!is_string($value)) {
        return null;
    }
    if (str_starts_with($value, 'z:')) {
        $value = function_exists('gzinflate') ? @gzinflate((string) base64_decode(substr($value, 2), true)) : false;
    }
    $render = is_string($value) ? json_decode($value, true) : null;

    return is_array($render) && is_string($render['html'] ?? null) && is_int($render['lines'] ?? null) ? ['html' => $render['html'], 'lines' => $render['lines']] : null;
}

/**
 * @param CodeBlockProProfile $profile
 * @param CodeBlockProLineOptions|null $options
 */
function code_block_pro_highlight(string $code, string $language, array $profile, ?array $options = null): string
{
    return code_block_pro_render_code($code, $language, $profile, $options)['html'];
}

/**
 * @param CodeBlockProProfile $profile
 * @param CodeBlockProLineOptions|null $options
 * @param string $pane The tab its issues name, when the block has several.
 * @return array{html: string, lines: int} The `<pre>`, and how many lines it shows once markers are out.
 */
function code_block_pro_render_code(string $code, string $language, array $profile, ?array $options = null, string $pane = ''): array
{
    $options ??= code_block_pro_no_line_options();
    $keep = code_block_pro_keep_markers();
    $code = preg_replace("/\n\z/", '', str_replace(["\r\n", "\r"], "\n", $code)) ?? $code;
    $themes = code_block_pro_profile_themes($profile, $language);
    $classes = code_block_pro_uses_classes($profile, $themes);

    // Further conditions are colored by the profile stylesheet alone.
    $base = reset($themes);
    if ($base['css'] && $classes) {
        wp_enqueue_style(
            "code-block-pro-theme-{$base['slug']}",
            plugins_url("build/themes/{$base['slug']}.css", __DIR__),
            [],
            (string) filemtime($base['css'])
        );
    }

    $upgrade = code_block_pro_can_upgrade();
    if (!$upgrade) {
        code_block_pro_report_issue('no-mbregex', fn () => __('Code shows without colors because PHP on this server was built without mbregex, a part of the mbstring extension. Ask your web host to enable it.', 'code-block-pro'));
    }
    // ANSI escapes carry arbitrary colors, which no prebuilt stylesheet can name.
    $terminal = in_array($language, ['ansi', 'terminal'], true);
    if ($terminal) {
        code_block_pro_report_issue('plain-language', fn () => sprintf(
            /* translators: %s: a language name, such as ANSI. */
            __('Code set to “%s” shows as plain text, because Code Block Pro does not color terminal output. To highlight it, choose the language the code is written in.', 'code-block-pro'),
            code_block_pro_language_name($language)
        ), $pane);
    }
    if (!$upgrade || $terminal) {
        return code_block_pro_plain($code, $options, $keep);
    }

    // Without a marker the editor's render is the page's, so it reads the page's entry.
    $marked = $keep && stripos($code, '[!code') !== false;
    $key = code_block_pro_cache_key($code, $language, $profile, $marked ? [$options, $classes, 'keep-markers'] : [$options, $classes]);
    $cached = code_block_pro_cache_get($key);
    if ($cached) {
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
            code_block_pro_report_issue('highlighter-conflict', fn () => __('Another plugin loads its own copy of the highlighter Code Block Pro uses, so code shows as plain text. To find that plugin, deactivate your other plugins one at a time.', 'code-block-pro'));

            return code_block_pro_plain($code, $options, $keep);
        }
        require_once __DIR__ . '/highlight-transformer.php';
        require_once __DIR__ . '/highlight-theme.php';

        // One instance per request keeps the grammars and themes it has already parsed.
        static $phiki = null, $parsed = [], $registered = [];
        if ($phiki === null) {
            $phiki = new \Phiki\Phiki();
            // Phiki ships these grammars but leaves them out of its own list. Its Bicep grammar recurses forever.
            $grammars = dirname(__DIR__) . '/vendor/phiki/phiki/resources/grammars';
            foreach (['jinja-html', 'wenyan'] as $name) {
                $phiki->grammar($name, "$grammars/$name.json");
            }
            $phiki->alias('文言', 'wenyan');
        }
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
            if ($language !== '') {
                code_block_pro_report_issue('unknown-language', fn () => sprintf(
                    /* translators: %s: a language name, as typed in the block. */
                    __('Code Block Pro cannot color “%s” code, so it shows as plain text. Check the language name, or choose another language.', 'code-block-pro'),
                    // The internal encoding counts bytes here.
                    wp_strip_all_tags(mb_substr($language, 0, 100, 'UTF-8'))
                ), $pane);
            }

            return code_block_pro_plain($code, $options, $keep);
        }

        $transformer = new CodeBlockProTransformer($conditions, $classes, $options, $keep);
        $render = [
            'html' => $phiki->codeToHtml($code, $language, array_map(fn ($condition) => $condition['slug'], $conditions))->transformer($transformer)->toString(),
            'lines' => $transformer->count(),
        ];
    } catch (\Throwable $e) {
        if (defined('WP_DEBUG') && WP_DEBUG && code_block_pro_issues() !== null) {
            error_log("Code Block Pro could not highlight “{$language}” code: {$e->getMessage()}");
        }
        // The exception's message can name server paths, so the author gets none of it.
        code_block_pro_report_issue('highlight-failed', fn () => __('Something went wrong while coloring this code, so it shows as plain text. Try another theme or language. If that does not help, contact Code Block Pro support.', 'code-block-pro'), $pane);

        return code_block_pro_plain($code, $options, $keep);
    } finally {
        if (isset($saved)) {
            mb_regex_encoding((string) $saved[0]);
            mb_internal_encoding((string) $saved[1]);
            mb_regex_set_options($saved[2]);
        }
    }

    // The editor renders on every pause in typing, which would leave a row per keystroke.
    if (!$keep) {
        code_block_pro_cache_set($key, $render);
    }

    return $render;
}

/**
 * @param CodeBlockProLineOptions $options
 * @param bool $keep Keep markers as typed, each marker-only line in a `cbp-marker` span that takes no line number.
 * @return array{html: string, lines: int}
 */
function code_block_pro_plain(string $code, array $options, bool $keep = false): array
{
    ['lines' => $lines, 'marked' => $marked, 'markers' => $markers] = code_block_pro_strip_markers_plain(explode("\n", $code), $keep);
    $count = count($lines) - count($markers);
    $flags = code_block_pro_line_flags($count, $options, $marked);

    $html = '';
    $index = 0;
    foreach ($lines as $i => $line) {
        $text = htmlspecialchars($line, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') . ($i < count($lines) - 1 ? "\n" : '');
        if (isset($markers[$i])) {
            $html .= "<span class=\"line cbp-marker\">$text</span>";
            continue;
        }
        $attributes = '';
        foreach (code_block_pro_line_attributes($index, $options, $flags[$index] ?? []) as $name => $value) {
            $attributes .= " $name=\"" . esc_attr($value) . '"';
        }
        $tag = code_block_pro_line_tag($flags[$index] ?? []);
        $html .= "<$tag$attributes>$text</$tag>";
        $index++;
    }
    $classes = code_block_pro_pre_classes($count, $options, $flags);
    $class = $classes ? ' class="' . implode(' ', $classes) . '"' : '';

    return ['html' => code_block_pro_inert_brackets("<pre$class tabindex=\"0\"><code>$html</code></pre>"), 'lines' => $count];
}

function code_block_pro_inert_brackets(string $html): string
{
    // do_shortcode runs over rendered blocks, so brackets in the code would run shortcodes.
    return str_replace(['[', ']'], ['&#91;', '&#93;'], $html);
}
