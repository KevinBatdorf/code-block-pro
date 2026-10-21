<?php

defined('ABSPATH') or die;

const CODE_BLOCK_PRO_PROFILE_TYPE = 'cbp_profile';
const CODE_BLOCK_PRO_DEFAULT_THEME = 'dracula';

add_action('init', 'code_block_pro_register_profile_type');

function code_block_pro_register_profile_type(): void
{
    register_post_type(CODE_BLOCK_PRO_PROFILE_TYPE, [
        'labels' => [
            'name' => __('Code Block Pro profiles', 'code-block-pro'),
            'singular_name' => __('Code Block Pro profile', 'code-block-pro'),
            'menu_name' => __('Code profiles', 'code-block-pro'),
            'add_new_item' => __('Add profile', 'code-block-pro'),
            'edit_item' => __('Edit profile', 'code-block-pro'),
            'search_items' => __('Search profiles', 'code-block-pro'),
            'not_found' => __('No profiles found.', 'code-block-pro'),
            'not_found_in_trash' => __('No profiles found in Trash.', 'code-block-pro'),
        ],
        'public' => false,
        'show_ui' => true,
        'show_in_menu' => 'themes.php',
        'rewrite' => false,
        'query_var' => false,
        // Profiles restyle every block on the site, so only site designers may change them.
        'capabilities' => [
            'read' => 'edit_posts',
            'create_posts' => 'edit_theme_options',
            'edit_posts' => 'edit_theme_options',
            'edit_published_posts' => 'edit_theme_options',
            'publish_posts' => 'edit_theme_options',
            'delete_posts' => 'edit_theme_options',
            'delete_published_posts' => 'edit_theme_options',
            'edit_others_posts' => 'edit_theme_options',
            'delete_others_posts' => 'edit_theme_options',
            'read_private_posts' => 'edit_theme_options',
            'edit_private_posts' => 'edit_theme_options',
            'delete_private_posts' => 'edit_theme_options',
        ],
        'map_meta_cap' => true,
        'supports' => ['title', 'revisions'],
    ]);
}

/**
 * @return array<string, string|int|bool>
 */
function code_block_pro_profile_setting_defaults(): array
{
    return [
        'fontSize' => '.875rem',
        'fontFamily' => 'Code-Pro-JetBrains-Mono',
        'lineHeight' => '1.25rem',
        'clampFonts' => false,
        'headerType' => 'headlights',
        'footerType' => 'none',
        'lineNumbers' => false,
        'highlightingHover' => false,
        'seeMoreType' => '',
        'seeMoreString' => '',
        'seeMoreTransition' => false,
        'seeMoreCollapse' => false,
        'seeMoreCollapseString' => '',
        'disablePadding' => false,
        'tabSize' => 2,
        'useTabs' => false,
        'editorHeight' => '',
    ];
}

/**
 * @param mixed $data Anything, typically decoded JSON from a profile post.
 * @return CodeBlockProProfileData
 */
function code_block_pro_sanitize_profile(mixed $data): array
{
    $data = is_array($data) ? $data : [];

    $settings = [];
    $given = is_array($data['settings'] ?? null) ? $data['settings'] : [];
    foreach (code_block_pro_profile_setting_defaults() as $key => $default) {
        $settings[$key] = code_block_pro_sanitize_setting($key, $given[$key] ?? $default, $default);
    }

    $conditions = [];
    $ids = [];
    foreach (is_array($data['conditions'] ?? null) ? array_values($data['conditions']) : [] as $condition) {
        if (!is_array($condition)) {
            continue;
        }
        $id = code_block_pro_condition_id((string) ($condition['id'] ?? ''), count($conditions), $ids);
        $ids[] = $id;
        $conditions[] = [
            'id' => $id,
            'name' => code_block_pro_plain_text($condition['name'] ?? $id, 60),
            'theme' => code_block_pro_theme_slug($condition['theme'] ?? ''),
            'trigger' => code_block_pro_sanitize_trigger($condition['trigger'] ?? null, count($conditions)),
            'background' => code_block_pro_sanitize_background($condition['background'] ?? null),
        ];
    }
    if (!$conditions) {
        $conditions[] = ['id' => 'main', 'name' => 'main', 'theme' => CODE_BLOCK_PRO_DEFAULT_THEME, 'trigger' => ['type' => 'base'], 'background' => ['type' => 'theme']];
    }

    $languages = [];
    foreach (is_array($data['languages'] ?? null) ? $data['languages'] : [] as $language => $themes) {
        $language = code_block_pro_language((string) $language);
        if ($language === '' || !is_array($themes)) {
            continue;
        }
        foreach ($themes as $condition => $theme) {
            if (in_array($condition, $ids, true)) {
                $languages[$language][$condition] = code_block_pro_theme_slug($theme);
            }
        }
    }

    $buttons = [];
    foreach (is_array($data['buttons'] ?? null) ? array_values($data['buttons']) : [] as $button) {
        $button = is_array($button) ? code_block_pro_sanitize_button($button, $ids) : null;
        if ($button) {
            $buttons[] = $button;
        }
    }

    return ['version' => 1, 'settings' => $settings, 'conditions' => $conditions, 'languages' => $languages, 'buttons' => $buttons];
}

/**
 * The grammar's own name for a language, so an override for javascript also covers a block stored as js.
 */
function code_block_pro_language(string $language): string
{
    static $aliases = null;
    $language = strtolower((string) preg_replace('/[^A-Za-z0-9_+#.-]/', '', $language));
    if ($language === '' || !is_file(dirname(__DIR__) . '/vendor/autoload.php')) {
        return $language;
    }

    if ($aliases === null) {
        require_once dirname(__DIR__) . '/vendor/autoload.php';
        $aliases = [];
        foreach (\Phiki\Grammar\Grammar::cases() as $grammar) {
            foreach ($grammar->aliases() as $alias) {
                $aliases[$alias] = $grammar->value;
            }
        }
    }

    return $aliases[$language] ?? $language;
}

function code_block_pro_sanitize_setting(string $key, mixed $value, string|int|bool $default): string|int|bool
{
    if (is_bool($default)) {
        return (bool) $value;
    }
    if (is_int($default)) {
        return max(1, min(16, (int) $value));
    }
    if (in_array($key, ['fontSize', 'lineHeight', 'fontFamily', 'editorHeight'], true)) {
        return code_block_pro_css_value($value, $default);
    }

    return code_block_pro_plain_text($value, 200);
}

/**
 * Lands in a stylesheet, where an unclosed paren, quote or comment would swallow every rule after it.
 */
function code_block_pro_css_value(mixed $value, string $default): string
{
    $value = is_scalar($value) ? trim((string) $value) : '';
    if (strlen($value) > 200 || !preg_match('/^[A-Za-z0-9 .,%()+*\/#"\'_-]*$/', $value) || str_contains($value, '/*')) {
        return $default;
    }
    $depth = 0;
    $quote = null;
    foreach (str_split($value) as $char) {
        if ($quote !== null) {
            $quote = $char === $quote ? null : $quote;
        } elseif ($char === '"' || $char === "'") {
            $quote = $char;
        } elseif ($char === '(' || $char === ')') {
            $depth += $char === '(' ? 1 : -1;
            if ($depth < 0) {
                return $default;
            }
        }
    }

    return $depth === 0 && $quote === null ? $value : $default;
}

function code_block_pro_plain_text(mixed $value, int $length): string
{
    $text = is_scalar($value) ? (string) $value : '';
    // Contributors can write 1.x's settings option, which seeds the default profile.
    $text = wp_strip_all_tags(wp_check_invalid_utf8($text, true));

    return mb_substr(trim((string) preg_replace('/[\x00-\x1F\x7F]/u', '', $text)), 0, $length);
}

/**
 * @param list<string> $taken
 */
function code_block_pro_condition_id(string $id, int $index, array $taken): string
{
    // Becomes part of class names like cbp-<id>-<hex>, so no hyphen may appear in it.
    $id = (string) preg_replace('/[^a-z0-9]/', '', strtolower($id));
    if ($id === '') {
        $id = "c$index";
    }
    if (!preg_match('/^[a-z]/', $id) || in_array($id, ['theme', 'italic', 'bold', 'underline', 'strike', 'block', 'profile', 'bg', 'background', 'line'], true)) {
        $id = "c$id";
    }
    $id = substr($id, 0, 20);
    $unique = $id;
    for ($n = 2; in_array($unique, $taken, true); $n++) {
        $unique = substr($id, 0, 20 - strlen((string) $n)) . $n;
    }

    return $unique;
}

function code_block_pro_theme_slug(mixed $slug): string
{
    $slug = is_string($slug) ? strtolower($slug) : '';

    return preg_match('/^[a-z0-9-]{1,80}$/', $slug) ? $slug : CODE_BLOCK_PRO_DEFAULT_THEME;
}

/**
 * @param int $position The first condition always applies, so it has no trigger.
 * @return CodeBlockProTrigger
 */
function code_block_pro_sanitize_trigger(mixed $trigger, int $position): array
{
    if ($position === 0) {
        return ['type' => 'base'];
    }
    $type = is_array($trigger) ? ($trigger['type'] ?? '') : '';
    $value = is_array($trigger) && is_string($trigger['value'] ?? null) ? trim($trigger['value']) : '';

    if ($type === 'media' && code_block_pro_is_safe_media_query($value)) {
        return ['type' => 'media', 'value' => $value];
    }
    // A CSS identifier, or the selector it lands in matches nothing.
    if ($type === 'class' && preg_match('/^-?[_a-zA-Z][_a-zA-Z0-9-]{0,99}$/', $value)) {
        return ['type' => 'class', 'value' => $value];
    }

    return ['type' => 'button'];
}

function code_block_pro_is_safe_media_query(string $query): bool
{
    // Pasted into @media, so anything that could close the block or open a comment is refused.
    if ($query === '' || strlen($query) > 300 || !preg_match('/^[A-Za-z0-9 :().,\/<>=-]+$/', $query) || str_contains($query, '/*')) {
        return false;
    }
    $depth = 0;
    foreach (str_split($query) as $char) {
        $depth += $char === '(' ? 1 : ($char === ')' ? -1 : 0);
        if ($depth < 0) {
            return false;
        }
    }

    return $depth === 0;
}

/**
 * @return CodeBlockProBackground
 */
function code_block_pro_sanitize_background(mixed $background): array
{
    $type = is_array($background) ? ($background['type'] ?? '') : '';
    $color = is_array($background) && is_string($background['value'] ?? null) ? sanitize_hex_color($background['value']) : null;

    if ($type === 'color' && $color) {
        return ['type' => 'color', 'value' => strtolower($color)];
    }
    if ($type === 'slot') {
        return ['type' => 'slot'];
    }

    return ['type' => 'theme'];
}

/**
 * @param array<mixed> $button
 * @param list<string> $conditions
 * @return CodeBlockProButton|null
 */
function code_block_pro_sanitize_button(array $button, array $conditions): ?array
{
    $type = $button['type'] ?? '';
    $label = code_block_pro_plain_text($button['label'] ?? '', 100);

    if ($type === 'copy') {
        return [
            'type' => 'copy',
            'icon' => in_array($button['icon'] ?? '', ['heroicons', 'twoSquares', 'textSimple'], true) ? $button['icon'] : 'heroicons',
            'label' => $label,
            'copiedLabel' => code_block_pro_plain_text($button['copiedLabel'] ?? '', 100),
        ];
    }
    if ($type === 'toggle') {
        $toggles = array_values(array_intersect(array_map('strval', (array) ($button['conditions'] ?? [])), $conditions));

        return ['type' => 'toggle', 'label' => $label, 'conditions' => $toggles ?: $conditions];
    }
    if ($type === 'custom') {
        $id = sanitize_key((string) ($button['id'] ?? ''));

        return $id === '' ? null : ['type' => 'custom', 'id' => $id, 'label' => $label];
    }

    return null;
}

/**
 * The profile a block renders with: the one it names, else default, else the built-in one. An empty name is freeflow.
 *
 * @param array<string, mixed> $attributes
 * @return CodeBlockProProfile
 */
function code_block_pro_block_profile(array $attributes): array
{
    $slug = $attributes['profile'] ?? 'default';
    if ($slug !== '') {
        $profile = code_block_pro_profile(is_string($slug) ? $slug : 'default');
        if (is_string($slug) && $profile['slug'] !== $slug) {
            code_block_pro_report_issue('missing-profile', fn () => sprintf(
                /* translators: %s: the name of a profile, as saved in the block. */
                __('The profile “%s” does not exist or is not published, so this block uses the Default profile. Choose another profile, or publish one with that name.', 'code-block-pro'),
                code_block_pro_plain_text($slug, 200)
            ));
        }

        return $profile;
    }

    $profile = code_block_pro_sanitize_profile(['conditions' => [['id' => 'main', 'theme' => $attributes['theme'] ?? CODE_BLOCK_PRO_DEFAULT_THEME]]]);

    return ['id' => 0, 'slug' => null, 'stamp' => ''] + $profile;
}

/**
 * @return CodeBlockProProfile
 */
function code_block_pro_profile(string $slug): array
{
    foreach (array_unique([$slug, 'default']) as $candidate) {
        $post = code_block_pro_profile_post($candidate);
        $data = $post ? json_decode($post->post_content, true) : null;
        if ($post && is_array($data)) {
            // Two saves can land in the same second.
            $stamp = $post->post_modified_gmt . ' ' . md5($post->post_content);

            return ['id' => $post->ID, 'slug' => $post->post_name, 'stamp' => $stamp] + code_block_pro_sanitize_profile($data);
        }
    }

    // What the default profile is seeded with, so nothing changes when an admin's visit creates it.
    return ['id' => 0, 'slug' => 'default', 'stamp' => ''] + code_block_pro_sanitize_profile(code_block_pro_profile_from_1x((array) get_option('code_block_pro_settings', [])));
}

function code_block_pro_profile_post(string $slug): ?WP_Post
{
    if (!preg_match('/^[a-z0-9-]{1,200}$/', $slug)) {
        return null;
    }

    $posts = get_posts([
        'post_type' => CODE_BLOCK_PRO_PROFILE_TYPE,
        'name' => $slug,
        'post_status' => 'publish',
        'numberposts' => 1,
        // Two requests seeding at once can leave two; the first one stays the one in use.
        'orderby' => 'ID',
        'order' => 'ASC',
        'no_found_rows' => true,
        'suppress_filters' => true,
    ]);

    return $posts[0] ?? null;
}

/**
 * Creates the profile, or replaces the published one with that slug.
 *
 * @param array<mixed> $data
 */
function code_block_pro_insert_profile(string $slug, array $data, string $title = ''): int
{
    $existing = code_block_pro_profile_post($slug);
    $id = wp_insert_post(wp_slash([
        'ID' => $existing->ID ?? 0,
        'post_type' => CODE_BLOCK_PRO_PROFILE_TYPE,
        'post_status' => 'publish',
        'post_name' => $slug,
        'post_title' => $title ?: ($existing->post_title ?? $slug),
        'post_content' => code_block_pro_encode_profile($data),
    ]));

    return (int) $id;
}

/**
 * @param array<mixed> $data
 */
function code_block_pro_encode_profile(array $data): string
{
    // kses rewrites <, > and & for users without unfiltered_html; escaped, they survive it.
    $flags = JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_PRETTY_PRINT;

    return (string) wp_json_encode(code_block_pro_sanitize_profile($data), $flags);
}

add_filter('wp_insert_post_data', function ($data, $postarr) {
    if (($data['post_type'] ?? '') !== CODE_BLOCK_PRO_PROFILE_TYPE) {
        return $data;
    }

    $id = (int) ($postarr['ID'] ?? 0);
    $stored = $id ? get_post($id) : null;
    // Blocks forged requests, and users who can't edit this profile, from replacing it.
    $form = $_POST['cbp_profile'] ?? null;
    $nonce = $_POST['code_block_pro_profile_nonce'] ?? '';
    if (is_array($form) && $id && $id === (int) ($_POST['post_ID'] ?? 0) && is_string($nonce) && wp_verify_nonce($nonce, 'code_block_pro_profile') && current_user_can('edit_post', $id)) {
        $data['post_content'] = wp_slash((string) wp_json_encode(code_block_pro_profile_from_form(wp_unslash($form))));
    }

    $profile = json_decode(wp_unslash((string) $data['post_content']), true);
    if (!is_array($profile) && $stored && is_array(json_decode($stored->post_content, true))) {
        $data['post_content'] = wp_slash($stored->post_content);
    } elseif (!is_array($profile) || (int) ($profile['version'] ?? 1) <= 1) {
        $data['post_content'] = wp_slash(code_block_pro_encode_profile(is_array($profile) ? $profile : []));
    }
    // Anything else came from a newer release and stays whole, or a downgrade would drop what this one can't read.

    // Blocks name a profile by its slug, so a published one keeps it.
    if ($stored && $stored->post_status === 'publish' && $stored->post_name !== '') {
        $data['post_name'] = $stored->post_name;
    }
    // Every block whose profile is missing renders with this one.
    if ($stored && code_block_pro_is_default_profile($stored)) {
        $data['post_name'] = 'default';
        $data['post_status'] = 'publish';
    }
    // The slug becomes a class name; sanitize_title percent-encodes a title in Japanese, say.
    if ($data['post_name'] !== '' && !preg_match('/^[a-z0-9-]+(__trashed)?$/', $data['post_name'])) {
        $data['post_name'] = wp_unique_post_slug('p-' . substr(md5($data['post_name']), 0, 8), $id, $data['post_status'], CODE_BLOCK_PRO_PROFILE_TYPE, 0);
    }

    return $data;
}, 10, 2);

/**
 * @param WP_Post|null $post
 */
function code_block_pro_is_default_profile($post): bool
{
    if (!$post instanceof WP_Post || $post->post_type !== CODE_BLOCK_PRO_PROFILE_TYPE) {
        return false;
    }

    // By id too: trashing renames the post before any filter sees it.
    return $post->ID === (int) get_option('code_block_pro_default_profile') || $post->ID === code_block_pro_profile_post('default')?->ID;
}

// Blocks deleting default, which every block with a missing profile renders with.
add_filter('map_meta_cap', function ($caps, $cap, $userId, $args) {
    if ($cap === 'delete_post' && code_block_pro_is_default_profile(get_post((int) ($args[0] ?? 0)))) {
        $caps[] = 'do_not_allow';
    }

    return $caps;
}, 10, 4);

add_action('add_meta_boxes_' . CODE_BLOCK_PRO_PROFILE_TYPE, function () {
    remove_meta_box('slugdiv', CODE_BLOCK_PRO_PROFILE_TYPE, 'normal');
});

add_filter('pre_trash_post', function ($trash, $post) {
    return code_block_pro_is_default_profile($post) ? false : $trash;
}, 10, 2);

add_filter('pre_delete_post', function ($delete, $post) {
    return code_block_pro_is_default_profile($post) ? false : $delete;
}, 10, 2);

function code_block_pro_ensure_default_profile(): void
{
    if (code_block_pro_profile_post('default')) {
        return;
    }

    $existing = get_posts([
        'post_type' => CODE_BLOCK_PRO_PROFILE_TYPE,
        'post_name__in' => ['default', 'default__trashed'],
        'post_status' => 'any,trash',
        'numberposts' => 1,
        'orderby' => 'ID',
        'order' => 'ASC',
        'suppress_filters' => true,
    ]);
    if ($existing) {
        update_option('code_block_pro_default_profile', $existing[0]->ID);
        wp_update_post(['ID' => $existing[0]->ID, 'post_name' => 'default', 'post_status' => 'publish']);
        return;
    }

    $id = code_block_pro_insert_profile('default', code_block_pro_profile_from_1x((array) get_option('code_block_pro_settings', [])), __('Default', 'code-block-pro'));
    update_option('code_block_pro_default_profile', $id);
    // Revisions start at the first update, which would leave the seeded settings unrecoverable.
    wp_save_post_revision($id);
}

function code_block_pro_maybe_seed_default_profile(): void
{
    // Keeps visitors, who reach admin_init through admin-ajax.php and admin-post.php, from writing.
    if (current_user_can('edit_theme_options') && !wp_doing_ajax()) {
        code_block_pro_ensure_default_profile();
    }
}

/**
 * @param array<mixed> $settings 1.x's code_block_pro_settings option: the "previous*" values its editor remembered.
 * @return array<mixed>
 */
function code_block_pro_profile_from_1x(array $settings): array
{
    $profile = ['settings' => [], 'conditions' => [['id' => 'main', 'name' => __('Main', 'code-block-pro'), 'theme' => $settings['previousTheme'] ?? CODE_BLOCK_PRO_DEFAULT_THEME]]];
    foreach (array_keys(code_block_pro_profile_setting_defaults()) as $key) {
        if (isset($settings['previous' . ucfirst($key)])) {
            $profile['settings'][$key] = $settings['previous' . ucfirst($key)];
        }
    }
    // 1.x saved the label in the editor's language at the time; empty translates at render.
    $label = is_string($settings['previousCopyButtonString'] ?? null) ? $settings['previousCopyButtonString'] : '';
    $profile['buttons'] = ($settings['previousCopyButton'] ?? true) ? [[
        'type' => 'copy',
        'icon' => $settings['previousCopyButtonType'] ?? 'heroicons',
        'label' => in_array($label, ['Copy', __('Copy', 'code-block-pro')], true) ? '' : $label,
        'copiedLabel' => '',
    ]] : [];

    return $profile;
}

register_activation_hook(dirname(__DIR__) . '/code-block-pro.php', function () {
    // An inactive plugin's init hooks never ran.
    if (!post_type_exists(CODE_BLOCK_PRO_PROFILE_TYPE)) {
        code_block_pro_register_profile_type();
    }
    code_block_pro_ensure_default_profile();
});

add_action('admin_init', 'code_block_pro_maybe_seed_default_profile');
