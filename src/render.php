<?php

/**
 * @var array{version?: int, theme?: string, panes?: list<array{language?: string, code?: string}>} $attributes
 * @var string $content
 */

defined('ABSPATH') or die;

if (!isset($attributes['version'])) {
    wp_enqueue_script('kevinbatdorf-code-block-pro-view-script');
    wp_enqueue_style('kevinbatdorf-code-block-pro-style');
    echo $content;
    return;
}
?>
<div <?php echo get_block_wrapper_attributes(['class' => 'cbp-block']); ?>>
<?php foreach ($attributes['panes'] ?? [] as $pane) : ?>
    <?php
    // Undoes the editor's encode().
    $code = strtr($pane['code'] ?? '', ['&amp;' => '&', '&lt;' => '<', '&gt;' => '>']);
    echo code_block_pro_highlight($code, $pane['language'] ?? '', $attributes['theme'] ?? 'nord');
    ?>
<?php endforeach; ?>
</div>
