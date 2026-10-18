<?php

class ProfileStyleTest extends WP_UnitTestCase
{
    public const NAME = 'kevinbatdorf/code-block-pro';

    public function set_up()
    {
        parent::set_up();
        code_block_pro_ensure_default_profile();
        $this->dequeue();
    }

    public function tear_down()
    {
        $this->dequeue();
        parent::tear_down();
    }

    private function dequeue()
    {
        foreach (array_keys(wp_styles()->registered) as $handle) {
            if (str_starts_with($handle, 'code-block-pro-')) {
                wp_dequeue_style($handle);
                wp_deregister_style($handle);
            }
        }
    }

    private function needsMbregex()
    {
        if (!function_exists('mb_ereg_search_init')) {
            $this->markTestSkipped('Highlighting needs mbregex.');
        }
    }

    private function block($attributes, $code = "// hi\nconst a = 'b';", $language = 'javascript')
    {
        $attributes += ['version' => 2, 'panes' => [['language' => $language, 'code' => htmlspecialchars($code, ENT_NOQUOTES)]]];

        return render_block(parse_blocks('<!-- wp:' . self::NAME . ' ' . serialize_block_attributes($attributes) . ' /-->')[0]);
    }

    private function twoTone($extra = [])
    {
        code_block_pro_insert_profile('twotone', $extra + ['conditions' => [
            ['id' => 'light', 'theme' => 'github-light'],
            ['id' => 'dark', 'theme' => 'dracula', 'trigger' => ['type' => 'media', 'value' => '(prefers-color-scheme: dark)']],
        ]]);

        return code_block_pro_profile('twotone');
    }

    /**
     * @return list<list<string>> each token's classes
     */
    private function tokens($html)
    {
        $doc = new DOMDocument();
        libxml_use_internal_errors(true);
        $doc->loadHTML('<?xml encoding="UTF-8">' . $html);
        libxml_clear_errors();
        $tokens = [];
        foreach ((new DOMXPath($doc))->query('//code/span[@class="line"]/span') as $span) {
            $tokens[] = explode(' ', $span->getAttribute('class'));
        }

        return $tokens;
    }

    private function pre($html)
    {
        $this->assertSame(1, preg_match('#<pre[^>]*>.*</pre>#s', $html, $match), $html);

        return $match[0];
    }

    public function test_a_one_condition_profile_renders_what_its_theme_renders_alone()
    {
        $this->needsMbregex();
        code_block_pro_insert_profile('docs', ['conditions' => [['id' => 'main', 'theme' => 'github-light']]]);

        $this->assertSame($this->pre($this->block(['profile' => '', 'theme' => 'github-light'])), $this->pre($this->block(['profile' => 'docs'])));
        $this->assertFalse(wp_style_is('code-block-pro-profile-docs', 'registered'));
    }

    public function test_every_token_names_one_color_per_further_condition()
    {
        $this->needsMbregex();
        $this->twoTone();

        $html = $this->block(['profile' => 'twotone']);

        $this->assertStringContainsString('<div class="cbp-pane cbp-theme-github-light cbp-dark-theme-dracula"><pre tabindex="0">', $html);
        $tokens = $this->tokens($html);
        $this->assertNotEmpty($tokens);
        foreach ($tokens as $classes) {
            $this->assertCount(1, preg_grep('/^cbp-dark-[0-9a-f]+$/', $classes), implode(' ', $classes));
        }
        $this->assertStringNotContainsString('style=', $html);
    }

    public function test_a_font_style_in_any_condition_is_named_in_every_further_one()
    {
        $this->needsMbregex();
        // github-light paints no comment italic; dracula has no italic keyword; monokai italicizes storage types.
        code_block_pro_insert_profile('fonts', ['conditions' => [
            ['id' => 'light', 'theme' => 'github-light'],
            ['id' => 'mono', 'theme' => 'monokai', 'trigger' => ['type' => 'class', 'value' => 'mono']],
            ['id' => 'dark', 'theme' => 'dracula', 'trigger' => ['type' => 'button']],
        ]]);

        $tokens = $this->tokens($this->block(['profile' => 'fonts'], 'function f(a) { return a; }'));
        $styled = array_filter($tokens, fn ($classes) => preg_grep('/^cbp-(mono|dark)-font[1-9]/', $classes));

        $this->assertNotEmpty($styled);
        foreach ($styled as $classes) {
            $this->assertCount(1, preg_grep('/^cbp-mono-font\d+$/', $classes), implode(' ', $classes));
            $this->assertCount(1, preg_grep('/^cbp-dark-font\d+$/', $classes), implode(' ', $classes));
        }
    }

    public function test_the_profile_stylesheet_has_a_rule_for_every_class_the_markup_uses()
    {
        $this->needsMbregex();
        $profile = $this->twoTone(['languages' => ['php' => ['dark' => 'monokai']]]);
        $html = $this->block(['profile' => 'twotone']) . $this->block(['profile' => 'twotone'], "<?php\n// hi\n\$a = 'b';", 'php');

        $css = code_block_pro_profile_css($profile);

        preg_match_all('/\bcbp-dark-[a-z0-9-]+/', $html, $classes);
        $this->assertNotEmpty($classes[0]);
        foreach (array_unique($classes[0]) as $class) {
            $this->assertMatchesRegularExpression('/\.cbp-profile-twotone:where\(\[data-cbp-condition~="dark"\]\) (:is\([^)]*\) )?(span)?\.' . preg_quote($class, '/') . '[{ ]/', $css, $class);
        }
        $this->assertStringContainsString('cbp-dark-theme-monokai', $html);
    }

    public function test_each_trigger_scopes_its_condition()
    {
        code_block_pro_insert_profile('triggers', ['conditions' => [
            ['id' => 'main', 'theme' => 'github-light'],
            ['id' => 'dark', 'theme' => 'dracula', 'trigger' => ['type' => 'media', 'value' => '(prefers-color-scheme: dark)']],
            ['id' => 'funky', 'theme' => 'monokai', 'trigger' => ['type' => 'class', 'value' => 'is-funky']],
            ['id' => 'contrast', 'theme' => 'nord', 'trigger' => ['type' => 'button']],
        ]]);

        $css = code_block_pro_profile_css(code_block_pro_profile('triggers'));

        $untouched = ':where(:not([data-cbp-condition]))';
        $this->assertStringContainsString("@media (prefers-color-scheme: dark){.cbp-profile-triggers$untouched .cbp-dark-", $css);
        $this->assertStringContainsString(":where(.is-funky) .cbp-profile-triggers$untouched .cbp-funky-", $css);
        $this->assertStringNotContainsString("$untouched .cbp-contrast-", $css);
        $this->assertStringNotContainsString('cbp-main-', $css);
        $this->assertLessThan(strpos($css, '.cbp-funky-'), strpos($css, '.cbp-dark-'));
        $this->assertLessThan(strpos($css, '.cbp-contrast-'), strpos($css, '.cbp-funky-'));
    }

    public function test_a_condition_named_on_the_block_overrides_every_trigger()
    {
        code_block_pro_insert_profile('triggers', ['conditions' => [
            ['id' => 'main', 'theme' => 'github-light'],
            ['id' => 'dark', 'theme' => 'dracula', 'trigger' => ['type' => 'media', 'value' => '(prefers-color-scheme: dark)']],
            ['id' => 'funky', 'theme' => 'monokai', 'trigger' => ['type' => 'class', 'value' => 'is-funky']],
        ]]);

        $css = code_block_pro_profile_css(code_block_pro_profile('triggers'));

        foreach (['dark', 'funky'] as $id) {
            $this->assertStringContainsString(".cbp-profile-triggers:where([data-cbp-condition~=\"$id\"]) .cbp-$id-theme-", $css);
            $this->assertStringContainsString(".cbp-profile-triggers:where([data-cbp-condition~=\"$id\"]) :is(.cbp-$id-theme-", $css);
        }
    }

    public function test_condition_rules_apply_only_under_a_theme_the_condition_uses()
    {
        $css = code_block_pro_profile_css($this->twoTone(['languages' => ['php' => ['dark' => 'monokai']]]));

        preg_match_all('/^[^@{]*\.cbp-dark-[0-9a-f]+\{/m', $css, $rules);
        $this->assertNotEmpty($rules[0]);
        foreach ($rules[0] as $rule) {
            $this->assertStringContainsString(':is(.cbp-dark-theme-dracula,.cbp-dark-theme-monokai) ', $rule);
        }
    }

    public function test_a_condition_background_replaces_its_theme_background()
    {
        $css = code_block_pro_profile_css($this->twoTone(['conditions' => [
            ['id' => 'light', 'theme' => 'github-light', 'background' => ['type' => 'color', 'value' => '#fafafa']],
            ['id' => 'dark', 'theme' => 'dracula', 'trigger' => ['type' => 'class', 'value' => 'dark'], 'background' => ['type' => 'color', 'value' => '#000000']],
        ]]));

        $this->assertStringContainsString('.cbp-profile-twotone :is(.cbp-theme-github-light){background-color:#fafafa;--cbp-bg:#fafafa}', $css);
        $this->assertMatchesRegularExpression('/\.cbp-profile-twotone:where\(\[data-cbp-condition~="dark"\]\) \.cbp-dark-theme-dracula\{color:#[0-9a-f]+;background-color:#000000;--cbp-fg:#[0-9a-f]+;--cbp-bg:#000000\}/', $css);
    }

    public function test_a_slot_background_leaves_a_place_for_a_canvas()
    {
        $profile = $this->twoTone(['conditions' => [
            ['id' => 'light', 'theme' => 'github-light'],
            ['id' => 'fun', 'theme' => 'dracula', 'trigger' => ['type' => 'button'], 'background' => ['type' => 'slot']],
        ]]);

        $html = $this->block(['profile' => 'twotone']);
        $css = code_block_pro_profile_css($profile);

        $this->assertStringContainsString('<span class="cbp-background" data-cbp-condition="fun" aria-hidden="true"></span>', $html);
        $this->assertStringContainsString('.cbp-profile-twotone .cbp-background{position:absolute;inset:0;pointer-events:none;display:none}', $css);
        $this->assertStringContainsString('.cbp-profile-twotone:where([data-cbp-condition~="fun"]) .cbp-background:where([data-cbp-condition="fun"]){display:block}', $css);
        $this->assertStringContainsString('.cbp-profile-twotone:where([data-cbp-condition~="fun"]) .cbp-background{display:none}', $css);
        $this->assertStringContainsString('background-color:transparent', $css);
    }

    public function test_the_profile_stylesheet_loads_from_a_url_and_never_inline()
    {
        $profile = $this->twoTone();

        $this->block(['profile' => 'twotone']);

        $style = wp_styles()->registered['code-block-pro-profile-twotone'];
        $this->assertTrue(wp_style_is('code-block-pro-profile-twotone', 'enqueued'));
        $this->assertSame(add_query_arg('code-block-pro-profile', 'twotone', home_url('/')), $style->src);
        $this->assertSame(code_block_pro_profile_style_version($profile), $style->ver);
        $this->assertFalse(wp_styles()->get_data('code-block-pro-profile-twotone', 'path'));
        $this->assertFalse(wp_styles()->get_data('code-block-pro-profile-twotone', 'after'));
    }

    public function test_the_stylesheet_url_serves_css_for_published_profiles_only()
    {
        $profile = $this->twoTone();
        $draft = code_block_pro_insert_profile('draft', $profile);
        wp_update_post(['ID' => $draft, 'post_status' => 'draft']);

        $fresh = code_block_pro_profile_style_response('twotone', code_block_pro_profile_style_version($profile));
        $stale = code_block_pro_profile_style_response('twotone', 'old');

        $this->assertSame(200, $fresh['status']);
        $this->assertSame('text/css; charset=UTF-8', $fresh['headers']['Content-Type']);
        $this->assertStringContainsString('immutable', $fresh['headers']['Cache-Control']);
        $this->assertSame(code_block_pro_profile_css($profile), $fresh['body']);
        $this->assertStringNotContainsString('immutable', $stale['headers']['Cache-Control']);
        $this->assertSame(404, code_block_pro_profile_style_response('draft', '')['status']);
        $this->assertSame(404, code_block_pro_profile_style_response('nope', '')['status']);
        $this->assertSame(404, code_block_pro_profile_style_response('../x', '')['status']);
    }

    public function test_the_stylesheet_version_changes_when_the_profile_is_edited()
    {
        $before = code_block_pro_profile_style_version($this->twoTone());

        // Same themes, so only the profile's own stamp can change the version.
        $this->twoTone(['conditions' => [
            ['id' => 'light', 'theme' => 'github-light'],
            ['id' => 'dark', 'theme' => 'dracula', 'trigger' => ['type' => 'media', 'value' => '(min-width: 1px)']],
        ]]);

        $this->assertNotSame($before, code_block_pro_profile_style_version(code_block_pro_profile('twotone')));
    }

    public function test_a_filter_theme_in_a_profile_with_conditions_is_colored_by_class()
    {
        $this->needsMbregex();
        $file = wp_tempnam('cbp-theme') . '.json';
        copy(dirname(__DIR__, 2) . '/build/themes/nord.json', $file);
        add_filter('blocks.codeBlockPro.themeFiles', function ($themes) use ($file) {
            return $themes + ['third-party' => $file];
        });
        $profile = $this->twoTone(['conditions' => [
            ['id' => 'main', 'theme' => 'third-party'],
            ['id' => 'dark', 'theme' => 'dracula', 'trigger' => ['type' => 'button']],
        ]]);

        $html = $this->block(['profile' => 'twotone']);
        $css = code_block_pro_profile_css($profile);

        $this->assertStringNotContainsString('style=', $html);
        $this->assertStringContainsString('cbp-theme-third-party', $html);
        $this->assertStringContainsString('.cbp-theme-third-party{color:', $css);
        $this->assertStringContainsString('.cbp-81a1c1{color:#81a1c1}', $css);
    }

    public function test_without_mbregex_every_condition_still_colors_the_plain_text()
    {
        add_filter('blocks.codeBlockPro.canUpgrade', '__return_false');
        $this->twoTone();

        $html = $this->block(['profile' => 'twotone']);

        $this->assertStringContainsString('<div class="cbp-pane cbp-theme-github-light cbp-dark-theme-dracula"><pre tabindex="0">', $html);
        $this->assertStringContainsString('.cbp-profile-twotone:where([data-cbp-condition~="dark"]) .cbp-dark-theme-dracula code{color:', code_block_pro_profile_css(code_block_pro_profile('twotone')));
    }

    public function test_further_conditions_load_no_stylesheet_of_their_own_theme()
    {
        $this->twoTone();

        $this->block(['profile' => 'twotone']);

        $this->assertTrue(wp_style_is('code-block-pro-theme-github-light', 'enqueued'));
        $this->assertFalse(wp_style_is('code-block-pro-theme-dracula', 'enqueued'));
    }

    public function test_a_filter_theme_in_a_one_condition_profile_is_colored_by_class()
    {
        $this->needsMbregex();
        $file = wp_tempnam('cbp-theme') . '.json';
        copy(dirname(__DIR__, 2) . '/build/themes/nord.json', $file);
        add_filter('blocks.codeBlockPro.themeFiles', function ($themes) use ($file) {
            return $themes + ['pack-theme' => $file];
        });
        code_block_pro_insert_profile('packed', ['conditions' => [['id' => 'main', 'theme' => 'pack-theme']]]);

        $html = $this->block(['profile' => 'packed']);

        $this->assertStringNotContainsString('style=', $html);
        $this->assertTrue(wp_style_is('code-block-pro-profile-packed', 'enqueued'));
        $this->assertStringContainsString('.cbp-theme-pack-theme{color:', code_block_pro_profile_css(code_block_pro_profile('packed')));
    }

    public function test_saving_a_profile_stores_its_stylesheet_for_visitors()
    {
        $profile = $this->twoTone();
        $version = code_block_pro_profile_style_version($profile);

        $response = code_block_pro_stored_profile_style_response('twotone', $version, '');

        $this->assertSame(200, $response['status']);
        $this->assertSame(code_block_pro_profile_css($profile), $response['body']);
        $this->assertStringContainsString('immutable', $response['headers']['Cache-Control']);
        $this->assertSame(304, code_block_pro_stored_profile_style_response('twotone', $version, $response['headers']['ETag'])['status']);
    }

    public function test_a_stored_stylesheet_is_not_served_for_a_version_a_theme_file_change_made()
    {
        $file = wp_tempnam('cbp-theme') . '.json';
        copy(dirname(__DIR__, 2) . '/build/themes/nord.json', $file);
        add_filter('blocks.codeBlockPro.themeFiles', function ($themes) use ($file) {
            return $themes + ['pack-theme' => $file];
        });
        $profile = $this->twoTone(['conditions' => [['id' => 'main', 'theme' => 'pack-theme'], ['id' => 'dark', 'theme' => 'dracula', 'trigger' => ['type' => 'button']]]]);
        $this->assertNotNull(code_block_pro_stored_profile_style_response('twotone', code_block_pro_profile_style_version($profile), ''));

        touch($file, time() + 10);
        clearstatcache();

        $this->assertNull(code_block_pro_stored_profile_style_response('twotone', code_block_pro_profile_style_version($profile), ''));
    }

    public function test_a_theme_pack_switched_on_after_saving_gets_its_rules_from_the_live_stylesheet()
    {
        $this->twoTone(['conditions' => [['id' => 'main', 'theme' => 'github-light'], ['id' => 'dark', 'theme' => 'pack-theme', 'trigger' => ['type' => 'button']]]]);
        $file = wp_tempnam('cbp-theme') . '.json';
        copy(dirname(__DIR__, 2) . '/build/themes/monokai.json', $file);
        add_filter('blocks.codeBlockPro.themeFiles', function ($themes) use ($file) {
            return $themes + ['pack-theme' => $file];
        });
        $version = code_block_pro_profile_style_version(code_block_pro_profile('twotone'));

        $live = code_block_pro_profile_style_response('twotone', $version);

        $this->assertNull(code_block_pro_stored_profile_style_response('twotone', $version, ''));
        $this->assertStringContainsString('.cbp-dark-theme-pack-theme{', $live['body']);
        $this->assertStringContainsString('immutable', $live['headers']['Cache-Control']);
    }

    public function test_the_built_in_default_serves_its_stylesheet_before_the_default_post_exists()
    {
        $file = wp_tempnam('cbp-theme') . '.json';
        copy(dirname(__DIR__, 2) . '/build/themes/nord.json', $file);
        add_filter('blocks.codeBlockPro.themeFiles', function ($themes) use ($file) {
            return $themes + ['pack-theme' => $file];
        });
        remove_all_filters('pre_delete_post');
        wp_delete_post(get_page_by_path('default', OBJECT, 'cbp_profile')->ID, true);
        update_option('code_block_pro_settings', ['previousTheme' => 'pack-theme']);

        $response = code_block_pro_profile_style_response('default', '');

        $this->assertSame(200, $response['status']);
        $this->assertStringContainsString('.cbp-theme-pack-theme{color:', $response['body']);
    }

    /**
     * @dataProvider leavingPublish
     */
    public function test_a_profile_that_is_no_longer_published_has_no_stored_stylesheet($leave)
    {
        $profile = $this->twoTone();
        $version = code_block_pro_profile_style_version($profile);
        $this->assertNotNull(code_block_pro_stored_profile_style_response('twotone', $version, ''));

        $leave($profile['id']);

        $this->assertNull(code_block_pro_stored_profile_style_response('twotone', $version, ''));
        $this->assertSame(404, code_block_pro_profile_style_response('twotone', $version)['status']);
    }

    public static function leavingPublish()
    {
        return [
            'drafted' => [fn ($id) => wp_update_post(['ID' => $id, 'post_status' => 'draft'])],
            'trashed' => [fn ($id) => wp_trash_post($id)],
            'deleted' => [fn ($id) => wp_delete_post($id, true)],
        ];
    }

    public function test_requests_for_profiles_that_do_not_exist_leave_no_trace_in_the_options_cache()
    {
        $this->twoTone();
        code_block_pro_stored_profile_style_response('warm-up', 'x', '');
        $before = count((array) wp_cache_get('notoptions', 'options'));

        foreach (range(1, 20) as $n) {
            code_block_pro_stored_profile_style_response("nope-$n", 'x', '');
        }

        $this->assertSame($before, count((array) wp_cache_get('notoptions', 'options')));
    }
}
