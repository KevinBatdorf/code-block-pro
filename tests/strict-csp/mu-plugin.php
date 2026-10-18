<?php

/**
 * Plugin Name: Code Block Pro strict CSP
 *
 * Refuses inline style attributes and style elements on the front end, so a
 * block colored through either one renders colorless.
 */

add_action('send_headers', function () {
    if (!is_admin()) {
        header("Content-Security-Policy: default-src 'self'; style-src 'self'");
    }
});
