<?php
/**
 * A block that renders a gallery, plus the shortcode fallback.
 */
add_shortcode('cbp_demo', function (array $atts = []): string {
	$atts = shortcode_atts(['ids' => ''], $atts, 'cbp_demo');
	if ($atts['ids'] === '') {
		return '<p>Nothing to show. Try [gallery ids="1,2,3"] instead.</p>';
	}
	return do_shortcode('[gallery ids="' . esc_attr($atts['ids']) . '"]');
});

echo apply_filters('the_content', '[cbp_demo ids="4,5,6"]');
?>
