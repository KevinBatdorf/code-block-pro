<?php

defined('ABSPATH') or die;

add_action('add_meta_boxes_' . CODE_BLOCK_PRO_PROFILE_TYPE, function (WP_Post $post) {
    add_meta_box('code-block-pro-profile', __('Profile', 'code-block-pro'), 'code_block_pro_profile_meta_box', null, 'normal', 'high');
});

/**
 * @return array<string, string> slug => label
 */
function code_block_pro_theme_choices(): array
{
    $slugs = array_map(fn ($file) => basename($file, '.json'), glob(dirname(__DIR__) . '/build/themes/*.json') ?: []);
    $slugs = array_values(array_unique([...$slugs, ...array_keys((array) apply_filters('blocks.codeBlockPro.themeFiles', []))]));

    return array_combine($slugs, $slugs);
}

/**
 * @param array<string, string> $choices value => label
 */
function code_block_pro_select(string $name, string $value, array $choices): string
{
    // A stored value missing from the choices (a theme pack switched off) would be lost on the next save.
    if (!isset($choices[$value]) && $value !== '') {
        /* translators: %s: a theme or option that is no longer available */
        $choices[$value] = sprintf(__('%s (not available)', 'code-block-pro'), $value);
    }
    $options = '';
    foreach ($choices as $choice => $label) {
        $options .= sprintf('<option value="%s"%s>%s</option>', esc_attr((string) $choice), selected($value, (string) $choice, false), esc_html($label));
    }

    return sprintf('<select name="%s">%s</select>', esc_attr($name), $options);
}

function code_block_pro_input(string $name, string $value, string $placeholder = ''): string
{
    return sprintf('<input type="text" name="%s" value="%s" placeholder="%s">', esc_attr($name), esc_attr($value), esc_attr($placeholder));
}

function code_block_pro_remove_box(string $name): string
{
    return '<input type="checkbox" name="' . esc_attr("{$name}[remove]") . '" value="1" aria-label="' . esc_attr__('Remove', 'code-block-pro') . '">';
}

/**
 * @param list<string> $headings
 */
function code_block_pro_table_head(array $headings): string
{
    return '<table class="widefat striped"><thead><tr>' . implode('', array_map(fn ($heading) => '<th>' . esc_html($heading) . '</th>', $headings)) . '</tr></thead><tbody>';
}

function code_block_pro_profile_meta_box(WP_Post $post): void
{
    $data = json_decode($post->post_content, true);
    // No fields, so no save from here can drop what this release can't read.
    if ((int) (is_array($data) ? $data['version'] ?? 1 : 1) > 1) {
        echo '<p>' . esc_html__('A newer version of Code Block Pro saved this profile. Update the plugin to edit it.', 'code-block-pro') . '</p>';
        return;
    }
    $profile = code_block_pro_sanitize_profile($data);
    $themes = code_block_pro_theme_choices();
    $field = 'cbp_profile';
    wp_nonce_field('code_block_pro_profile', 'code_block_pro_profile_nonce');

    if ($post->post_name) {
        /* translators: %s: the profile's slug */
        echo '<p>' . sprintf(esc_html__('Blocks name this profile %s.', 'code-block-pro'), '<code>' . esc_html($post->post_name) . '</code>') . '</p>';
    }

    echo '<h3>' . esc_html__('Themes', 'code-block-pro') . '</h3>';
    echo '<p>' . esc_html__('The first theme always applies. Each one after it takes over while its trigger is active; when several are active, the lowest one wins. A switch button on the block overrides them all.', 'code-block-pro') . '</p>';
    echo code_block_pro_table_head([__('Name', 'code-block-pro'), __('Theme', 'code-block-pro'), __('Trigger', 'code-block-pro'), __('Background', 'code-block-pro'), __('Remove', 'code-block-pro')]);
    $triggers = ['media' => __('Media query', 'code-block-pro'), 'class' => __('Class on the page', 'code-block-pro'), 'button' => __('Only a switch button', 'code-block-pro')];
    $backgrounds = ['theme' => __("Theme's", 'code-block-pro'), 'color' => __('Color', 'code-block-pro'), 'slot' => __('Empty, for a canvas', 'code-block-pro')];
    foreach ([...$profile['conditions'], null] as $i => $condition) {
        $name = "{$field}[conditions][$i]";
        echo '<tr><td>';
        echo code_block_pro_input("{$name}[name]", $condition['name'] ?? '', $condition ? '' : __('Add a theme', 'code-block-pro'));
        echo '<input type="hidden" name="' . esc_attr("{$name}[id]") . '" value="' . esc_attr($condition['id'] ?? '') . '">';
        echo '</td><td>' . code_block_pro_select("{$name}[theme]", $condition['theme'] ?? CODE_BLOCK_PRO_DEFAULT_THEME, $themes) . '</td><td>';
        if ($i === 0) {
            esc_html_e('Always', 'code-block-pro');
        } else {
            echo code_block_pro_select("{$name}[trigger][type]", $condition['trigger']['type'] ?? 'media', $triggers);
            echo code_block_pro_input("{$name}[trigger][value]", $condition['trigger']['value'] ?? '', '(prefers-color-scheme: dark)');
        }
        echo '</td><td>' . code_block_pro_select("{$name}[background][type]", $condition['background']['type'] ?? 'theme', $backgrounds);
        echo code_block_pro_input("{$name}[background][value]", $condition['background']['value'] ?? '', '#000000');
        echo '</td><td>' . ($i > 0 && $condition ? code_block_pro_remove_box($name) : '') . '</td></tr>';
    }
    echo '</tbody></table>';

    echo '<h3>' . esc_html__('Themes by language', 'code-block-pro') . '</h3>';
    echo code_block_pro_table_head([__('Language', 'code-block-pro'), __('For', 'code-block-pro'), __('Theme', 'code-block-pro'), __('Remove', 'code-block-pro')]);
    $conditions = array_column($profile['conditions'], 'name', 'id');
    $rows = [];
    foreach ($profile['languages'] as $language => $byCondition) {
        foreach ($byCondition as $id => $theme) {
            $rows[] = ['language' => $language, 'condition' => $id, 'theme' => $theme];
        }
    }
    foreach ([...$rows, null] as $i => $row) {
        $name = "{$field}[languages][$i]";
        echo '<tr><td>' . code_block_pro_input("{$name}[language]", $row['language'] ?? '', $row ? '' : 'php') . '</td>';
        echo '<td>' . code_block_pro_select("{$name}[condition]", $row['condition'] ?? '', $conditions) . '</td>';
        echo '<td>' . code_block_pro_select("{$name}[theme]", $row['theme'] ?? CODE_BLOCK_PRO_DEFAULT_THEME, $themes) . '</td>';
        echo '<td>' . ($row ? code_block_pro_remove_box($name) : '') . '</td></tr>';
    }
    echo '</tbody></table>';

    echo '<h3>' . esc_html__('Buttons', 'code-block-pro') . '</h3>';
    echo '<p>' . esc_html__('Leave a label empty to use the translated default.', 'code-block-pro') . '</p>';
    echo code_block_pro_table_head([__('Button', 'code-block-pro'), __('Event name', 'code-block-pro'), __('Label', 'code-block-pro'), __('Label once copied', 'code-block-pro'), __('Icon', 'code-block-pro'), __('Switches between', 'code-block-pro'), __('Remove', 'code-block-pro')]);
    $types = ['' => '—', 'copy' => __('Copy', 'code-block-pro'), 'toggle' => __('Switch theme', 'code-block-pro'), 'custom' => __('Custom event', 'code-block-pro')];
    $icons = ['heroicons' => __('Clipboard', 'code-block-pro'), 'twoSquares' => __('Two squares', 'code-block-pro'), 'textSimple' => __('Text', 'code-block-pro')];
    foreach ([...$profile['buttons'], null] as $i => $button) {
        $name = "{$field}[buttons][$i]";
        echo '<tr><td>' . code_block_pro_select("{$name}[type]", $button['type'] ?? '', $types) . '</td>';
        echo '<td>' . code_block_pro_input("{$name}[id]", $button['id'] ?? '') . '</td>';
        echo '<td>' . code_block_pro_input("{$name}[label]", $button['label'] ?? '') . '</td>';
        echo '<td>' . code_block_pro_input("{$name}[copiedLabel]", $button['copiedLabel'] ?? '') . '</td>';
        echo '<td>' . code_block_pro_select("{$name}[icon]", $button['icon'] ?? 'heroicons', $icons) . '</td><td>';
        echo '<select multiple name="' . esc_attr("{$name}[conditions][]") . '">';
        foreach ($conditions as $id => $label) {
            printf('<option value="%s"%s>%s</option>', esc_attr($id), selected(in_array($id, $button['conditions'] ?? [], true), true, false), esc_html($label));
        }
        echo '</select></td><td>' . ($button ? code_block_pro_remove_box($name) : '') . '</td></tr>';
    }
    echo '</tbody></table>';

    echo '<h3>' . esc_html__('Settings', 'code-block-pro') . '</h3><table class="form-table">';
    foreach ($profile['settings'] as $key => $value) {
        $name = "{$field}[settings][$key]";
        echo '<tr><th scope="row"><label for="' . esc_attr("cbp-$key") . '">' . esc_html($key) . '</label></th><td>';
        if (is_bool($value)) {
            echo '<input type="hidden" name="' . esc_attr($name) . '" value="0">';
            echo '<input type="checkbox" id="' . esc_attr("cbp-$key") . '" name="' . esc_attr($name) . '" value="1"' . checked($value, true, false) . '>';
        } else {
            echo '<input type="text" id="' . esc_attr("cbp-$key") . '" name="' . esc_attr($name) . '" value="' . esc_attr((string) $value) . '">';
        }
        echo '</td></tr>';
    }
    echo '</table>';
}

/**
 * @param array<mixed> $form The meta box's fields, unslashed.
 * @return array<mixed>
 */
function code_block_pro_profile_from_form(array $form): array
{
    $rows = function (string $key, string ...$required) use ($form): array {
        $kept = [];
        foreach (is_array($form[$key] ?? null) ? $form[$key] : [] as $row) {
            $filled = array_filter($required, fn ($field) => trim((string) ($row[$field] ?? '')) !== '');
            if (is_array($row) && empty($row['remove']) && $filled) {
                $kept[] = $row;
            }
        }

        return $kept;
    };

    // A saved theme keeps its id when renamed, so its classes and language themes stay attached.
    $conditions = array_map(function ($row) {
        return ['id' => ($row['id'] ?? '') ?: ($row['name'] ?? '')] + $row;
    }, $rows('conditions', 'id', 'name'));

    $languages = [];
    foreach ($rows('languages', 'language') as $row) {
        $languages[(string) $row['language']][(string) ($row['condition'] ?? '')] = $row['theme'] ?? '';
    }

    $settings = [];
    foreach (is_array($form['settings'] ?? null) ? $form['settings'] : [] as $key => $value) {
        $settings[$key] = is_bool(code_block_pro_profile_setting_defaults()[$key] ?? null) ? $value === '1' : $value;
    }

    return ['settings' => $settings, 'conditions' => $conditions, 'languages' => $languages, 'buttons' => $rows('buttons', 'type')];
}

/**
 * @param array<mixed> $form
 * @return list<string> Names of conditions whose media query or class was refused.
 */
function code_block_pro_refused_triggers(array $form): array
{
    $refused = [];
    foreach (array_slice(code_block_pro_profile_from_form($form)['conditions'], 1) as $condition) {
        $type = $condition['trigger']['type'] ?? '';
        if (in_array($type, ['media', 'class'], true) && code_block_pro_sanitize_trigger($condition['trigger'], 1)['type'] !== $type) {
            $refused[] = (string) ($condition['name'] ?? '');
        }
    }

    return $refused;
}

add_filter('redirect_post_location', function ($location, $id) {
    $form = $_POST['cbp_profile'] ?? null;
    if (get_post_type($id) !== CODE_BLOCK_PRO_PROFILE_TYPE || !is_array($form) || !code_block_pro_refused_triggers(wp_unslash($form))) {
        return $location;
    }

    return add_query_arg('cbp_refused', '1', $location);
}, 10, 2);

add_action('admin_notices', function () {
    $screen = get_current_screen();
    if (!$screen || $screen->post_type !== CODE_BLOCK_PRO_PROFILE_TYPE || empty($_GET['cbp_refused'])) {
        return;
    }
    echo '<div class="notice notice-error"><p>' . esc_html__('A trigger was not saved, so its theme now applies only when a switch button picks it. A media query may use letters, digits, spaces and : ( ) . , / < > = -. A class name starts with a letter, - or _.', 'code-block-pro') . '</p></div>';
});
