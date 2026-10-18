<!doctype html>
<html <?php language_attributes(); ?>>
<head>
	<meta charset="<?php bloginfo('charset'); ?>">
	<?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<main>
	<?php
    while (have_posts()) {
        the_post();
        the_content();
    }
?>
</main>
<?php wp_footer(); ?>
</body>
</html>
