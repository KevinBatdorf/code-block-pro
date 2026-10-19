<?php

/**
 * Plugin Name: Code Block Pro without mbregex
 *
 * Answers the capability check as a PHP built without mbregex would.
 */

add_filter('blocks.codeBlockPro.canUpgrade', '__return_false');
