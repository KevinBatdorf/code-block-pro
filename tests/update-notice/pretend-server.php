<?php

// Playground ships mbregex and a current PHP, so parameters stand in for servers we can't run.
add_filter('blocks.codeBlockPro.canHighlight', function ($canHighlight) {
	return isset($_GET['cbp_no_mbregex']) ? false : $canHighlight;
});

add_filter('blocks.codeBlockPro.hasNextPhp', function ($hasNextPhp) {
	return isset($_GET['cbp_old_php']) ? false : $hasNextPhp;
});
