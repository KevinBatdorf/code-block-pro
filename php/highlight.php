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

function code_block_pro_color_class(string $color): string
{
    return 'cbp-' . preg_replace('/[^0-9a-z]/', '', strtolower($color));
}

function code_block_pro_cache_key(string $code, string $language, string $theme, string $version = CODE_BLOCK_PRO_VERSION): string
{
    $json = code_block_pro_theme($theme)['json'];

    // A theme file from the filter can change without this plugin updating.
    return 'code_block_pro_' . md5(serialize([$code, $language, $theme, $version, $json, is_file($json) ? filemtime($json) : 0]));
}

function code_block_pro_highlight(string $code, string $language, string $theme): string
{
    $code = preg_replace("/\n\z/", '', str_replace(["\r\n", "\r"], "\n", $code)) ?? $code;
    $theme = code_block_pro_theme($theme);

    if ($theme['css']) {
        wp_enqueue_style(
            "code-block-pro-theme-{$theme['slug']}",
            plugins_url("build/themes/{$theme['slug']}.css", __DIR__),
            [],
            (string) filemtime($theme['css'])
        );
    }

    // ANSI escapes carry arbitrary colors, which no prebuilt stylesheet can name.
    if (!code_block_pro_can_upgrade() || in_array($language, ['ansi', 'terminal'], true)) {
        return code_block_pro_plain($code, $theme);
    }

    $key = code_block_pro_cache_key($code, $language, $theme['slug']);
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
            return code_block_pro_plain($code, $theme);
        }
        require_once __DIR__ . '/highlight-transformer.php';
        require_once __DIR__ . '/highlight-theme.php';

        $phiki = (new \Phiki\Phiki())->theme($theme['slug'], CodeBlockProTheme::fromFile($theme['json']));
        if (!$phiki->environment->grammars->has($language)) {
            return code_block_pro_plain($code, $theme);
        }

        $html = $phiki->codeToHtml($code, $language, $theme['slug'])
            ->transformer(new CodeBlockProTransformer($theme['css'] ? $theme['slug'] : null))
            ->toString();
    } catch (\Throwable $e) {
        return code_block_pro_plain($code, $theme);
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
 * @param array{slug: string, css: string|null} $theme
 */
function code_block_pro_plain(string $code, array $theme): string
{
    $lines = array_map(function ($line) {
        return '<span class="line">' . htmlspecialchars($line, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') . '</span>';
    }, explode("\n", $code));
    $class = $theme['css'] ? " class=\"cbp-theme-{$theme['slug']}\"" : '';

    return code_block_pro_inert_brackets("<pre$class tabindex=\"0\"><code>" . implode("\n", $lines) . '</code></pre>');
}

function code_block_pro_inert_brackets(string $html): string
{
    // do_shortcode runs over rendered blocks, so brackets in the code would run shortcodes.
    return str_replace(['[', ']'], ['&#91;', '&#93;'], $html);
}
