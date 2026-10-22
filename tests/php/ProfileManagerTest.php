<?php

class ProfileManagerTest extends WP_UnitTestCase
{
    public const NAME = 'kevinbatdorf/code-block-pro';

    public function set_up()
    {
        parent::set_up();
        wp_set_current_user(self::factory()->user->create(['role' => 'administrator']));
        code_block_pro_ensure_default_profile();
    }

    private function request($method, $path, $body = null)
    {
        $request = new WP_REST_Request($method, "/code-block-pro/v1/manage/$path");
        if ($body !== null) {
            $request->set_header('Content-Type', 'application/json');
            $request->set_body(wp_json_encode($body));
        }

        return rest_get_server()->dispatch($request);
    }

    private function post($slug)
    {
        return code_block_pro_profile_post($slug);
    }

    private function needsMbregex()
    {
        if (!function_exists('mb_ereg_search_init')) {
            $this->markTestSkipped('Highlighting needs mbregex.');
        }
    }

    /**
     * @dataProvider routes
     */
    public function test_only_users_who_can_change_the_design_reach_the_routes($method, $path, $body)
    {
        wp_set_current_user(self::factory()->user->create(['role' => 'editor']));

        $this->assertSame(403, $this->request($method, $path, $body)->get_status());
        $this->assertSame('dracula', code_block_pro_profile('default')['conditions'][0]['theme']);
    }

    public static function routes()
    {
        $data = ['conditions' => [['id' => 'main', 'theme' => 'nord']]];

        return [
            'the theme list' => ['GET', 'meta', null],
            'the profiles and the pages using them' => ['GET', 'profiles', null],
            'saving a profile' => ['POST', 'profiles', ['slug' => 'default', 'data' => $data]],
            'theme samples' => ['POST', 'samples', ['language' => 'php', 'code' => 'a();']],
            'a draft render' => ['POST', 'render', ['data' => $data, 'attributes' => []]],
        ];
    }

    public function test_saving_with_no_slug_adds_a_profile_named_after_its_title()
    {
        code_block_pro_insert_profile('docs', []);

        $response = $this->request('POST', 'profiles', ['title' => 'Docs', 'data' => ['conditions' => [['id' => 'main', 'theme' => 'nord']]]]);

        $this->assertSame(200, $response->get_status());
        $this->assertSame('docs-2', $response->get_data()['slug']);
        $this->assertSame('Docs', $this->post('docs-2')->post_title);
        $this->assertSame('nord', code_block_pro_profile('docs-2')['conditions'][0]['theme']);
    }

    public function test_saving_a_profile_replaces_its_data_and_keeps_its_title()
    {
        code_block_pro_insert_profile('docs', [], 'Docs');

        $this->request('POST', 'profiles', ['slug' => 'docs', 'data' => ['settings' => ['lineNumbers' => true]]]);

        $this->assertTrue(code_block_pro_profile('docs')['settings']['lineNumbers']);
        $this->assertSame('Docs', $this->post('docs')->post_title);
    }

    public function test_a_profile_renamed_alone_keeps_its_slug_and_data()
    {
        code_block_pro_insert_profile('docs', ['settings' => ['lineNumbers' => true]], 'Docs');

        $response = $this->request('POST', 'profiles', ['slug' => 'docs', 'title' => 'Guides & "notes"']);

        $this->assertSame('docs', $response->get_data()['slug']);
        $this->assertSame('Guides & "notes"', $this->post('docs')->post_title);
        $this->assertTrue(code_block_pro_profile('docs')['settings']['lineNumbers']);
    }

    public function test_saving_a_profile_that_does_not_exist_adds_nothing()
    {
        $response = $this->request('POST', 'profiles', ['slug' => 'nope', 'data' => []]);

        $this->assertSame(404, $response->get_status());
        $this->assertNull($this->post('nope'));
    }

    public function test_a_profile_a_newer_release_saved_is_left_whole()
    {
        $id = code_block_pro_insert_profile('docs', []);
        $newer = wp_json_encode(['version' => 2, 'conditions' => [['id' => 'main', 'theme' => 'dracula']], 'futureSetting' => true]);
        wp_update_post(wp_slash(['ID' => $id, 'post_content' => $newer]));

        $response = $this->request('POST', 'profiles', ['slug' => 'docs', 'data' => ['conditions' => [['id' => 'main', 'theme' => 'nord']]]]);

        $this->assertSame(409, $response->get_status());
        $this->assertSame($newer, get_post_field('post_content', $id));
    }

    public function test_a_profile_from_a_newer_release_is_not_imported()
    {
        $before = $this->profileIds();

        $response = $this->request('POST', 'profiles', ['title' => 'Later', 'data' => ['version' => 2, 'futureSetting' => true]]);

        $this->assertSame(409, $response->get_status());
        $this->assertSame($before, $this->profileIds());
    }

    public function test_a_profile_keeps_its_own_code_sample_until_it_is_cleared()
    {
        code_block_pro_insert_profile('docs', []);
        $sample = ['language' => 'PHP', 'code' => "<?php echo 'a\\b';"];

        $this->request('POST', 'profiles', ['slug' => 'docs', 'sample' => $sample]);
        $saved = array_column($this->request('GET', 'profiles')->get_data()['profiles'], 'sample', 'slug');
        $this->request('POST', 'profiles', ['slug' => 'docs', 'sample' => null]);
        $cleared = array_column($this->request('GET', 'profiles')->get_data()['profiles'], 'sample', 'slug');

        $this->assertSame(['language' => 'php', 'code' => "<?php echo 'a\\b';"], $saved['docs']);
        $this->assertNull($saved['default']);
        $this->assertNull($cleared['docs']);
    }

    public function test_usage_counts_the_blocks_on_each_page_including_drafts()
    {
        $block = fn ($attributes) => '<!-- wp:' . self::NAME . ' ' . serialize_block_attributes(['panes' => [['code' => 'a']]] + $attributes) . ' /-->';
        $published = self::factory()->post->create(['post_title' => 'Guide', 'post_content' => $block(['version' => 2, 'profile' => 'docs']) . $block(['version' => 2])]);
        $draft = self::factory()->post->create(['post_status' => 'draft', 'post_title' => '', 'post_content' => '<!-- wp:group -->' . $block(['version' => 2, 'profile' => 'docs']) . $block(['version' => 2, 'profile' => 'docs']) . '<!-- /wp:group -->']);
        self::factory()->post->create(['post_content' => $block(['profile' => 'docs'])]);
        wp_save_post_revision($published);

        $data = $this->request('GET', 'profiles')->get_data();

        $this->assertSame(['docs' => 3, 'default' => 1], (array) $data['usage']);
        $this->assertSame(['docs' => 2, 'default' => 1], (array) $data['pages']);
        $pages = array_map(fn ($page) => [$page['id'], $page['title'], $page['blocks']], $data['pageList']->docs);
        sort($pages);
        $this->assertSame([[$published, 'Guide', 1], [$draft, '(no title)', 2]], $pages);
    }

    public function test_the_theme_list_says_which_themes_are_dark()
    {
        $themes = array_column($this->request('GET', 'meta')->get_data()['themes'], null, 'slug');

        $this->assertTrue($themes['dracula']['dark']);
        $this->assertFalse($themes['github-light']['dark']);
    }

    public function test_a_draft_renders_with_nothing_saved_or_cached()
    {
        $this->needsMbregex();
        $posts = $this->profileIds();
        $transients = $this->transients();

        $response = $this->request('POST', 'render', [
            'data' => ['settings' => ['fontSize' => '2rem'], 'conditions' => [['id' => 'main', 'theme' => 'nord']]],
            'swaps' => [['settings' => ['headerType' => 'none']], ['settings' => ['headerType' => 'pillString']]],
            'attributes' => ['panes' => [['language' => 'javascript', 'code' => 'const a = 1;']]],
            'slot' => 'top',
        ]);
        $data = $response->get_data();

        $this->assertSame(200, $response->get_status());
        $this->assertCount(2, $data['items']);
        $this->assertStringContainsString('cbp-theme-nord', $data['items'][0]);
        $this->assertStringContainsString('cbp-profile-draft_top', $data['items'][0]);
        $this->assertStringNotContainsString('cbp-header', $data['items'][0]);
        $this->assertStringContainsString('cbp-header', $data['items'][1]);
        $this->assertStringContainsString('.cbp-profile-draft_top', $data['css']);
        $this->assertStringContainsString('2rem', $data['css']);
        $this->assertNotContains('code-block-pro-profile-draft_top', array_column($data['styles'], 'handle'));
        $this->assertSame($posts, $this->profileIds());
        $this->assertSame($transients, $this->transients());
    }

    public function test_a_draft_keeps_its_theme_switch_but_shows_only_its_light_theme()
    {
        $this->needsMbregex();
        $data = [
            'conditions' => [['id' => 'main', 'theme' => 'nord'], ['id' => 'dark', 'theme' => 'dracula', 'trigger' => ['type' => 'media', 'value' => '(prefers-color-scheme: dark)']]],
            'buttons' => [['type' => 'toggle']],
        ];

        $draft = $this->request('POST', 'render', ['data' => $data, 'attributes' => ['panes' => [['code' => 'a']]], 'slot' => 'btns'])->get_data();

        $this->assertStringContainsString('cbp-toggle', $draft['items'][0]);
        $this->assertStringNotContainsString('prefers-color-scheme', $draft['css']);
    }

    public function test_the_font_list_says_which_fonts_draw_ligatures()
    {
        $fonts = array_column($this->request('GET', 'meta')->get_data()['fonts'], 'ligatures', 'value');

        $this->assertTrue($fonts['Code-Pro-Fira-Code']);
        $this->assertFalse($fonts['Code-Pro-JetBrains-Mono-NL']);
    }

    public function test_a_draft_render_leaves_the_saved_profile_in_use()
    {
        $this->request('POST', 'render', ['data' => ['conditions' => [['id' => 'main', 'theme' => 'nord']]], 'attributes' => [], 'slot' => 'default']);

        $this->assertNull(code_block_pro_draft_profile());
        $this->assertSame('dracula', code_block_pro_profile('default')['conditions'][0]['theme']);
    }

    private function profileIds()
    {
        return get_posts(['post_type' => CODE_BLOCK_PRO_PROFILE_TYPE, 'post_status' => 'any', 'numberposts' => -1, 'fields' => 'ids', 'suppress_filters' => true]);
    }

    private function transients()
    {
        global $wpdb;

        return (int) $wpdb->get_var("SELECT COUNT(*) FROM $wpdb->options WHERE option_name LIKE '\\_transient\\_code\\_block\\_pro\\_%'");
    }

    public function test_only_the_shared_code_sample_is_stored_with_every_theme_in_it()
    {
        $this->needsMbregex();
        $before = $this->transients();

        $shared = $this->request('POST', 'samples', ['language' => '', 'code' => ''])->get_data();
        $stored = $this->transients();
        $own = $this->request('POST', 'samples', ['language' => 'php', 'code' => '<?php echo 1;'])->get_data();

        $this->assertSame(code_block_pro_theme_slugs(), array_keys($shared));
        $this->assertStringContainsString('greet', $shared['dracula']);
        $this->assertStringContainsString('echo', $own['nord']);
        $this->assertSame($before + 1, $stored);
        $this->assertSame($stored, $this->transients());
    }

    public function test_the_manager_loads_only_for_users_who_can_change_the_design()
    {
        wp_set_current_user(self::factory()->user->create(['role' => 'editor']));
        do_action('enqueue_block_editor_assets');

        $this->assertFalse(wp_script_is('code-block-pro-profiles'));
    }
}
