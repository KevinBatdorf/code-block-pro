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
        /** @return void */
        public static function options_general()
        {
        }
        /** @return void */
        public static function options_advanced()
        {
        }
        /** @return void */
        public static function options_prism()
        {
        }
        /** @return void */
        public static function options_highlight()
        {
        }
        /** @return void */
        public static function options_plain()
        {
        }
    }
    /** @return void */
    function prismatic()
    {
    }
}
