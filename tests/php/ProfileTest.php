<?php

class ProfileTest extends WP_UnitTestCase
{
    public const NAME = 'kevinbatdorf/code-block-pro';

    public function set_up()
    {
        parent::set_up();
        // These cover the conditions and triggers only the Theme Pack turns on.
        add_filter('blocks.codeBlockPro.customConditions', '__return_true');
        code_block_pro_ensure_default_profile();
        $this->dequeueThemes();
    }

    public function tear_down()
    {
        $this->dequeueThemes();
        parent::tear_down();
    }

    private function dequeueThemes()
    {
        foreach (array_keys(wp_styles()->registered) as $handle) {
            if (str_starts_with($handle, 'code-block-pro-')) {
                wp_dequeue_style($handle);
            }
        }
    }

    private function block($attributes, $code = 'const a = 1;', $language = 'javascript')
    {
        $attributes += ['version' => 2, 'panes' => [['language' => $language, 'code' => $code]]];

        return render_block(parse_blocks('<!-- wp:' . self::NAME . ' ' . serialize_block_attributes($attributes) . ' /-->')[0]);
    }

    private function profile($slug, $data, $status = 'publish')
    {
        $id = code_block_pro_insert_profile($slug, $data);
        if ($status !== 'publish') {
            wp_update_post(['ID' => $id, 'post_status' => $status]);
        }

        return $id;
    }

    private function defaultPost()
    {
        return get_page_by_path('default', OBJECT, 'cbp_profile');
    }

    private function deleteDefault()
    {
        remove_all_filters('pre_delete_post');
        wp_delete_post($this->defaultPost()->ID, true);
    }

    private function asAdmin()
    {
        wp_set_current_user(self::factory()->user->create(['role' => 'administrator']));
    }

    public function test_only_users_who_can_edit_the_site_design_can_change_profiles()
    {
        $id = $this->defaultPost()->ID;

        wp_set_current_user(self::factory()->user->create(['role' => 'editor']));
        $this->assertFalse(current_user_can('edit_post', $id));
        $this->assertFalse(current_user_can('delete_post', $id));
        $this->assertFalse(current_user_can(get_post_type_object('cbp_profile')->cap->create_posts));

        $this->asAdmin();
        $this->assertTrue(current_user_can('edit_post', $id));
        $this->assertFalse(is_post_type_viewable('cbp_profile'));
    }

    public function test_a_block_renders_with_the_profile_it_names()
    {
        $this->profile('docs', ['conditions' => [['id' => 'main', 'theme' => 'dracula']]]);

        $html = $this->block(['profile' => 'docs', 'theme' => 'github-light']);

        $this->assertStringContainsString('cbp-theme-dracula', $html);
        $this->assertStringContainsString('cbp-profile-docs', $html);
    }

    public function test_a_block_whose_profile_is_gone_renders_with_default()
    {
        code_block_pro_insert_profile('default', ['conditions' => [['id' => 'main', 'theme' => 'monokai']]]);
        $this->profile('trashed', ['conditions' => [['id' => 'main', 'theme' => 'dracula']]], 'trash');
        $this->profile('draft', ['conditions' => [['id' => 'main', 'theme' => 'dracula']]], 'draft');

        foreach (['never-existed', 'trashed', 'draft'] as $slug) {
            $html = $this->block(['profile' => $slug]);

            $this->assertStringContainsString('cbp-theme-monokai', $html, $slug);
            $this->assertStringContainsString('cbp-profile-default', $html, $slug);
        }
    }

    public function test_a_block_that_names_no_profile_renders_with_default()
    {
        code_block_pro_insert_profile('default', ['conditions' => [['id' => 'main', 'theme' => 'monokai']]]);

        $html = $this->block(['theme' => 'github-light']);

        $this->assertStringContainsString('cbp-theme-monokai', $html);
        $this->assertStringContainsString('cbp-profile-default', $html);
    }

    public function test_a_freeflow_block_uses_its_own_theme()
    {
        code_block_pro_insert_profile('default', ['conditions' => [['id' => 'main', 'theme' => 'monokai']]]);

        $html = $this->block(['profile' => '', 'theme' => 'github-light']);

        $this->assertStringContainsString('cbp-theme-github-light', $html);
        $this->assertStringNotContainsString('cbp-profile-', $html);
    }

    public function test_without_a_default_profile_a_block_renders_with_the_built_in_one_and_writes_nothing()
    {
        $this->deleteDefault();
        $writes = [];
        add_filter('query', function ($query) use (&$writes) {
            if (preg_match('/^\s*(INSERT|UPDATE|DELETE|REPLACE)\b/i', $query) && !str_contains($query, '_transient_')) {
                $writes[] = $query;
            }

            return $query;
        });

        update_option('code_block_pro_settings', ['previousTheme' => 'dracula']);
        $writes = [];

        $html = $this->block(['profile' => 'default']);

        $this->assertStringContainsString('cbp-theme-dracula', $html);
        $this->assertSame([], $writes);
        $this->assertNull($this->defaultPost());
    }

    public function test_activation_creates_the_default_profile()
    {
        $this->deleteDefault();

        do_action('activate_' . CODE_BLOCK_PRO_BASENAME);

        $this->assertSame('publish', $this->defaultPost()->post_status);
    }

    public function test_a_site_without_1x_settings_starts_on_dracula()
    {
        $this->deleteDefault();
        delete_option('code_block_pro_settings');

        do_action('activate_' . CODE_BLOCK_PRO_BASENAME);

        $this->assertSame('dracula', code_block_pro_profile('default')['conditions'][0]['theme']);
    }

    public function test_the_shipped_default_profile_is_a_complete_profile_file()
    {
        $file = code_block_pro_default_profile_data();
        $profile = array_intersect_key($file, array_flip(['version', 'settings', 'conditions', 'languages', 'buttons']));

        $this->assertSame('code-block-pro-profile', $file['type']);
        $this->assertSame(code_block_pro_sanitize_profile($file), $profile);
    }

    public function test_a_site_without_1x_settings_starts_from_the_shipped_default()
    {
        $this->deleteDefault();
        delete_option('code_block_pro_settings');

        code_block_pro_ensure_default_profile();
        $profile = code_block_pro_profile('default');

        $this->assertSame(code_block_pro_sanitize_profile(code_block_pro_default_profile_data())['buttons'], $profile['buttons']);
        $this->assertSame(code_block_pro_sanitize_profile(code_block_pro_default_profile_data())['settings'], $profile['settings']);
    }

    public function test_the_default_profile_is_recreated_when_missing()
    {
        $this->deleteDefault();

        // Core's own admin_init callbacks send headers.
        $this->assertNotFalse(has_action('admin_init', 'code_block_pro_maybe_seed_default_profile'));
        $this->asAdmin();
        code_block_pro_maybe_seed_default_profile();

        $this->assertSame('publish', $this->defaultPost()->post_status);
    }

    public function test_a_visitor_never_creates_the_default_profile()
    {
        $this->deleteDefault();

        wp_set_current_user(0);
        code_block_pro_maybe_seed_default_profile();
        $this->asAdmin();
        add_filter('wp_doing_ajax', '__return_true');
        code_block_pro_maybe_seed_default_profile();

        $this->assertNull($this->defaultPost());
    }

    public function test_an_unpublished_default_profile_is_republished_rather_than_duplicated()
    {
        $id = $this->defaultPost()->ID;
        global $wpdb;
        $wpdb->update($wpdb->posts, ['post_status' => 'draft'], ['ID' => $id]);
        clean_post_cache($id);

        code_block_pro_ensure_default_profile();

        $this->assertSame($id, $this->defaultPost()->ID);
        $this->assertSame('publish', get_post_status($id));
        $this->assertCount(1, get_posts(['post_type' => 'cbp_profile', 'post_status' => 'any', 'numberposts' => -1]));
    }

    public function test_the_seeded_default_profile_can_be_restored_from_its_revisions()
    {
        $this->deleteDefault();

        code_block_pro_ensure_default_profile();

        $this->assertCount(1, wp_get_post_revisions($this->defaultPost()->ID));
    }

    public function test_the_default_profile_starts_from_the_settings_1x_remembered()
    {
        $this->deleteDefault();
        update_option('code_block_pro_settings', [
            'previousTheme' => 'dracula',
            'previousFontSize' => '1rem',
            'previousLineNumbers' => true,
            'previousCopyButton' => false,
        ]);

        code_block_pro_ensure_default_profile();
        $profile = code_block_pro_profile('default');

        $this->assertSame('dracula', $profile['conditions'][0]['theme']);
        $this->assertSame('1rem', $profile['settings']['fontSize']);
        $this->assertTrue($profile['settings']['lineNumbers']);
        $this->assertSame([], array_filter($profile['buttons'], fn ($button) => $button['type'] === 'copy'));
    }

    public function test_copy_text_1x_saved_untranslated_is_left_to_translate_at_render()
    {
        $this->deleteDefault();
        update_option('code_block_pro_settings', ['previousCopyButton' => true, 'previousCopyButtonType' => 'twoSquares', 'previousCopyButtonString' => 'Copy']);

        code_block_pro_ensure_default_profile();

        $this->assertSame([['type' => 'copy', 'icon' => 'twoSquares', 'label' => '', 'copiedLabel' => '']], code_block_pro_profile('default')['buttons']);
    }

    public function test_settings_from_1x_cannot_carry_markup_into_the_default_profile()
    {
        $this->deleteDefault();
        // Any contributor could write this option in 1.x.
        update_option('code_block_pro_settings', ['previousSeeMoreString' => '<img src=x onerror=alert(1)>More', 'previousFontFamily' => 'a{} body{display:none']);

        code_block_pro_ensure_default_profile();
        $settings = code_block_pro_profile('default')['settings'];

        $this->assertSame('More', $settings['seeMoreString']);
        $this->assertSame('Code-Pro-JetBrains-Mono', $settings['fontFamily']);
    }

    /**
     * @dataProvider cssValues
     */
    public function test_settings_bound_for_a_stylesheet_cannot_break_out_of_it($given, $expected)
    {
        $this->assertSame($expected, code_block_pro_sanitize_profile(['settings' => ['fontFamily' => $given]])['settings']['fontFamily']);
    }

    public static function cssValues()
    {
        return [
            'a font stack' => ['"Fira Code", monospace', '"Fira Code", monospace'],
            'an unclosed quote' => ['"Fira Code, monospace', 'Code-Pro-JetBrains-Mono'],
            'an unclosed paren' => ['var(--font', 'Code-Pro-JetBrains-Mono'],
            'a comment' => ['mono /* x', 'Code-Pro-JetBrains-Mono'],
            'a brace' => ['mono} body{x', 'Code-Pro-JetBrains-Mono'],
            'a paren closed only inside a string' => ['( ")"', 'Code-Pro-JetBrains-Mono'],
            'quotes that pair across each other' => ['\'"\'"', 'Code-Pro-JetBrains-Mono'],
            'a paren inside a string' => ['"a)b", mono', '"a)b", mono'],
        ];
    }

    public function test_the_default_profile_cannot_be_trashed_or_deleted()
    {
        $id = $this->defaultPost()->ID;
        $this->asAdmin();

        $this->assertFalse(current_user_can('delete_post', $id));
        $this->assertFalse(wp_trash_post($id));
        $this->assertFalse(wp_delete_post($id, true));
        $this->assertSame('publish', get_post_status($id));
    }

    public function test_other_profiles_can_be_trashed()
    {
        $id = $this->profile('docs', []);

        $this->assertNotFalse(wp_trash_post($id));
    }

    public function test_a_language_picks_its_own_theme_before_the_condition_default()
    {
        $this->profile('docs', [
            'conditions' => [['id' => 'main', 'theme' => 'github-light']],
            'languages' => ['php' => ['main' => 'monokai']],
        ]);

        $this->assertStringContainsString('cbp-theme-monokai', $this->block(['profile' => 'docs'], '<?php echo 1;', 'php'));
        $this->assertStringContainsString('cbp-theme-github-light', $this->block(['profile' => 'docs']));
    }

    public function test_a_language_theme_covers_every_name_the_language_goes_by()
    {
        $this->profile('docs', [
            'conditions' => [['id' => 'main', 'theme' => 'github-light']],
            'languages' => ['JavaScript' => ['main' => 'monokai']],
        ]);

        $this->assertSame(['javascript' => ['main' => 'monokai']], code_block_pro_profile('docs')['languages']);
        $this->assertStringContainsString('cbp-theme-monokai', $this->block(['profile' => 'docs'], 'const a = 1;', 'js'));
    }

    public function test_the_cache_key_changes_when_the_profile_is_edited_and_not_otherwise()
    {
        $id = $this->profile('docs', ['conditions' => [['id' => 'main', 'theme' => 'nord']]]);
        $key = fn () => code_block_pro_cache_key('a', 'javascript', code_block_pro_profile('docs'));
        $before = $key();

        $this->block(['profile' => 'docs']);
        $this->profile('other', []);
        $this->assertSame($before, $key());

        // Within the same second as the first save.
        code_block_pro_insert_profile('docs', ['settings' => ['fontSize' => '2rem'], 'conditions' => [['id' => 'main', 'theme' => 'nord']]]);
        $this->assertNotSame($before, $key());
    }

    public function test_saving_a_profile_deletes_the_renders_it_made_stale()
    {
        $id = $this->profile('docs', ['conditions' => [['id' => 'main', 'theme' => 'nord']]]);
        $other = $this->profile('other', ['conditions' => [['id' => 'main', 'theme' => 'nord']]]);
        set_transient(code_block_pro_cache_key('a', 'javascript', code_block_pro_profile('docs')), 'stale');
        set_transient(code_block_pro_cache_key('a', 'javascript', code_block_pro_profile('other')), 'kept');

        code_block_pro_insert_profile('docs', ['conditions' => [['id' => 'main', 'theme' => 'dracula']]]);

        global $wpdb;
        $this->assertSame('0', $wpdb->get_var($wpdb->prepare("SELECT COUNT(*) FROM $wpdb->options WHERE option_name LIKE %s", "_transient_code_block_pro_p{$id}_%")));
        $this->assertSame('1', $wpdb->get_var($wpdb->prepare("SELECT COUNT(*) FROM $wpdb->options WHERE option_name LIKE %s", "_transient_code_block_pro_p{$other}_%")));
    }

    public function test_editing_a_profile_rerenders_every_block_that_names_it()
    {
        $this->profile('docs', ['conditions' => [['id' => 'main', 'theme' => 'nord']]]);
        $this->assertStringContainsString('cbp-theme-nord', $this->block(['profile' => 'docs']));

        code_block_pro_insert_profile('docs', ['conditions' => [['id' => 'main', 'theme' => 'dracula']]]);

        $this->assertStringContainsString('cbp-theme-dracula', $this->block(['profile' => 'docs']));
    }

    public function test_a_profile_that_is_not_json_renders_as_default()
    {
        code_block_pro_insert_profile('default', ['conditions' => [['id' => 'main', 'theme' => 'monokai']]]);
        $id = $this->profile('docs', []);
        global $wpdb;
        $wpdb->update($wpdb->posts, ['post_content' => '{not json'], ['ID' => $id]);
        clean_post_cache($id);

        $profile = code_block_pro_profile('docs');

        $this->assertSame(['default', 'monokai'], [$profile['slug'], $profile['conditions'][0]['theme']]);
    }

    public function test_a_write_that_is_not_json_leaves_a_working_profile_alone()
    {
        $id = $this->profile('docs', ['conditions' => [['id' => 'main', 'theme' => 'dracula']]]);

        wp_update_post(['ID' => $id, 'post_content' => '{not json']);

        $this->assertSame('dracula', code_block_pro_profile('docs')['conditions'][0]['theme']);
    }

    public function test_a_profile_from_a_newer_release_is_stored_whole()
    {
        $id = $this->profile('docs', []);
        $newer = wp_json_encode(['version' => 2, 'conditions' => [['id' => 'main', 'theme' => 'dracula', 'shader' => 'waves']], 'futureSetting' => true]);

        wp_update_post(wp_slash(['ID' => $id, 'post_content' => $newer]));

        $this->assertSame($newer, get_post_field('post_content', $id));
        $this->assertSame('dracula', code_block_pro_profile('docs')['conditions'][0]['theme']);
    }

    public function test_a_published_profile_keeps_its_slug()
    {
        $id = $this->profile('docs', []);

        wp_update_post(['ID' => $id, 'post_name' => 'renamed']);

        $this->assertSame('docs', get_post_field('post_name', $id));
    }

    public function test_two_profiles_with_the_same_non_latin_title_get_different_slugs()
    {
        $first = wp_insert_post(['post_type' => 'cbp_profile', 'post_status' => 'publish', 'post_title' => 'Тёмная тема', 'post_content' => '{}']);
        $second = wp_insert_post(['post_type' => 'cbp_profile', 'post_status' => 'publish', 'post_title' => 'Тёмная тема', 'post_content' => '{}']);

        $this->assertNotSame(get_post_field('post_name', $first), get_post_field('post_name', $second));
        $this->assertSame($second, code_block_pro_profile(get_post_field('post_name', $second))['id']);
    }

    public function test_the_default_profile_stays_published()
    {
        $id = $this->defaultPost()->ID;

        foreach (['draft', 'pending', 'private', 'trash'] as $status) {
            wp_update_post(['ID' => $id, 'post_status' => $status]);
            clean_post_cache($id);

            $this->assertSame(['publish', 'default'], [get_post_status($id), get_post_field('post_name', $id)], $status);
        }
        code_block_pro_ensure_default_profile();
        $this->assertCount(1, get_posts(['post_type' => 'cbp_profile', 'post_status' => 'any,trash', 'numberposts' => -1]));
    }

    public function test_a_contributor_cannot_write_the_settings_1x_remembered()
    {
        wp_set_current_user(self::factory()->user->create(['role' => 'contributor']));
        $request = new WP_REST_Request('POST', '/code-block-pro/v1/settings');
        $request->set_body_params(['code_block_pro_settings' => ['previousTheme' => 'min-light']]);

        $response = rest_get_server()->dispatch($request);

        $this->assertSame(404, $response->get_status());
        $this->assertFalse(get_option('code_block_pro_settings'));
    }

    public function test_a_profile_titled_in_any_script_gets_a_slug_that_resolves()
    {
        $id = wp_insert_post(['post_type' => 'cbp_profile', 'post_status' => 'publish', 'post_title' => 'Тёмная тема', 'post_content' => '{}']);
        $slug = get_post_field('post_name', $id);

        $this->assertMatchesRegularExpression('/^p-[0-9a-f]{8}$/', $slug);
        $this->assertSame($slug, code_block_pro_profile($slug)['slug']);
    }

    /**
     * @dataProvider conditionIds
     */
    public function test_condition_ids_are_safe_to_put_in_a_class_name($given, $expected)
    {
        $profile = code_block_pro_sanitize_profile(['conditions' => [
            ['id' => 'main', 'theme' => 'nord'],
            ['id' => $given, 'theme' => 'dracula', 'trigger' => ['type' => 'class', 'value' => 'dark']],
        ]]);

        $this->assertSame($expected, $profile['conditions'][1]['id'] ?? null);
    }

    public static function conditionIds()
    {
        return [
            'plain' => ['dark', 'dark'],
            'uppercase and spaces' => ['Dark Mode', 'darkmode'],
            'hyphens dropped' => ['high-contrast', 'highcontrast'],
            'leading digit' => ['2dark', 'c2dark'],
            'reserved' => ['theme', 'ctheme'],
            'duplicate of the base' => ['main', 'main2'],
            'empty' => ['', 'c1'],
            'too long' => [str_repeat('a', 30), str_repeat('a', 20)],
        ];
    }

    /**
     * @dataProvider triggers
     */
    public function test_triggers_cannot_break_out_of_the_stylesheet($given, $expected)
    {
        $profile = code_block_pro_sanitize_profile(['conditions' => [
            ['id' => 'main', 'theme' => 'nord'],
            ['id' => 'dark', 'theme' => 'dracula', 'trigger' => $given],
        ]]);

        $this->assertSame($expected, $profile['conditions'][1]['trigger']);
    }

    public static function triggers()
    {
        return [
            'media query' => [['type' => 'media', 'value' => '(prefers-color-scheme: dark)'], ['type' => 'media', 'value' => '(prefers-color-scheme: dark)']],
            'media query with a brace' => [['type' => 'media', 'value' => 'screen{} body{display:none'], ['type' => 'button']],
            'media query with unbalanced parens' => [['type' => 'media', 'value' => '(min-width: 600px'], ['type' => 'button']],
            'media query with a comment' => [['type' => 'media', 'value' => 'screen /* x */'], ['type' => 'button']],
            'class' => [['type' => 'class', 'value' => 'is-dark'], ['type' => 'class', 'value' => 'is-dark']],
            'media range syntax' => [['type' => 'media', 'value' => '(400px <= width <= 700px)'], ['type' => 'media', 'value' => '(400px <= width <= 700px)']],
            'class with a selector in it' => [['type' => 'class', 'value' => 'x) body (.y'], ['type' => 'button']],
            'class starting with a digit' => [['type' => 'class', 'value' => '2col'], ['type' => 'button']],
            'button' => [['type' => 'button'], ['type' => 'button']],
            'unknown type' => [['type' => 'javascript', 'value' => 'alert(1)'], ['type' => 'button']],
        ];
    }

    public function test_a_background_color_must_be_a_color()
    {
        $profile = code_block_pro_sanitize_profile(['conditions' => [
            ['id' => 'main', 'theme' => 'nord', 'background' => ['type' => 'color', 'value' => '#123456']],
            ['id' => 'dark', 'theme' => 'nord', 'background' => ['type' => 'color', 'value' => 'red;}body{display:none']],
        ]]);

        $this->assertSame(['type' => 'color', 'value' => '#123456'], $profile['conditions'][0]['background']);
        $this->assertSame(['type' => 'theme'], $profile['conditions'][1]['background']);
    }

    public function test_a_profile_always_has_a_base_condition()
    {
        $this->assertSame('dracula', code_block_pro_sanitize_profile([])['conditions'][0]['theme']);
        $this->assertSame('dracula', code_block_pro_sanitize_profile(['conditions' => 'x'])['conditions'][0]['theme']);
    }

    public function test_a_profile_survives_being_saved_by_an_admin_without_unfiltered_html()
    {
        $this->asAdmin();
        add_filter('map_meta_cap', function ($caps, $cap) {
            return $cap === 'unfiltered_html' ? ['do_not_allow'] : $caps;
        }, 10, 2);
        kses_init();
        $data = ['buttons' => [['type' => 'custom', 'id' => 'share', 'label' => 'Share & <b>save</b> "it"']], 'settings' => ['fontFamily' => '"Fira Code", monospace']];

        code_block_pro_insert_profile('docs', $data);

        $this->assertSame('Share & save "it"', code_block_pro_profile('docs')['buttons'][0]['label']);
        $this->assertSame('"Fira Code", monospace', code_block_pro_profile('docs')['settings']['fontFamily']);
    }

    public function test_the_editor_lists_published_profiles_default_first()
    {
        code_block_pro_insert_profile('zebra', ['conditions' => [['id' => 'main', 'theme' => 'nord']]], 'Alpha');
        code_block_pro_insert_profile('apple', ['conditions' => [['id' => 'main', 'theme' => 'nord']]], 'Zulu');
        self::factory()->post->create(['post_type' => CODE_BLOCK_PRO_PROFILE_TYPE, 'post_name' => 'draft', 'post_status' => 'draft', 'post_content' => '{}']);
        $list = function () {
            return rest_get_server()->dispatch(new WP_REST_Request('GET', '/code-block-pro/v1/profiles'));
        };

        // A visitor would learn the site's profile names.
        $this->assertSame(401, $list()->get_status());
        wp_set_current_user(self::factory()->user->create(['role' => 'subscriber']));
        $this->assertSame(403, $list()->get_status());

        wp_set_current_user(self::factory()->user->create(['role' => 'contributor']));
        $response = $list();
        $this->assertSame(200, $response->get_status());
        $this->assertSame(['default', 'zebra', 'apple'], array_column($response->get_data(), 'slug'));
        $this->assertSame(['Alpha', 'Zulu'], array_slice(array_column($response->get_data(), 'title'), 1));

        remove_all_filters('pre_delete_post');
        wp_delete_post(code_block_pro_profile_post('default')->ID, true);
        $this->assertSame(['default', 'zebra', 'apple'], array_column($list()->get_data(), 'slug'));
        $this->assertNull(code_block_pro_profile_post('default'));
    }

    public function test_the_editor_gets_what_each_profile_turns_on()
    {
        code_block_pro_insert_profile('docs', [
            'settings' => ['lineNumbers' => true, 'headerType' => 'pillString'],
            'conditions' => [['id' => 'main', 'theme' => 'github-light'], ['id' => 'dark', 'theme' => 'dracula', 'trigger' => ['type' => 'media', 'value' => '(prefers-color-scheme: dark)']]],
            'buttons' => [['type' => 'copy'], ['type' => 'toggle']],
        ]);
        wp_set_current_user(self::factory()->user->create(['role' => 'contributor']));

        $profiles = rest_get_server()->dispatch(new WP_REST_Request('GET', '/code-block-pro/v1/profiles'))->get_data();
        $summary = array_column($profiles, 'summary', 'slug')['docs'];

        $this->assertSame(['github-light', 'dracula'], $summary['themes']);
        $this->assertSame(['copy', 'toggle'], $summary['buttons']);
        $this->assertTrue($summary['settings']['lineNumbers']);
        $this->assertSame('pillString', $summary['settings']['headerType']);
        $this->assertArrayHasKey('summary', $profiles[0]);
    }
}
