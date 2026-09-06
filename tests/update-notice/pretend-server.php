<?php

// Playground ships mbregex, so a parameter stands in for a server we can't run.
add_filter('blocks.codeBlockPro.canUpgrade', function ($canUpgrade) {
	return isset($_GET['cbp_no_mbregex']) ? false : $canUpgrade;
});
