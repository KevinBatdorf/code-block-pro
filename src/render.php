<?php

/**
 * @var array{version?: int, panes?: list<array{code?: string}>} $attributes
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
<div <?php echo get_block_wrapper_attributes(); ?>>
<?php foreach ($attributes['panes'] ?? [] as $pane) : ?>
    <pre><code><?php echo str_replace(['[', ']'], ['&#91;', '&#93;'], htmlspecialchars($pane['code'] ?? '', ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8')); ?></code></pre>
<?php endforeach; ?>
</div>
