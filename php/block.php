<?php

defined('ABSPATH') or die;

const CODE_BLOCK_PRO_HEADERS = ['headlights', 'headlightsMuted', 'headlightsMutedAlt', 'simpleString', 'stringSmall', 'pillString'];
const CODE_BLOCK_PRO_FOOTERS = ['simpleStringEnd', 'simpleStringStart'];
const CODE_BLOCK_PRO_SEE_MORE = ['roundCenter', 'blockLeft', 'blockRight'];

/**
 * @param array<string, mixed> $attributes A 2.x block's attributes.
 */
function code_block_pro_render_block(array $attributes): string
{
    $profile = code_block_pro_block_profile($attributes);
    code_block_pro_enqueue_profile_style($profile);
    $settings = $profile['settings'];
    code_block_pro_enqueue_font((string) $settings['fontFamily']);
    $panes = array_values(array_filter(is_array($attributes['panes'] ?? null) ? $attributes['panes'] : [], 'is_array')) ?: [[]];
    $anchor = code_block_pro_anchor($attributes['anchor'] ?? '');
    $uid = code_block_pro_preview_uid() ?: wp_unique_id('cbp-');
    // Ids must be unique on the page: the first block without an anchor gets #L12, later ones #code2-L12.
    static $anchorless = 0;
    $base = $anchor !== '' ? "$anchor-" : '';
    if ($anchor === '' && !empty($attributes['lineAnchors']) && ++$anchorless > 1) {
        $base = "code$anchorless-";
    }
    $tabbed = count($panes) > 1;
    $seeMore = in_array($settings['seeMoreType'], CODE_BLOCK_PRO_SEE_MORE, true) ? (string) $settings['seeMoreType'] : '';

    $rendered = [];
    foreach ($panes as $i => $pane) {
        $language = is_string($pane['language'] ?? null) ? $pane['language'] : '';
        // Undoes the editor's encode().
        $code = strtr(is_string($pane['code'] ?? null) ? $pane['code'] : '', ['&amp;' => '&', '&lt;' => '<', '&gt;' => '>']);
        $prefix = $base . ($i > 0 ? ($i + 1) . '-' : '');
        $options = code_block_pro_line_options($pane, $settings, $prefix, !empty($attributes['lineAnchors']));
        $themes = code_block_pro_profile_themes($profile, $language);
        $label = code_block_pro_plain_text($pane['label'] ?? '', 100);
        $label = $label !== '' ? $label : code_block_pro_language_name($language);
        $rendered[] = code_block_pro_render_code($code, $language, $profile, $options, $tabbed ? $label : '') + [
            'theme' => code_block_pro_theme_attributes($themes, code_block_pro_uses_classes($profile, $themes)),
            'label' => $label,
            'language' => code_block_pro_language_name($language),
            'fold' => $options['fold'],
        ];
    }
    foreach ($rendered as $i => $pane) {
        $rendered[$i]['more'] = $seeMore !== '' && $pane['fold'] > 0 && $pane['fold'] < $pane['lines'];
    }

    $buttons = code_block_pro_buttons($profile);
    $footer = in_array($settings['footerType'], CODE_BLOCK_PRO_FOOTERS, true) ? (string) $settings['footerType'] : '';
    $switchable = count($profile['conditions']) > 1;
    if ($tabbed || $buttons || array_filter(array_column($rendered, 'more'))) {
        wp_enqueue_script('code-block-pro-view');
    }

    $classes = ['cbp-block'];
    if ($profile['slug'] !== null) {
        $classes[] = "cbp-profile-{$profile['slug']}";
    }
    $flags = [
        'cbp-numbers' => $settings['lineNumbers'],
        'cbp-hover' => $settings['highlightingHover'],
        'cbp-reveal' => !empty($attributes['removeBlurOnHover']),
        'cbp-no-padding' => $settings['disablePadding'],
        'cbp-has-footer' => $footer !== '',
        'cbp-tabbed' => $tabbed,
        'cbp-more-transition' => $settings['seeMoreTransition'],
    ];
    $wrapper = ['class' => implode(' ', [...$classes, ...array_keys(array_filter($flags))]), 'data-code-block-pro' => CODE_BLOCK_PRO_VERSION];
    if ($anchor !== '') {
        $wrapper['id'] = $anchor;
    }
    if ($profile['slug'] !== null && $switchable) {
        $wrapper['data-cbp-profile'] = $profile['slug'];
    }
    if ($switchable && !code_block_pro_custom_conditions()) {
        $wrapper['data-cbp-light'] = $profile['conditions'][0]['id'];
        $wrapper['data-cbp-dark'] = $profile['conditions'][1]['id'];
    }

    $html = '<div ' . get_block_wrapper_attributes($wrapper) . '>';
    foreach ($profile['conditions'] as $condition) {
        if ($condition['background']['type'] === 'slot') {
            $html .= '<span class="cbp-background" data-cbp-condition="' . esc_attr($condition['id']) . '" aria-hidden="true"></span>';
        }
    }
    $html .= code_block_pro_header($attributes, $settings, $rendered, $buttons, $uid);
    foreach ($rendered as $i => $pane) {
        $html .= code_block_pro_pane($pane, $i, $tabbed, $uid, $settings);
    }
    if ($footer !== '') {
        $link = is_string($attributes['footerLink'] ?? null) ? esc_url($attributes['footerLink']) : '';
        $text = code_block_pro_plain_text($attributes['footerString'] ?? '', 200) ?: ($tabbed ? (string) wp_parse_url($link, PHP_URL_HOST) : $rendered[0]['language']);
        if ($link !== '') {
            $target = empty($attributes['footerLinkTarget']) ? '' : ' target="_blank" rel="noopener noreferrer"';
            $text = '<a class="cbp-footer-link" href="' . $link . '"' . $target . '>' . esc_html($text) . '</a>';
        } else {
            $text = esc_html($text);
        }
        $html .= '<div' . code_block_pro_themed("cbp-footer cbp-footer-$footer", $rendered[0]['theme']) . ">$text</div>";
    }

    return code_block_pro_inert_brackets($html . '</div>');
}

/**
 * A 1.x block's saved HTML, with the align and anchor the editor set since, which only reach its comment.
 *
 * @param array<string, mixed> $attributes
 */
function code_block_pro_legacy_html(string $content, array $attributes): string
{
    $tags = new WP_HTML_Tag_Processor($content);
    if (!$tags->next_tag() || !$tags->has_class('wp-block-kevinbatdorf-code-block-pro')) {
        return $content;
    }

    $align = in_array($attributes['align'] ?? '', ['wide', 'full'], true) ? 'align' . $attributes['align'] : '';
    foreach (['alignwide', 'alignfull'] as $class) {
        if ($class !== $align && $tags->has_class($class)) {
            $tags->remove_class($class);
        }
    }
    if ($align !== '' && !$tags->has_class($align)) {
        $tags->add_class($align);
    }

    $anchor = $attributes['anchor'] ?? null;
    if (is_string($anchor) && $anchor !== $tags->get_attribute('id')) {
        if ($anchor === '') {
            $tags->remove_attribute('id');
        } else {
            $tags->set_attribute('id', $anchor);
        }
    }

    return $tags->get_updated_html();
}

/**
 * Through render_block, so the editor gets block supports and render_block filters as visitors do.
 *
 * @param array<mixed> $attributes
 * @return array{html: string, styles: list<array{handle: string, href: string}>, ms: float, indent: string, issues: list<array{code: string, message: string}>}
 */
function code_block_pro_preview(array $attributes, bool $keepMarkers, string $uid = ''): array
{
    $attributes['version'] = 2;
    $settings = code_block_pro_block_profile($attributes)['settings'];
    $queued = wp_styles()->queue;
    $start = hrtime(true);
    code_block_pro_keep_markers($keepMarkers);
    code_block_pro_issues(true);
    code_block_pro_preview_uid(preg_match('/^[a-z][a-z0-9-]{0,39}$/', $uid) ? $uid : '');
    try {
        $html = render_block(['blockName' => 'kevinbatdorf/code-block-pro', 'attrs' => $attributes, 'innerBlocks' => [], 'innerHTML' => '', 'innerContent' => []]);
        $issues = code_block_pro_issues() ?? [];
    } finally {
        code_block_pro_keep_markers(false);
        code_block_pro_issues(false);
        code_block_pro_preview_uid('');
    }
    $ms = round((hrtime(true) - $start) / 1e6, 1);

    return [
        'html' => $html,
        'styles' => code_block_pro_stylesheets(array_values(array_diff(wp_styles()->queue, $queued))),
        'ms' => $ms,
        'indent' => $settings['useTabs'] ? "\t" : str_repeat(' ', max(1, (int) $settings['tabSize'])),
        'issues' => $issues,
    ];
}

/**
 * Each preview is its own request, so wp_unique_id() gives every block in the canvas the same ids.
 */
function code_block_pro_preview_uid(?string $set = null): string
{
    static $uid = '';
    if ($set !== null) {
        $uid = $set;
    }

    return $uid;
}

/**
 * What a render fell back from, for the editor to show the post's author.
 * Null unless a preview is rendering, so the front end builds no messages.
 *
 * @param bool|null $collect True starts an empty list, false stops collecting.
 * @return list<array{code: string, message: string}>|null
 */
function &code_block_pro_issues(?bool $collect = null): ?array
{
    static $issues = null;
    if ($collect !== null) {
        $issues = $collect ? [] : null;
    }

    return $issues;
}

/**
 * @param callable(): string $message
 * @param string $pane The tab to name, when the block has several.
 */
function code_block_pro_report_issue(string $code, callable $message, string $pane = ''): void
{
    $issues = &code_block_pro_issues();
    if ($issues === null) {
        return;
    }
    $text = $message();
    if ($pane !== '') {
        /* translators: 1: a tab's label, 2: a problem with the code in that tab. */
        $text = sprintf(__('In the “%1$s” tab: %2$s', 'code-block-pro'), $pane, $text);
    }
    $issue = ['code' => $code, 'message' => $text];
    if (!in_array($issue, $issues, true)) {
        $issues[] = $issue;
    }
}

/**
 * Each stylesheet after the ones it depends on, at the URL WordPress would print for it.
 *
 * @param list<string> $handles
 * @return list<array{handle: string, href: string}>
 */
function code_block_pro_stylesheets(array $handles): array
{
    $styles = wp_styles();
    // all_deps fills the to-do list the page prints from, so it runs on a resolver of its own.
    $resolver = new WP_Dependencies();
    $resolver->registered = $styles->registered;
    $resolver->all_deps($handles);

    $stylesheets = [];
    foreach ($resolver->to_do as $handle) {
        $style = $styles->registered[$handle];
        $href = is_string($style->src) && $style->src !== '' ? $styles->_css_href($style->src, $style->ver, $handle) : '';
        if ($href !== '') {
            // Escaped for an HTML attribute; the editor needs the URL itself.
            $stylesheets[] = ['handle' => $handle, 'href' => html_entity_decode($href, ENT_QUOTES | ENT_HTML5, 'UTF-8')];
        }
    }

    return $stylesheets;
}

/**
 * Header, footer and pane each carry the theme's classes, so each reads its colors from them.
 *
 * @param array{class: string, style: string} $theme
 */
function code_block_pro_themed(string $class, array $theme, string $extra = ''): string
{
    $attributes = ' class="' . esc_attr(trim("$class {$theme['class']}")) . '"';
    if ($theme['style'] !== '') {
        $attributes .= ' style="' . esc_attr($theme['style']) . '"';
    }

    return $attributes . $extra;
}

/**
 * @param array<string, mixed> $attributes
 * @param array<string, string|int|bool> $settings
 * @param non-empty-list<array{html: string, lines: int, theme: array{class: string, style: string}, label: string, language: string, fold: int, more: bool}> $panes
 */
function code_block_pro_header(array $attributes, array $settings, array $panes, string $buttons, string $uid): string
{
    $type = in_array($settings['headerType'], CODE_BLOCK_PRO_HEADERS, true) ? (string) $settings['headerType'] : 'none';
    $tabbed = count($panes) > 1;
    if ($type === 'none' && !$tabbed && $buttons === '') {
        return '';
    }

    $inner = match ($type) {
        'headlights' => '<svg class="cbp-dots" xmlns="http://www.w3.org/2000/svg" width="54" height="14" viewBox="0 0 54 14" aria-hidden="true" focusable="false"><g fill="none" fill-rule="evenodd" transform="translate(1 1)"><circle cx="6" cy="6" r="6" fill="#FF5F56" stroke="#E0443E" stroke-width=".5"></circle><circle cx="26" cy="6" r="6" fill="#FFBD2E" stroke="#DEA123" stroke-width=".5"></circle><circle cx="46" cy="6" r="6" fill="#27C93F" stroke="#1AAB29" stroke-width=".5"></circle></g></svg>',
        'headlightsMuted' => '<svg class="cbp-dots" xmlns="http://www.w3.org/2000/svg" width="54" height="14" viewBox="0 0 54 14" aria-hidden="true" focusable="false"><g transform="translate(1 1)"><circle cx="6" cy="6" r="6"></circle><circle cx="26" cy="6" r="6"></circle><circle cx="46" cy="6" r="6"></circle></g></svg>',
        'headlightsMutedAlt' => '<svg class="cbp-dots" xmlns="http://www.w3.org/2000/svg" width="62" height="20" viewBox="0 0 62 20" aria-hidden="true" focusable="false"><g transform="translate(1 1)"><circle cx="8" cy="8" r="8"></circle><circle cx="30" cy="8" r="8"></circle><circle cx="52" cy="8" r="8"></circle></g></svg>',
        default => '',
    };
    if (in_array($type, ['simpleString', 'stringSmall', 'pillString'], true)) {
        $title = code_block_pro_plain_text($attributes['headerString'] ?? '', 200) ?: ($tabbed ? '' : $panes[0]['language']);
        $inner .= $title === '' ? '' : '<span class="cbp-title">' . esc_html($title) . '</span>';
    }
    if ($tabbed) {
        $inner .= '<div class="cbp-tabs" role="tablist" aria-label="' . esc_attr__('Code', 'code-block-pro') . '">';
        foreach ($panes as $i => $pane) {
            $selected = $i === 0 ? 'true' : 'false';
            $inner .= sprintf(
                '<button type="button" class="cbp-tab" role="tab" id="%1$s-tab-%2$d" aria-controls="%1$s-pane-%2$d" aria-selected="%3$s"%4$s>%5$s</button>',
                esc_attr($uid),
                $i,
                $selected,
                $i === 0 ? '' : ' tabindex="-1"',
                esc_html($pane['label'])
            );
        }
        $inner .= '</div>';
    }
    $inner .= $buttons;

    // With nothing to show but buttons, they sit over the code's corner, as 1.x's copy button did.
    $class = 'cbp-header cbp-header-' . ($type === 'none' && !$tabbed ? 'overlay' : $type);

    return '<div' . code_block_pro_themed($class, $panes[0]['theme']) . ">$inner</div>";
}

/**
 * @param array{html: string, lines: int, theme: array{class: string, style: string}, label: string, language: string, fold: int, more: bool} $pane
 * @param array<string, string|int|bool> $settings
 */
function code_block_pro_pane(array $pane, int $i, bool $tabbed, string $uid, array $settings): string
{
    $id = "$uid-pane-$i";
    $extra = '';
    if ($tabbed || $pane['more']) {
        $extra .= ' id="' . esc_attr($id) . '"';
    }
    if ($tabbed) {
        $extra .= sprintf(' role="tabpanel" aria-labelledby="%s" data-cbp-theme="%s"', esc_attr("$uid-tab-$i"), esc_attr($pane['theme']['class']));
    }

    $html = '<div' . code_block_pro_themed('cbp-pane' . ($tabbed && $i === 0 ? ' cbp-active' : ''), $pane['theme'], $extra) . '>';
    if ($tabbed) {
        $html .= '<div class="cbp-pane-label">' . esc_html($pane['label']) . '</div>';
    }
    $html .= $pane['html'];
    if ($pane['more']) {
        $expand = code_block_pro_plain_text($settings['seeMoreString'], 100) ?: __('Expand', 'code-block-pro');
        $collapse = $settings['seeMoreCollapse'] ? (code_block_pro_plain_text($settings['seeMoreCollapseString'], 100) ?: __('Collapse', 'code-block-pro')) : '';
        $html .= sprintf(
            '<div class="cbp-more cbp-more-%s"><button type="button" class="cbp-more-button" aria-expanded="false" aria-controls="%s" data-cbp-expand="%s"%s>%s</button></div>',
            esc_attr((string) $settings['seeMoreType']),
            esc_attr($id),
            esc_attr($expand),
            $collapse === '' ? '' : ' data-cbp-collapse="' . esc_attr($collapse) . '"',
            esc_html($expand)
        );
    }

    return $html . '</div>';
}

/**
 * @param CodeBlockProProfile $profile
 */
function code_block_pro_buttons(array $profile): string
{
    $names = array_column($profile['conditions'], 'name', 'id');
    $html = '';
    foreach ($profile['buttons'] as $button) {
        if ($button['type'] === 'copy') {
            $label = $button['label'] !== '' ? $button['label'] : __('Copy', 'code-block-pro');
            $copied = $button['copiedLabel'] !== '' ? $button['copiedLabel'] : __('Copied!', 'code-block-pro');
            $html .= $button['icon'] === 'textSimple'
                ? sprintf('<button type="button" class="cbp-button cbp-copy cbp-copy-text" data-cbp-copied="%s"><span class="cbp-button-text">%s</span></button>', esc_attr($copied), esc_html($label))
                : sprintf('<button type="button" class="cbp-button cbp-copy" aria-label="%s" data-cbp-copied="%s">%s</button>', esc_attr($label), esc_attr($copied), code_block_pro_copy_icon($button['icon']));
        }
        if ($button['type'] === 'toggle') {
            $states = [['', __('Auto', 'code-block-pro')]];
            if (code_block_pro_custom_conditions()) {
                foreach ($button['conditions'] as $id) {
                    $states[] = [$id, ($names[$id] ?? '') ?: $id];
                }
            } elseif (count($profile['conditions']) > 1) {
                array_push($states, ['light', __('Light', 'code-block-pro')], ['dark', __('Dark', 'code-block-pro')]);
            }
            if (count($states) < 2) {
                continue;
            }
            $html .= sprintf(
                '<button type="button" class="cbp-button cbp-toggle" data-cbp-states="%s" data-cbp-scope="%s" data-cbp-remember="%s"><span class="cbp-button-text">%s</span> <span class="cbp-toggle-state">%s</span></button>',
                esc_attr((string) wp_json_encode($states)),
                esc_attr($button['scope']),
                $button['remember'] ? '1' : '0',
                esc_html($button['label'] !== '' ? $button['label'] : __('Theme', 'code-block-pro')),
                esc_html($states[0][1])
            );
        }
        if ($button['type'] === 'custom') {
            $html .= sprintf('<button type="button" class="cbp-button cbp-custom" data-cbp-button="%s">%s</button>', esc_attr($button['id']), esc_html($button['label'] !== '' ? $button['label'] : $button['id']));
        }
    }

    return $html === '' ? '' : '<div class="cbp-buttons">' . $html . '<span class="cbp-status" role="status"></span></div>';
}

function code_block_pro_copy_icon(string $icon): string
{
    $paths = $icon === 'twoSquares'
        ? ['M16.5 8.25V6a2.25 2.25 0 00-2.25-2.25H6A2.25 2.25 0 003.75 6v8.25A2.25 2.25 0 006 16.5h2.25m8.25-8.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-7.5A2.25 2.25 0 018.25 18v-1.5m8.25-8.25h-6a2.25 2.25 0 00-2.25 2.25v6', 'M4.5 12.75l6 6 9-13.5']
        : ['M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4'];

    return sprintf(
        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true" focusable="false"><path class="cbp-icon-copy" stroke-linecap="round" stroke-linejoin="round" d="%s"></path><path class="cbp-icon-done" stroke-linecap="round" stroke-linejoin="round" d="%s"></path></svg>',
        $paths[0],
        $paths[1]
    );
}

/**
 * The block's HTML anchor as the editor saves it, so links to it keep working; escaped where it's written.
 */
function code_block_pro_anchor(mixed $anchor): string
{
    return is_string($anchor) ? mb_substr(trim((string) preg_replace('/[\s#]+/u', '-', $anchor), '-'), 0, 100) : '';
}

function code_block_pro_enqueue_font(string $family): void
{
    $name = (string) preg_replace('/\..*$/', '', $family);
    $file = dirname(__DIR__) . "/build/fonts/$name.css";
    if (!preg_match('/^Code-Pro-[A-Za-z-]+$/', $name) || !is_file($file)) {
        return;
    }
    wp_enqueue_style("code-block-pro-font-$name", plugins_url("build/fonts/$name.css", __DIR__), [], (string) filemtime($file));
}

function code_block_pro_language_name(string $language): string
{
    static $names = null;
    if ($names === null) {
        $file = dirname(__DIR__) . '/build/languages.json';
        $names = is_file($file) ? json_decode((string) file_get_contents($file), true) : [];
        $names = is_array($names) ? $names : [];
    }
    $key = strtolower($language);
    if (isset($names[$key]) && is_string($names[$key])) {
        return $names[$key];
    }

    return $language === '' ? __('Plain text', 'code-block-pro') : code_block_pro_plain_text($language, 50);
}
