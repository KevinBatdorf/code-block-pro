<?php

defined('ABSPATH') or die;

/**
 * Prismatic override - https://wordpress.org/plugins/prismatic/
 * This plugin encodes all <code> tags in the content, resulting in escaped html.
 * https://plugins.trac.wordpress.org/browser/prismatic/trunk/inc/prismatic-core.php#L59
 * Will monitor that plugin periodically and remove this override if it is updated.
 */
if (!class_exists('Prismatic')) {
    class Prismatic
    {
        public static function options_general()
        {
        }
        public static function options_advanced()
        {
        }
        public static function options_prism()
        {
        }
        public static function options_highlight()
        {
        }
        public static function options_plain()
        {
        }
    }
    function prismatic()
    {
    }
}
