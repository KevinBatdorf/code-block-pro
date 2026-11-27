<?php

// Playground ships mbregex, so a parameter stands in for a server we can't run.
add_filter('blocks.codeBlockPro.canUpgrade', function ($canUpgrade) {
	return isset($_GET['cbp_no_mbregex']) ? false : $canUpgrade;
});

// Stands in for logging in as an author, who can't update plugins.
add_filter('user_has_cap', function ($allcaps) {
	if (isset($_GET['cbp_cannot_update'])) {
		$allcaps['update_plugins'] = false;
	}
	return $allcaps;
});
