<?php

class PreviewTest extends WP_UnitTestCase
{
    public const NAME = 'kevinbatdorf/code-block-pro';

    public const MARKED = "// [!code highlight]\na(); // [!code ++]\nb(); // note [!code focus:2]\nc();\n    // [!code --]\nd();\ne(); /* [!code hl] */\nf();\n";

    private $log = null;

    private $savedLog = '';

    public function set_up()
    {
        parent::set_up();
        $this->dequeueStyles();
        wp_set_current_user(self::factory()->user->create(['role' => 'contributor']));
    }

    public function tear_down()
    {
        $this->dequeueStyles();
        if ($this->log !== null) {
            ini_set('error_log', $this->savedLog);
            $this->log = null;
        }
        parent::tear_down();
    }

    private function dequeueStyles()
    {
        foreach (wp_styles()->queue as $handle) {
            if (str_starts_with($handle, 'code-block-pro') || str_starts_with($handle, 'cbp-test-')) {
                wp_dequeue_style($handle);
            }
        }
    }

    private function needsMbregex()
    {
        if (!function_exists('mb_ereg_search_init')) {
            $this->markTestSkipped('Highlighting needs mbregex.');
        }
    }

    /** Attributes as the editor holds them, code escaped. */
    private function attributes($attributes, ...$panes)
    {
        $panes = array_map(fn ($pane) => $pane + ['language' => 'javascript', 'code' => ''], $panes ?: [['code' => 'a();']]);
        foreach ($panes as $i => $pane) {
            $panes[$i]['code'] = strtr($pane['code'], ['&' => '&amp;', '<' => '&lt;', '>' => '&gt;']);
        }

        return $attributes + ['panes' => $panes];
    }

    private function preview($body)
    {
        $request = new WP_REST_Request('POST', '/code-block-pro/v1/preview');
        $request->set_header('Content-Type', 'application/json');
        $request->set_body(wp_json_encode($body));

        return rest_get_server()->dispatch($request);
    }

    private function previewHtml($attributes, $keepMarkers)
    {
        $response = $this->preview(['attributes' => $attributes, 'keepMarkers' => $keepMarkers]);
        $this->assertSame(200, $response->get_status(), wp_json_encode($response->get_data()));

        return $response->get_data()['html'];
    }

    private function frontEnd($attributes)
    {
        return render_block(parse_blocks('<!-- wp:' . self::NAME . ' ' . serialize_block_attributes(['version' => 2] + $attributes) . ' /-->')[0]);
    }

    /** Each render takes the next wp_unique_id(). */
    private function normalized($html)
    {
        return preg_replace('/\bcbp-\d+(?=-(?:tab|pane)-)/', 'cbp-N', $html);
    }

    private function xpath($html)
    {
        $doc = new DOMDocument();
        libxml_use_internal_errors(true);
        $doc->loadHTML('<?xml encoding="UTF-8">' . $html);
        libxml_clear_errors();

        return new DOMXPath($doc);
    }

    private function codeText($html)
    {
        $this->assertSame(1, preg_match('#<code>(.*)</code>#s', $html, $match), $html);

        return html_entity_decode(strip_tags($match[1]), ENT_QUOTES | ENT_HTML5, 'UTF-8');
    }

    /**
     * @return list<array{tag: string, class: string, data-line: string|null, id: string|null}>
     */
    private function rows($html)
    {
        $rows = [];
        foreach ($this->xpath($html)->query('//code/*') as $line) {
            $rows[] = [
                'tag' => $line->nodeName,
                'class' => $line->getAttribute('class'),
                'data-line' => $line->hasAttribute('data-line') ? $line->getAttribute('data-line') : null,
                'id' => $line->hasAttribute('id') ? $line->getAttribute('id') : null,
            ];
        }

        return $rows;
    }

    private function assertKeptMatchesFrontEnd($attributes, $code)
    {
        $front = $this->frontEnd($attributes);
        $kept = $this->previewHtml($attributes, true);

        $this->assertSame(preg_replace("/\n\z/", '', $code), $this->codeText($kept));
        $rows = $this->rows($kept);
        $markers = array_values(array_filter($rows, fn ($row) => $row['class'] === 'line cbp-marker'));
        $lines = array_values(array_filter($rows, fn ($row) => $row['class'] !== 'line cbp-marker'));
        $this->assertNotEmpty($markers);
        foreach ($markers as $row) {
            $this->assertSame(['tag' => 'span', 'class' => 'line cbp-marker', 'data-line' => null, 'id' => null], $row);
        }
        $this->assertSame($this->rows($front), $lines);
        // Everything but the code's text is the front end's.
        $this->assertSame($this->normalized(preg_replace('#<code>.*</code>#s', '', $front)), $this->normalized(preg_replace('#<code>.*</code>#s', '', $kept)));

        return $rows;
    }

    public function test_only_a_user_who_can_edit_posts_gets_a_preview()
    {
        $body = ['attributes' => $this->attributes(['profile' => ''])];

        wp_set_current_user(0);
        $this->assertSame(401, $this->preview($body)->get_status());
        wp_set_current_user(self::factory()->user->create(['role' => 'subscriber']));
        $this->assertSame(403, $this->preview($body)->get_status());
        wp_set_current_user(self::factory()->user->create(['role' => 'contributor']));
        $response = $this->preview($body);

        $this->assertSame(200, $response->get_status());
        $this->assertSame(['html', 'styles', 'ms', 'indent', 'issues'], array_keys($response->get_data()));
        $this->assertIsFloat($response->get_data()['ms']);
        $this->assertSame(round($response->get_data()['ms'], 1), $response->get_data()['ms']);
    }

    public function test_line_anchors_in_a_preview_carry_the_id_the_editor_sends()
    {
        $anchored = $this->attributes(['profile' => '', 'lineAnchors' => true], ['code' => "a();\nb();"]);
        $lineIds = function ($uid) use ($anchored) {
            preg_match_all('/\bid="([^"]*L\d+)"/', $this->preview(['attributes' => $anchored, 'uid' => $uid])->get_data()['html'], $found);

            return $found[1];
        };

        $this->assertSame(['cbp-e1-L1', 'cbp-e1-L2'], $lineIds('cbp-e1'));
        $this->assertSame(['cbp-e2-L1', 'cbp-e2-L2'], $lineIds('cbp-e2'));
        $this->assertMatchesRegularExpression('/id="(code\d+-)?L1"/', $this->frontEnd($anchored));
    }

    public function test_each_block_names_its_tabs_with_the_id_the_editor_sends()
    {
        $tabbed = $this->attributes(['profile' => ''], ['code' => 'a();'], ['code' => 'b();']);
        $ids = function ($body) {
            $html = $this->preview($body)->get_data()['html'];
            preg_match_all('/\bid="([^"]+)"/', $html, $found);

            return $found[1];
        };

        // Two blocks share the canvas, so the second's tabs would point at the first's panes.
        $this->assertSame(['cbp-e1-tab-0', 'cbp-e1-tab-1', 'cbp-e1-pane-0', 'cbp-e1-pane-1'], $ids(['attributes' => $tabbed, 'uid' => 'cbp-e1']));
        $this->assertNotContains('cbp-e1-tab-0', $ids(['attributes' => $tabbed, 'uid' => 'cbp-e2']));
        foreach (['"><script>', 'Cbp', '1cbp', str_repeat('a', 50)] as $bad) {
            $this->assertMatchesRegularExpression('/^cbp-\d+-tab-0$/', $ids(['attributes' => $tabbed, 'uid' => $bad])[0], $bad);
        }
        $this->assertMatchesRegularExpression('/^cbp-\d+-tab-0$/', $ids(['attributes' => $tabbed])[0]);
        $this->assertDoesNotMatchRegularExpression('/cbp-e1/', $this->frontEnd($tabbed));
    }

    public function test_attributes_that_are_not_an_object_are_refused()
    {
        foreach (['x', [1, 2], null, 3] as $attributes) {
            $this->assertSame(400, $this->preview(['attributes' => $attributes])->get_status(), wp_json_encode($attributes));
        }
        $this->assertSame(400, $this->preview([])->get_status());
        $this->assertSame(200, $this->preview(['attributes' => new stdClass()])->get_status());
    }

    public function test_the_preview_always_renders_as_a_2x_block()
    {
        $html = $this->previewHtml($this->attributes(['profile' => '', 'version' => 1]), false);

        $this->assertStringContainsString('data-code-block-pro="' . CODE_BLOCK_PRO_VERSION . '"', $html);
        $this->assertSame('a();', $this->codeText($html));
    }

    public function test_a_block_without_markers_previews_as_the_front_end_renders_it()
    {
        $slug = 'numbered';
        code_block_pro_insert_profile($slug, ['settings' => ['lineNumbers' => true, 'seeMoreType' => 'roundCenter'], 'buttons' => [['type' => 'copy']]]);
        $attributes = $this->attributes(
            ['profile' => $slug, 'align' => 'wide', 'anchor' => 'intro', 'lineAnchors' => true],
            ['code' => "const a = 1;\nconst b = '<b>' + a;\nc();\n", 'startLine' => 9, 'highlightLines' => '10', 'seeMoreAfter' => 2, 'label' => 'a.js'],
            ['code' => "<?php echo 'x';", 'language' => 'php']
        );
        $front = $this->normalized($this->frontEnd($attributes));

        $this->assertStringContainsString('alignwide', $front);
        $this->assertStringContainsString('id="intro"', $front);
        $this->assertStringContainsString('cbp-N-pane-1', $front);
        $this->assertSame($front, $this->normalized($this->previewHtml($attributes, false)));
        $this->assertSame($front, $this->normalized($this->previewHtml($attributes, true)));
    }

    public function test_render_block_filters_reach_the_preview()
    {
        add_filter('render_block_' . self::NAME, fn ($html) => $html . '<p>filtered</p>');

        $this->assertStringEndsWith('<p>filtered</p>', $this->previewHtml($this->attributes(['profile' => '']), false));
    }

    public function test_the_preview_lists_the_stylesheets_the_render_loaded()
    {
        code_block_pro_insert_profile('sized', ['settings' => ['fontSize' => '1rem', 'fontFamily' => 'Code-Pro-Fira-Code'], 'conditions' => [['id' => 'main', 'theme' => 'nord']]]);
        wp_register_style('cbp-test-base', 'https://cdn.example.com/base.css', [], '1.0');
        wp_register_style('cbp-test-group', false, ['cbp-test-base']);
        wp_register_style('cbp-test-child', '/wp-content/child.css', ['cbp-test-group'], '2.0');
        add_filter('render_block_' . self::NAME, function ($html) {
            wp_enqueue_style('cbp-test-child');

            return $html;
        });
        add_filter('style_loader_src', fn ($src, $handle) => $handle === 'cbp-test-base' ? add_query_arg('cdn', '1', $src) : $src, 10, 2);

        $styles = $this->preview(['attributes' => $this->attributes(['profile' => 'sized', 'theme' => 'nord'])])->get_data()['styles'];
        $hrefs = array_column($styles, 'href', 'handle');

        foreach (['code-block-pro-theme-nord', 'code-block-pro-font-Code-Pro-Fira-Code', 'code-block-pro-profile-sized', 'cbp-test-base', 'cbp-test-child'] as $handle) {
            $this->assertArrayHasKey($handle, $hrefs);
            $this->assertMatchesRegularExpression('#^https?://#', $hrefs[$handle], $handle);
            $this->assertStringContainsString('ver=', $hrefs[$handle], $handle);
            $this->assertStringNotContainsString('&#', $hrefs[$handle], $handle);
            $this->assertSame($this->printedHref($handle), $hrefs[$handle], $handle);
        }
        $this->assertStringEndsWith('/build/themes/nord.css?ver=' . filemtime(dirname(__DIR__, 2) . '/build/themes/nord.css'), $hrefs['code-block-pro-theme-nord']);
        $this->assertStringContainsString('?code-block-pro-profile=sized&ver=', $hrefs['code-block-pro-profile-sized']);
        $this->assertSame('https://cdn.example.com/base.css?ver=1.0&cdn=1', $hrefs['cbp-test-base']);
        $this->assertArrayNotHasKey('cbp-test-group', $hrefs);
        $order = array_flip(array_column($styles, 'handle'));
        $this->assertLessThan($order['cbp-test-child'], $order['cbp-test-base']);
        $this->assertSame(count($styles), count($hrefs));
    }

    /** The href WordPress prints for a stylesheet, as the browser reads it. */
    private function printedHref($handle)
    {
        ob_start();
        wp_styles()->do_item($handle);
        $link = $this->xpath(ob_get_clean())->query('//link[@rel="stylesheet"]')->item(0);
        $this->assertNotNull($link, $handle);

        return $link->getAttribute('href');
    }

    public static function paths()
    {
        return [
            'highlighted' => ['javascript', true],
            'unknown language' => ['totally-fake', true],
            'without mbregex' => ['javascript', false],
        ];
    }

    /**
     * @dataProvider paths
     */
    public function test_kept_markers_leave_the_code_as_typed_and_mark_the_lines_the_front_end_marks($language, $canUpgrade)
    {
        if ($canUpgrade && $language === 'javascript') {
            $this->needsMbregex();
        }
        add_filter('blocks.codeBlockPro.canUpgrade', $canUpgrade ? '__return_true' : '__return_false');
        code_block_pro_insert_profile('numbered', ['settings' => ['lineNumbers' => true]]);
        $attributes = $this->attributes(
            ['profile' => 'numbered', 'anchor' => 'intro', 'lineAnchors' => true],
            ['code' => self::MARKED, 'language' => $language, 'startLine' => 8, 'sharpLines' => '9', 'seeMoreAfter' => 3]
        );

        $rows = $this->assertKeptMatchesFrontEnd($attributes, self::MARKED);

        $this->assertSame(
            [
                ['line cbp-marker', null, null],
                ['line cbp-hl cbp-add', '8', 'intro-L8'],
                ['line cbp-sharp cbp-focus', '9', 'intro-L9'],
                ['line cbp-focus', '10', 'intro-L10'],
                ['line cbp-marker', null, null],
                ['line cbp-del', '11', 'intro-L11'],
                ['line cbp-hl', '12', 'intro-L12'],
                ['line', '13', 'intro-L13'],
            ],
            array_map(fn ($row) => [$row['class'], $row['data-line'], $row['id']], $rows)
        );
        $this->assertSame(['ins', 'del'], [$rows[1]['tag'], $rows[5]['tag']]);
    }

    public function test_kept_markers_match_the_front_end_in_each_languages_comments()
    {
        $this->needsMbregex();
        $cases = [
            ['kotlin', "// [!code hl]\nfun a() {}"],
            ['dart', "  // [!code ++]\n  print(1);"],
            ['rust', "    /* [!code hl] */\nfn a() {}"],
            ['javascript', "  /* [!code hl] */ a();\n// [!code focus]"],
            ['jsx', "<div>\n    {/* [!code hl] */}\n    <p/>\n</div>"],
            ['php', "<?php\n# [!code focus:2]\n\$a = 1; # [!code ++]\n\$b = 2; /* [!code --] */"],
            ['python', "# [!code hl]\na = 1  # [!code ++]\n"],
            ['html', "<!-- [!code ++] -->\n<p>a</p> <!-- [!code hl] -->"],
        ];

        foreach ($cases as [$language, $code]) {
            foreach ([true, false] as $canUpgrade) {
                add_filter('blocks.codeBlockPro.canUpgrade', $canUpgrade ? '__return_true' : '__return_false');
                $this->assertKeptMatchesFrontEnd($this->attributes(['profile' => ''], ['code' => $code, 'language' => $language]), $code);
                remove_all_filters('blocks.codeBlockPro.canUpgrade');
            }
        }
    }

    public function test_a_block_of_only_markers_keeps_them_all()
    {
        $code = "// [!code hl]\n// [!code ++]";

        foreach ([true, false] as $canUpgrade) {
            add_filter('blocks.codeBlockPro.canUpgrade', $canUpgrade ? '__return_true' : '__return_false');
            $html = $this->previewHtml($this->attributes(['profile' => ''], ['code' => $code]), true);

            $this->assertSame($code, $this->codeText($html));
            $this->assertSame(['line cbp-marker', 'line cbp-marker'], array_column($this->rows($html), 'class'));
            remove_all_filters('blocks.codeBlockPro.canUpgrade');
        }
    }

    public function test_keep_markers_is_on_only_while_the_preview_renders()
    {
        $during = [];
        add_filter('render_block_' . self::NAME, function ($html) use (&$during) {
            $during[] = code_block_pro_keep_markers();

            return $html;
        });

        $this->previewHtml($this->attributes(['profile' => '']), true);
        $this->assertFalse(code_block_pro_keep_markers());
        $this->previewHtml($this->attributes(['profile' => '']), false);
        $this->assertFalse(code_block_pro_keep_markers());

        $this->assertSame([true, false], $during);
    }

    public function test_keep_markers_is_off_again_after_a_render_that_throws()
    {
        add_filter('render_block_' . self::NAME, function () {
            throw new RuntimeException('render failed');
        });

        $thrown = null;
        try {
            $this->preview(['attributes' => $this->attributes(['profile' => '']), 'keepMarkers' => true]);
        } catch (RuntimeException $e) {
            $thrown = $e;
        } finally {
            // The throw skips dispatch's cleanup, which leaves later tests looking like REST requests.
            $GLOBALS['wp_rest_server'] = null;
        }

        $this->assertNotNull($thrown);
        $this->assertFalse(code_block_pro_keep_markers());
        $this->assertNull(code_block_pro_issues());
    }

    private function issues($attributes)
    {
        $response = $this->preview(['attributes' => $attributes]);
        $this->assertSame(200, $response->get_status(), wp_json_encode($response->get_data()));

        return $response->get_data()['issues'];
    }

    /** A theme phiki throws on; what the preview logs about it goes to $this->log. */
    private function brokenTheme()
    {
        $file = wp_tempnam('cbp-theme') . '.json';
        file_put_contents($file, '{}');
        add_filter('blocks.codeBlockPro.themeFiles', fn ($themes) => $themes + ['broken' => $file]);
        $this->log = wp_tempnam('cbp-log');
        $this->savedLog = (string) ini_set('error_log', $this->log);

        return $file;
    }

    public function test_a_block_that_renders_as_asked_has_no_issues()
    {
        $this->needsMbregex();

        $this->assertSame([], $this->issues($this->attributes(['profile' => ''], ['code' => 'a(); // [!code hl]'], ['code' => 'b', 'language' => ''])));
        $this->assertSame([], $this->issues($this->attributes(['profile' => 'default', 'theme' => 'not-a-theme'])));
        $this->assertSame([], $this->issues($this->attributes([])));
    }

    public function test_without_mbregex_the_preview_says_the_host_must_add_it()
    {
        add_filter('blocks.codeBlockPro.canUpgrade', '__return_false');

        $issues = $this->issues($this->attributes(['profile' => ''], ['code' => 'a();'], ['code' => 'b();', 'language' => 'php']));

        $this->assertSame(['no-mbregex'], array_column($issues, 'code'));
        $this->assertStringContainsString('mbregex', $issues[0]['message']);
        $this->assertStringContainsString('mbstring', $issues[0]['message']);
        $this->assertStringContainsString('host', $issues[0]['message']);
    }

    public function test_an_unknown_language_is_named_as_typed()
    {
        $this->needsMbregex();

        $issues = $this->issues($this->attributes(['profile' => ''], ['code' => 'x', 'language' => 'Klingon-Script']));

        $this->assertSame(['unknown-language'], array_column($issues, 'code'));
        $this->assertStringContainsString('“Klingon-Script”', $issues[0]['message']);
        $this->assertStringContainsString('plain text', $issues[0]['message']);
    }

    public function test_ansi_and_terminal_say_they_show_as_plain_text_and_which_tab()
    {
        $this->needsMbregex();

        $issues = $this->issues($this->attributes(['profile' => ''], ['code' => 'x', 'language' => 'ansi'], ['code' => 'y', 'language' => 'terminal', 'label' => 'output.log']));

        $this->assertSame(['plain-language', 'plain-language'], array_column($issues, 'code'));
        $this->assertStringStartsWith('In the “ANSI” tab: ', $issues[0]['message']);
        $this->assertStringStartsWith('In the “output.log” tab: ', $issues[1]['message']);
        $this->assertStringContainsString('plain text', $issues[1]['message']);
    }

    public function test_a_lone_pane_is_not_named()
    {
        $this->needsMbregex();

        $issues = $this->issues($this->attributes(['profile' => ''], ['code' => 'x', 'language' => 'ansi', 'label' => 'output.log']));

        $this->assertStringNotContainsString('output.log', $issues[0]['message']);
        $this->assertStringNotContainsString('tab', $issues[0]['message']);
    }

    public function test_a_highlight_that_throws_is_reported_without_its_error()
    {
        $this->needsMbregex();
        $theme = $this->brokenTheme();

        $issues = $this->issues($this->attributes(['profile' => '', 'theme' => 'broken']));

        $this->assertSame(['highlight-failed'], array_column($issues, 'code'));
        $this->assertStringContainsString('plain text', $issues[0]['message']);
        $this->assertStringNotContainsString(dirname($theme), wp_json_encode($issues, JSON_UNESCAPED_SLASHES));
        $this->assertStringNotContainsString('.php', $issues[0]['message']);
        $this->assertStringContainsString('Code Block Pro could not highlight', (string) file_get_contents($this->log));
    }

    /**
     * @runInSeparateProcess
     * @preserveGlobalState disabled
     */
    public function test_another_plugins_copy_of_the_highlighter_is_reported()
    {
        $this->needsMbregex();
        // Loaded before ours, as another plugin's would be.
        $file = wp_tempnam('cbp-phiki') . '.php';
        file_put_contents($file, '<?php namespace Phiki\Transformers; abstract class AbstractTransformer {}');
        require $file;

        $issues = $this->issues($this->attributes(['profile' => '']));

        $this->assertSame(['highlighter-conflict'], array_column($issues, 'code'));
        $this->assertStringContainsString('plugin', $issues[0]['message']);
    }

    public function test_an_unknown_theme_is_named()
    {
        $this->needsMbregex();
        code_block_pro_insert_profile('gone', ['conditions' => [['id' => 'main', 'theme' => 'retired-theme']]]);
        code_block_pro_insert_profile('php-only', ['conditions' => [['id' => 'main', 'theme' => 'nord']], 'languages' => ['php' => ['main' => 'retired-theme']]]);

        $freeflow = $this->issues($this->attributes(['profile' => '', 'theme' => 'not-a-theme']));
        $profile = $this->issues($this->attributes(['profile' => 'gone']));

        $this->assertSame(['unknown-theme'], array_column($freeflow, 'code'));
        $this->assertStringContainsString('“not-a-theme”', $freeflow[0]['message']);
        $this->assertStringContainsString('so Dracula is used instead', $freeflow[0]['message']);
        $this->assertSame(['unknown-theme'], array_column($profile, 'code'));
        $this->assertStringContainsString('“retired-theme”', $profile[0]['message']);
        $this->assertSame([], $this->issues($this->attributes(['profile' => 'php-only'])));
        $this->assertSame(['unknown-theme'], array_column($this->issues($this->attributes(['profile' => 'php-only'], ['code' => '<?php', 'language' => 'php'])), 'code'));
    }

    public function test_a_missing_profile_is_named()
    {
        $this->needsMbregex();
        wp_insert_post(['post_type' => CODE_BLOCK_PRO_PROFILE_TYPE, 'post_status' => 'draft', 'post_name' => 'unpublished', 'post_title' => 'Unpublished', 'post_content' => '{}']);

        $missing = $this->issues($this->attributes(['profile' => 'retired']));
        $draft = $this->issues($this->attributes(['profile' => 'unpublished']));

        $this->assertSame(['missing-profile'], array_column($missing, 'code'));
        $this->assertStringContainsString('“retired”', $missing[0]['message']);
        $this->assertStringContainsString('Default', $missing[0]['message']);
        $this->assertSame(['missing-profile'], array_column($draft, 'code'));
    }

    public function test_repeated_issues_collapse_and_keep_the_order_they_happened_in()
    {
        $this->needsMbregex();

        $issues = $this->issues($this->attributes(
            ['profile' => '', 'theme' => 'not-a-theme'],
            ['code' => 'x', 'language' => 'made-up', 'label' => 'a'],
            ['code' => 'y', 'language' => 'made-up', 'label' => 'a'],
            ['code' => 'z', 'language' => 'ansi']
        ));

        $this->assertSame(['unknown-theme', 'unknown-language', 'plain-language'], array_column($issues, 'code'));
        $this->assertStringStartsWith('In the “a” tab: ', $issues[1]['message']);
        $this->assertSame(array_unique(array_map('serialize', $issues)), array_map('serialize', $issues));
    }

    public function test_issue_messages_are_translatable()
    {
        $this->needsMbregex();
        add_filter('gettext_code-block-pro', fn ($translation, $text) => "[$text]", 10, 2);

        $issues = $this->issues($this->attributes(['profile' => ''], ['code' => 'x', 'language' => 'made-up']));

        $this->assertStringStartsWith('[', $issues[0]['message']);
    }

    public function test_issues_are_collected_only_while_the_preview_renders()
    {
        $during = [];
        add_filter('render_block_' . self::NAME, function ($html) use (&$during) {
            $during[] = code_block_pro_issues();

            return $html;
        });

        $this->frontEnd($this->attributes(['profile' => ''], ['code' => 'x', 'language' => 'made-up']));
        $this->issues($this->attributes(['profile' => ''], ['code' => 'x', 'language' => 'made-up']));

        $this->assertNull($during[0]);
        $this->assertIsArray($during[1]);
        $this->assertNull(code_block_pro_issues());
    }

    public function test_the_front_end_renders_a_block_with_issues_as_the_preview_does()
    {
        $this->brokenTheme();
        $blocks = [
            $this->attributes(['profile' => ''], ['code' => 'x', 'language' => 'made-up'], ['code' => 'y', 'language' => 'ansi'], ['code' => 'z', 'language' => 'terminal']),
            $this->attributes(['profile' => '', 'theme' => 'broken']),
            $this->attributes(['profile' => '', 'theme' => 'not-a-theme']),
            $this->attributes(['profile' => 'retired']),
        ];

        foreach ([true, false] as $canUpgrade) {
            add_filter('blocks.codeBlockPro.canUpgrade', $canUpgrade ? '__return_true' : '__return_false');
            foreach ($blocks as $i => $attributes) {
                $front = $this->normalized($this->frontEnd($attributes));
                $this->assertNotSame([], $this->issues($attributes), "$i");
                $this->assertSame($front, $this->normalized($this->previewHtml($attributes, false)), "$i");
                $this->assertSame($front, $this->normalized($this->frontEnd($attributes)), "$i");
            }
            remove_all_filters('blocks.codeBlockPro.canUpgrade');
        }
    }

    public function test_the_preview_names_the_indent_the_profile_types_with()
    {
        code_block_pro_insert_profile('wide', ['settings' => ['tabSize' => 4]]);
        code_block_pro_insert_profile('tabbed', ['settings' => ['useTabs' => true]]);

        $indent = fn ($profile) => $this->preview(['attributes' => $this->attributes(['profile' => $profile])])->get_data()['indent'];

        $this->assertSame('  ', $indent('default'));
        $this->assertSame('    ', $indent('wide'));
        $this->assertSame("\t", $indent('tabbed'));
    }

    public function test_a_preview_of_edited_code_reads_the_page_render_cache_but_never_writes_it()
    {
        $this->needsMbregex();
        $written = [];
        add_action('set_transient', function ($name) use (&$written) {
            if (str_starts_with($name, 'code_block_pro_')) {
                $written[] = $name;
            }
        });
        $attributes = $this->attributes(['profile' => ''], ['code' => 'const typed = 1;']);

        $this->previewHtml($attributes, true);
        $this->previewHtml($this->attributes(['profile' => ''], ['code' => 'a(); // [!code hl]']), true);
        $this->assertSame([], $written);

        $this->frontEnd($attributes);
        $this->assertCount(1, $written);
        code_block_pro_cache_set($written[0], ['html' => '<pre><code>from the cache</code></pre>', 'lines' => 1]);
        $this->assertStringContainsString('from the cache', $this->previewHtml($attributes, true));
    }

    public function test_the_first_preview_of_saved_code_writes_the_page_render_cache()
    {
        $this->needsMbregex();
        $written = [];
        add_action('set_transient', function ($name) use (&$written) {
            if (str_starts_with($name, 'code_block_pro_')) {
                $written[] = $name;
            }
        });
        $saved = $this->attributes(['profile' => ''], ['code' => 'const saved = 1;']);

        $this->preview(['attributes' => $saved, 'keepMarkers' => true, 'saved' => true]);
        $this->assertCount(1, $written);
        // A marker makes the editor's render differ from the page's, so it has no page entry to fill.
        $this->preview(['attributes' => $this->attributes(['profile' => ''], ['code' => 'a(); // [!code hl]']), 'keepMarkers' => true, 'saved' => true]);
        $this->assertCount(1, $written);

        code_block_pro_cache_set($written[0], ['html' => '<pre><code>from the cache</code></pre>', 'lines' => 1]);
        $this->assertStringContainsString('from the cache', $this->frontEnd($saved));
    }

    public function test_a_kept_render_and_a_front_end_render_never_share_a_cache_entry()
    {
        $this->needsMbregex();
        $code = "a(); // [!code hl]\nb();";
        $attributes = $this->attributes(['profile' => ''], ['code' => $code]);

        // Both orders, as either side may be the one cached first.
        $kept = $this->previewHtml($attributes, true);
        $front = $this->frontEnd($attributes);
        $keptAgain = $this->previewHtml($attributes, true);
        $frontAgain = $this->frontEnd($attributes);

        $this->assertSame($code, $this->codeText($kept));
        $this->assertSame("a();\nb();", $this->codeText($front));
        $this->assertSame($kept, $keptAgain);
        $this->assertSame($front, $frontAgain);
    }
}
