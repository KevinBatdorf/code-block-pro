<?php

class HighlightTest extends WP_UnitTestCase
{
    public const NAME = 'kevinbatdorf/code-block-pro';

    private $encoding;

    public function set_up()
    {
        parent::set_up();
        $this->encoding = function_exists('mb_regex_encoding') ? mb_regex_encoding() : null;
        $this->dequeueThemes();
    }

    public function tear_down()
    {
        if ($this->encoding) {
            mb_regex_encoding($this->encoding);
            mb_regex_set_options('pr');
        }
        $this->dequeueThemes();
        parent::tear_down();
    }

    private function dequeueThemes()
    {
        foreach (array_keys(wp_styles()->registered) as $handle) {
            if (str_starts_with($handle, 'code-block-pro-theme-')) {
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

    /** The editor stores code HTML-escaped. */
    private function markup($code, $language = 'javascript', $theme = null)
    {
        $attributes = ['version' => 2, 'profile' => '', 'panes' => [['language' => $language, 'code' => strtr($code, ['&' => '&amp;', '<' => '&lt;', '>' => '&gt;'])]]];
        if ($theme !== null) {
            $attributes['theme'] = $theme;
        }

        return '<!-- wp:' . self::NAME . ' ' . serialize_block_attributes($attributes) . ' /-->';
    }

    private function render($code, $language = 'javascript', $theme = 'nord')
    {
        return render_block(parse_blocks($this->markup($code, $language, $theme))[0]);
    }

    private function renderStored($attributes)
    {
        $pane = ['language' => $attributes['language'] ?? 'javascript', 'code' => $attributes['code']];
        $block = ['version' => 2, 'profile' => '', 'theme' => $attributes['theme'] ?? 'nord', 'panes' => [$pane]];

        return render_block(parse_blocks('<!-- wp:' . self::NAME . ' ' . serialize_block_attributes($block) . ' /-->')[0]);
    }

    private function codeText($html)
    {
        $this->assertSame(1, preg_match('#<code>(.*)</code>#s', $html, $match), $html);

        return html_entity_decode(strip_tags($match[1]), ENT_QUOTES | ENT_HTML5, 'UTF-8');
    }

    private function lines($html)
    {
        $doc = new DOMDocument();
        libxml_use_internal_errors(true);
        $doc->loadHTML('<?xml encoding="UTF-8">' . $html);
        libxml_clear_errors();
        $lines = [];
        foreach ((new DOMXPath($doc))->query('//code/span[@class="line"]') as $line) {
            $lines[] = preg_replace("/\n\z/", '', $line->textContent);
        }

        return $lines;
    }

    /** The key a freeflow nord block with no line features caches under. */
    private function key($code, $language = 'javascript')
    {
        return code_block_pro_cache_key($code, $language, code_block_pro_block_profile(['profile' => '', 'theme' => 'nord']), [code_block_pro_no_line_options(), true]);
    }

    private function themeFile($json)
    {
        $file = wp_tempnam('cbp-theme') . '.json';
        file_put_contents($file, $json);

        return $file;
    }

    private function storedPanes()
    {
        $panes = [];
        foreach (glob(dirname(__DIR__) . '/fixtures/blocks/[0-9]*.html') as $file) {
            foreach (parse_blocks(file_get_contents($file)) as $i => $block) {
                if ($block['blockName'] !== self::NAME || !isset($block['attrs']['code'])) {
                    continue;
                }
                $panes[basename($file, '.html') . "[$i]"] = $block['attrs'];
            }
        }

        return $panes;
    }

    public function test_a_2x_block_is_colored_through_classes()
    {
        $this->needsMbregex();

        $html = $this->render('const a = 1;', 'javascript', 'nord');

        $this->assertMatchesRegularExpression('#<span class="[^"]*phiki-storage\.type\.js[^"]*cbp-81a1c1[^"]*">const</span>#', $html);
        $this->assertStringContainsString('<div class="cbp-pane cbp-theme-nord"><pre tabindex="0">', $html);
    }

    public function test_every_language_the_editor_offers_has_a_grammar()
    {
        $this->needsMbregex();
        $samples = ['jinja-html' => '{% if a %}<b>{{ a }}</b>{% endif %}', 'wenyan' => '吾有一數。曰三。', '文言' => '吾有一數。曰三。'];
        foreach ($samples as $language => $code) {
            $html = $this->render($code, $language, 'nord');
            $this->assertMatchesRegularExpression('#class="[^"]*phiki-[^"]* cbp-[0-9a-f]{6}#', $html, $language);
        }

        // The editor leaves out ANSI, which 2.0 shows as plain text, and Bicep, whose grammar phiki can't compile.
        $offered = array_diff(array_keys(json_decode((string) file_get_contents(dirname(__DIR__, 2) . '/src/languages.json'), true)), ['ansi', 'bicep']);
        code_block_pro_issues(true);
        try {
            foreach ($offered as $language) {
                code_block_pro_highlight('x', (string) $language, code_block_pro_profile('default'));
            }
            $issues = code_block_pro_issues();
        } finally {
            code_block_pro_issues(false);
        }
        $this->assertSame([], array_column((array) $issues, 'message'));
    }

    public function test_code_cannot_add_attributes_through_scope_names()
    {
        $this->needsMbregex();
        $theme = $this->themeFile(file_get_contents(dirname(__DIR__, 2) . '/build/themes/nord.json'));
        add_filter('blocks.codeBlockPro.themeFiles', function ($themes) use ($theme) {
            return $themes + ['third-party' => $theme];
        });
        $code = '<x"onmouseover="alert(1)">hi</x>';

        foreach (['html', 'svelte', 'astro'] as $language) {
            foreach (['nord', 'third-party'] as $slug) {
                $html = $this->render($code, $language, $slug);
                $doc = new DOMDocument();
                libxml_use_internal_errors(true);
                $doc->loadHTML('<?xml encoding="UTF-8">' . $html);
                libxml_clear_errors();
                $names = [];
                foreach ((new DOMXPath($doc))->query('//pre//@*') as $attribute) {
                    $names[$attribute->nodeName] = true;
                }

                $this->assertSame([], array_diff(array_keys($names), ['class', 'tabindex', 'style']), "$language/$slug");
                $this->assertSame($code, $this->codeText($html), "$language/$slug");
            }
        }
    }

    public function test_a_filter_theme_cannot_add_attributes_through_its_colors()
    {
        $this->needsMbregex();
        $theme = $this->themeFile(wp_json_encode([
            'name' => 'hostile',
            'colors' => ['editor.background' => '#000" onmouseover="alert(1)', 'editor.foreground' => "#fff\n"],
            'tokenColors' => [['scope' => 'storage', 'settings' => ['foreground' => '#81a1c1" onclick="alert(1)']]],
        ]));
        add_filter('blocks.codeBlockPro.themeFiles', function ($themes) use ($theme) {
            return $themes + ['hostile' => $theme];
        });

        $html = $this->render('const a = 1;', 'javascript', 'hostile');

        $this->assertStringNotContainsString('onmouseover', $html);
        $this->assertStringNotContainsString('onclick', $html);
        $this->assertSame('const a = 1;', $this->codeText($html));
    }

    public function test_multibyte_code_keeps_every_character_and_its_scopes()
    {
        $this->needsMbregex();

        $python = $this->render('def fünc(ä, b="ö"): pass', 'python', 'nord');
        $php = $this->render('<?php echo "Größe"; function foo(array $a) {}', 'php', 'nord');

        $this->assertSame('def fünc(ä, b="ö"): pass', $this->codeText($python));
        $this->assertMatchesRegularExpression('#phiki-entity\.name\.function\.python[^"]*">fünc</span>#', $python);
        $this->assertSame('<?php echo "Größe"; function foo(array $a) {}', $this->codeText($php));
        $this->assertMatchesRegularExpression('#phiki-entity\.name\.function\.php[^"]*">foo</span>#', $php);
        $this->assertSame('UTF-8', mb_internal_encoding());
    }

    public function test_another_plugins_regex_options_change_nothing()
    {
        $this->needsMbregex();
        $expected = $this->render('const FUNCTION = 1;', 'javascript', 'nord');
        delete_transient($this->key('const FUNCTION = 1;'));
        mb_regex_set_options('i');
        $options = mb_regex_set_options();

        $html = $this->render('const FUNCTION = 1;', 'javascript', 'nord');

        $this->assertSame($expected, $html);
        $this->assertSame($options, mb_regex_set_options());
    }

    /**
     * @return list<array{string, string|null}> each character with the color it is painted
     */
    private function paintedGlyphs($html, callable $colorOf)
    {
        $doc = new DOMDocument();
        libxml_use_internal_errors(true);
        $doc->loadHTML('<?xml encoding="UTF-8">' . $html);
        libxml_clear_errors();
        $glyphs = [];
        foreach ((new DOMXPath($doc))->query('//code/span[contains(concat(" ", @class, " "), " line ")]') as $i => $line) {
            if ($i > 0) {
                $glyphs[] = ["\n", null];
            }
            $start = count($glyphs);
            foreach ((new DOMXPath($doc))->query('.//text()', $line) as $text) {
                $color = $colorOf($text->parentNode);
                foreach (mb_str_split($text->nodeValue) as $char) {
                    $glyphs[] = [$char, $color];
                }
            }
            // 2.x lines end with their own newline; 1.x put it between them.
            if (count($glyphs) > $start && end($glyphs)[0] === "\n") {
                array_pop($glyphs);
            }
        }
        while ($glyphs && end($glyphs)[0] === "\n") {
            array_pop($glyphs);
        }

        return $glyphs;
    }

    private function normalizedColor($color)
    {
        $color = strtolower($color);
        if (strlen($color) === 4) {
            $color = '#' . $color[1] . $color[1] . $color[2] . $color[2] . $color[3] . $color[3];
        }

        return strlen($color) === 9 && str_ends_with($color, 'ff') ? substr($color, 0, 7) : $color;
    }

    public function test_js_ts_php_and_python_fixtures_paint_every_character_the_color_1x_did()
    {
        $this->needsMbregex();
        $languages = ['javascript', 'typescript', 'tsx', 'jsx', 'php', 'python'];
        $build = dirname(__DIR__, 2) . '/build/themes';
        $misses = [];

        foreach ($this->storedPanes() as $where => $pane) {
            $theme = $pane['theme'] ?? 'nord';
            if (!in_array($pane['language'] ?? 'javascript', $languages, true) || !is_file("$build/$theme.css")) {
                continue;
            }
            preg_match("/\\.cbp-theme-$theme\\{color:(#[0-9a-f]+)/", file_get_contents("$build/$theme.css"), $default);
            $code = empty($pane['useDecodeURI']) ? html_entity_decode($pane['code'], ENT_QUOTES | ENT_HTML5, 'UTF-8') : rawurldecode($pane['code']);
            $ours = $this->paintedGlyphs(code_block_pro_highlight($code, $pane['language'] ?? 'javascript', code_block_pro_block_profile(['profile' => '', 'theme' => $theme])), function ($node) use ($default) {
                return preg_match('/\bcbp-([0-9a-f]{3,8})\b/', $node->getAttribute('class'), $m) ? "#$m[1]" : $default[1];
            });
            $theirs = $this->paintedGlyphs($pane['codeHTML'], function ($node) {
                return preg_match('/color: (#[0-9A-Fa-f]+)/', $node->getAttribute('style'), $m) ? $m[1] : null;
            });

            $this->assertSame(array_column($theirs, 0), array_column($ours, 0), "$where: text");
            foreach ($theirs as $i => [$char, $color]) {
                if (trim($char) !== '' && $this->normalizedColor($color) !== $this->normalizedColor($ours[$i][1])) {
                    $misses[] = "$where ($theme) char $i '$char': 1.x $color, 2.0 {$ours[$i][1]}";
                }
            }
        }

        $this->assertSame([], array_slice($misses, 0, 25), count($misses) . ' characters differ');
    }

    public function test_no_2x_block_carries_an_inline_style()
    {
        $this->needsMbregex();

        foreach ($this->storedPanes() as $where => $pane) {
            $this->assertStringNotContainsString('style=', $this->renderStored($pane), $where);
        }
    }

    public function test_highlighting_keeps_every_character_of_the_code()
    {
        $this->needsMbregex();

        foreach ($this->storedPanes() as $where => $pane) {
            $code = strtr($pane['code'], ['&amp;' => '&', '&lt;' => '<', '&gt;' => '>']);
            $expected = preg_replace("/\n\z/", '', str_replace(["\r\n", "\r"], "\n", $code));

            $this->assertSame($expected, $this->codeText($this->renderStored($pane)), $where);
        }
    }

    public function test_without_mbregex_the_code_renders_as_plain_text()
    {
        add_filter('blocks.codeBlockPro.canUpgrade', '__return_false');

        $html = $this->render("<b>x</b> &amp; [gallery]\nconst a = 1;\n", 'javascript', 'nord');

        $this->assertSame("<b>x</b> &amp; [gallery]\nconst a = 1;", $this->codeText($html));
        $this->assertSame(['<b>x</b> &amp; [gallery]', 'const a = 1;'], $this->lines($html));
        $this->assertStringNotContainsString('phiki-', $html);
        $this->assertStringNotContainsString('style=', $html);
        $this->assertStringContainsString('cbp-theme-nord', $html);
        $this->assertSame($html, do_shortcode($html));
    }

    public function test_without_mbregex_a_cached_highlight_is_not_served()
    {
        code_block_pro_cache_set($this->key('const a = 1;'), ['html' => '<pre>cached</pre>', 'lines' => 1]);
        add_filter('blocks.codeBlockPro.canUpgrade', '__return_false');

        $html = $this->render('const a = 1;', 'javascript', 'nord');

        $this->assertStringNotContainsString('cached', $html);
        $this->assertSame('const a = 1;', $this->codeText($html));
    }

    public function test_a_highlight_that_throws_falls_back_to_plain_text_and_restores_the_regex_encoding()
    {
        $this->needsMbregex();
        $broken = $this->themeFile('{}');
        add_filter('blocks.codeBlockPro.themeFiles', function ($themes) use ($broken) {
            return $themes + ['broken' => $broken];
        });
        mb_regex_encoding('EUC-JP');

        $html = $this->render('const a = 1;', 'javascript', 'broken');

        $this->assertSame('EUC-JP', mb_regex_encoding());
        $this->assertSame(['const a = 1;'], $this->lines($html));
        $this->assertStringNotContainsString('phiki-', $html);
    }

    public function test_highlighting_reads_utf8_whatever_the_regex_encoding_and_restores_it()
    {
        $this->needsMbregex();
        mb_regex_encoding('EUC-JP');

        $html = $this->render('const s = "héllo 文字"; // ✓', 'javascript', 'nord');

        $this->assertSame('EUC-JP', mb_regex_encoding());
        $this->assertSame('const s = "héllo 文字"; // ✓', $this->codeText($html));
        $this->assertStringContainsString('phiki-string.quoted.double.js', $html);
    }

    public function test_the_last_newline_is_dropped_and_line_endings_are_normalized()
    {
        $this->needsMbregex();

        $this->assertSame(['a', 'b'], $this->lines($this->render("a\nb\n")));
        $this->assertSame(['a', 'b', ''], $this->lines($this->render("a\nb\n\n")));
        $this->assertSame(['a', 'b'], $this->lines($this->render("a\r\nb\r\n")));
        $this->assertSame(['a', '', 'b'], $this->lines($this->render("a\r\rb")));
        $this->assertSame([''], $this->lines($this->render('')));
    }

    public function test_each_line_but_the_last_ends_with_its_own_newline()
    {
        $this->needsMbregex();

        foreach ([true, false] as $mbregex) {
            add_filter('blocks.codeBlockPro.canUpgrade', $mbregex ? '__return_true' : '__return_false');
            $doc = new DOMDocument();
            libxml_use_internal_errors(true);
            $doc->loadHTML('<?xml encoding="UTF-8">' . $this->render("a\n\nb"));
            libxml_clear_errors();
            $xpath = new DOMXPath($doc);

            $this->assertSame(["a\n", "\n", 'b'], array_map(fn ($line) => $line->textContent, iterator_to_array($xpath->query('//code/span'))));
            // Blank lines drop out of a copied selection in Chrome and Safari when the newline sits between lines.
            $this->assertSame(0, $xpath->query('//code/text()')->length);
            remove_all_filters('blocks.codeBlockPro.canUpgrade');
        }
    }

    public function test_highlighted_code_is_inert()
    {
        $this->needsMbregex();

        $html = $this->render('<b>bold</b> &amp; [gallery] <script>alert(1)</script>', 'html', 'nord');

        $this->assertSame('<b>bold</b> &amp; [gallery] <script>alert(1)</script>', $this->codeText($html));
        $this->assertStringNotContainsString('<script>', $html);
        $this->assertStringNotContainsString('[', $html);
        $this->assertSame($html, do_shortcode($html));
    }

    public function test_code_saved_by_a_user_without_unfiltered_html_survives_kses()
    {
        $code = "<?php\nif (\$a && \$b > 1) { echo '<script>alert(1)</script> &amp; [gallery]'; }";
        wp_set_current_user(self::factory()->user->create(['role' => 'author']));
        kses_init();

        $saved = wp_unslash(apply_filters('content_save_pre', wp_slash($this->markup($code, 'php', 'nord'))));
        $html = render_block(parse_blocks($saved)[0]);

        $this->assertTrue(has_filter('content_save_pre', 'wp_filter_post_kses') !== false);
        $this->assertSame($code, $this->codeText($html));
    }

    public function test_only_the_three_escapes_the_editor_writes_are_decoded()
    {
        $this->needsMbregex();
        $stored = serialize_block_attributes(['version' => 2, 'profile' => '', 'panes' => [['language' => 'javascript', 'code' => 'f("?a=1&copy=2&copy;&quot;&amp;lt;")']]]);

        $html = render_block(parse_blocks('<!-- wp:' . self::NAME . " $stored /-->")[0]);

        $this->assertSame('f("?a=1&copy=2&copy;&quot;&lt;")', $this->codeText($html));
    }

    public function test_an_unknown_language_renders_as_plain_text()
    {
        $html = $this->render('just words', 'totally-fake', 'nord');

        $this->assertSame(['just words'], $this->lines($html));
        $this->assertStringContainsString('cbp-theme-nord', $html);
    }

    public function test_an_unknown_theme_renders_with_dracula()
    {
        $html = $this->render('const a = 1;', 'javascript', 'not-a-theme');

        $this->assertStringContainsString('cbp-theme-dracula', $html);
        $this->assertTrue(wp_style_is('code-block-pro-theme-dracula', 'enqueued'));
    }

    public function test_the_block_loads_its_theme_stylesheet()
    {
        $this->render('const a = 1;', 'javascript', 'github-light');

        $this->assertTrue(wp_style_is('code-block-pro-theme-github-light', 'enqueued'));
        $this->assertStringEndsWith('/build/themes/github-light.css', wp_styles()->registered['code-block-pro-theme-github-light']->src);
        $this->assertFalse(wp_style_is('code-block-pro-theme-nord', 'enqueued'));
    }

    public function test_every_color_a_shipped_theme_can_paint_has_a_rule()
    {
        $build = dirname(__DIR__, 2) . '/build/themes';
        $themes = glob("$build/*.json");

        $this->assertCount(27, $themes);
        foreach ($themes as $json) {
            $slug = basename($json, '.json');
            $css = file_get_contents("$build/$slug.css");
            $this->assertMatchesRegularExpression("/\\.cbp-theme-$slug\\{color:(#[0-9a-f]+);background-color:(#[0-9a-f]+);--cbp-fg:\\1;--cbp-bg:\\2\\}/", $css, $slug);
            $this->assertMatchesRegularExpression("/\\.cbp-theme-$slug code\\{color:#[0-9a-f]+\\}/", $css, $slug);
            foreach (json_decode(file_get_contents($json), true)['tokenColors'] as $rule) {
                $color = $rule['settings']['foreground'] ?? null;
                if ($color === null) {
                    continue;
                }
                $this->assertStringContainsString('.' . code_block_pro_color_class($color) . '{color:' . strtolower($color) . '}', $css, $slug);
            }
        }
    }

    public function test_a_theme_without_a_stylesheet_falls_back_to_inline_styles()
    {
        $this->needsMbregex();
        $theme = $this->themeFile(file_get_contents(dirname(__DIR__, 2) . '/build/themes/nord.json'));
        add_filter('blocks.codeBlockPro.themeFiles', function ($themes) use ($theme) {
            return $themes + ['third-party' => $theme];
        });

        $html = $this->render('const a = 1;', 'javascript', 'third-party');

        $this->assertMatchesRegularExpression('#<span [^>]*style="color: \#81A1C1;"[^>]*>const</span>#', $html);
        $this->assertStringNotContainsString('cbp-theme-', $html);
        $this->assertFalse(wp_style_is('code-block-pro-theme-third-party', 'enqueued'));
    }

    public function test_a_highlight_is_cached()
    {
        $this->needsMbregex();
        $key = $this->key('const a = 1;');

        $first = $this->render('const a = 1;', 'javascript', 'nord');
        $this->assertStringContainsString(code_block_pro_cache_get($key)['html'], $first);
        $this->assertStringStartsWith('z:', get_transient($key));

        code_block_pro_cache_set($key, ['html' => '<pre>cached</pre>', 'lines' => 1]);
        $this->assertStringContainsString('<pre>cached</pre>', $this->render('const a = 1;', 'javascript', 'nord'));
    }

    public function test_the_cache_key_changes_with_each_input()
    {
        $nord = code_block_pro_block_profile(['profile' => '', 'theme' => 'nord']);
        $key = code_block_pro_cache_key('a', 'javascript', $nord, [1], '2.0.0');

        $this->assertNotSame($key, code_block_pro_cache_key('b', 'javascript', $nord, [1], '2.0.0'));
        $this->assertNotSame($key, code_block_pro_cache_key('a', 'php', $nord, [1], '2.0.0'));
        $this->assertNotSame($key, code_block_pro_cache_key('a', 'javascript', code_block_pro_block_profile(['profile' => '', 'theme' => 'dracula']), [1], '2.0.0'));
        $this->assertNotSame($key, code_block_pro_cache_key('a', 'javascript', $nord, [2], '2.0.0'));
        $this->assertNotSame($key, code_block_pro_cache_key('a', 'javascript', $nord, [1], '2.0.1'));
        $this->assertSame($key, code_block_pro_cache_key('a', 'javascript', $nord, [1], '2.0.0'));
    }

    private function renderKept($code, $language = 'javascript')
    {
        code_block_pro_keep_markers(true);
        try {
            return code_block_pro_render_code($code, $language, code_block_pro_block_profile(['profile' => '', 'theme' => 'nord']));
        } finally {
            code_block_pro_keep_markers(false);
        }
    }

    public function test_kept_markers_count_only_the_lines_the_front_end_shows()
    {
        $this->needsMbregex();
        $code = "// [!code hl]\na(); // [!code ++]\n  // [!code focus]";

        foreach (['__return_true', '__return_false'] as $canUpgrade) {
            add_filter('blocks.codeBlockPro.canUpgrade', $canUpgrade);
            $front = code_block_pro_render_code($code, 'javascript', code_block_pro_block_profile(['profile' => '', 'theme' => 'nord']));
            $kept = $this->renderKept($code);

            $this->assertSame(1, $front['lines'], $canUpgrade);
            $this->assertSame(1, $kept['lines'], $canUpgrade);
            $this->assertSame($code, $this->codeText($kept['html']), $canUpgrade);
            $this->assertSame(2, preg_match_all('#<span class="line cbp-marker">#', $kept['html']), $canUpgrade);
            $this->assertMatchesRegularExpression('#^<pre class="cbp-has-diff" tabindex="0"><code><span class="line cbp-marker">.*</span><ins class="line cbp-hl cbp-add">.*</ins><span class="line cbp-marker">.*</span></code></pre>$#s', $kept['html'], $canUpgrade);
            remove_all_filters('blocks.codeBlockPro.canUpgrade');
        }
    }

    public function test_kept_markers_cache_apart_from_the_front_end()
    {
        $this->needsMbregex();
        $code = 'a(); // [!code hl]';

        $kept = $this->renderKept($code);
        $this->assertFalse(get_transient($this->key($code)));
        $front = $this->render($code);

        $this->assertSame($code, $this->codeText($kept['html']));
        $this->assertSame('a();', $this->codeText($front));
        $this->assertNotFalse(get_transient($this->key($code)));
        $this->assertSame($kept, $this->renderKept($code));
    }

    public function test_a_cached_value_that_does_not_decode_is_a_miss()
    {
        set_transient('code_block_pro_test', 'z:not base64');
        $this->assertNull(code_block_pro_cache_get('code_block_pro_test'));
        set_transient('code_block_pro_test', '<pre>raw</pre>');
        $this->assertNull(code_block_pro_cache_get('code_block_pro_test'));
    }

    public function test_the_version_constant_matches_the_plugin_header()
    {
        $header = get_file_data(dirname(__DIR__, 2) . '/code-block-pro.php', ['Version' => 'Version']);

        $this->assertSame($header['Version'], CODE_BLOCK_PRO_VERSION);
    }
}
