<?php

/**
 * @var array{version?: int, theme?: string, profile?: string, panes?: list<array{language?: string, code?: string}>} $attributes
 * @var string $content
 */

defined('ABSPATH') or die;

if (!isset($attributes['version'])) {
    wp_enqueue_script('kevinbatdorf-code-block-pro-view-script');
    wp_enqueue_style('kevinbatdorf-code-block-pro-style');
    echo $content;
    return;
}

$profile = code_block_pro_block_profile($attributes);
code_block_pro_enqueue_profile_style($profile);
$class = $profile['slug'] === null ? 'cbp-block' : "cbp-block cbp-profile-{$profile['slug']}";
?>
<div <?php echo get_block_wrapper_attributes(['class' => $class]); ?>>
<?php foreach ($profile['conditions'] as $condition) : ?>
    <?php if ($condition['background']['type'] === 'slot') : ?>
    <span class="cbp-background" data-cbp-condition="<?php echo esc_attr($condition['id']); ?>" aria-hidden="true"></span>
    <?php endif; ?>
<?php endforeach; ?>
<?php foreach ($attributes['panes'] ?? [] as $pane) : ?>
    <?php
    // Undoes the editor's encode().
    $code = strtr($pane['code'] ?? '', ['&amp;' => '&', '&lt;' => '<', '&gt;' => '>']);
        echo code_block_pro_highlight($code, $pane['language'] ?? '', $profile);
        ?>
<?php endforeach; ?>
</div>
