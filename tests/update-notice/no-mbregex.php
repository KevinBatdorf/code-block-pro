<?php

// Playground ships mbregex, so a request parameter stands in for a build without it.
add_filter('blocks.codeBlockPro.canHighlight', function ($canHighlight) {
	return isset($_GET['cbp_no_mbregex']) ? false : $canHighlight;
});
