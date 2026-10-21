<?php

class BlockTest extends WP_UnitTestCase
{
    public const NAME = 'kevinbatdorf/code-block-pro';

    public function set_up()
    {
        parent::set_up();
        wp_dequeue_script('code-block-pro-view');
        foreach (wp_styles()->queue as $handle) {
            if (str_starts_with($handle, 'code-block-pro-font-')) {
                wp_dequeue_style($handle);
            }
        }
    }

    public function tear_down()
    {
        wp_dequeue_script('code-block-pro-view');
        $GLOBALS['wp_query']->is_feed = false;
        parent::tear_down();
    }

    private function needsMbregex()
    {
        if (!function_exists('mb_ereg_search_init')) {
            $this->markTestSkipped('Highlighting needs mbregex.');
        }
    }

    /** Panes as the editor stores them, code escaped. */
    private function render($attributes, ...$panes)
    {
        $panes = array_map(fn ($pane) => $pane + ['language' => 'javascript', 'code' => ''], $panes ?: [['code' => 'a();']]);
        foreach ($panes as $i => $pane) {
            $panes[$i]['code'] = strtr($pane['code'], ['&' => '&amp;', '<' => '&lt;', '>' => '&gt;']);
        }
        $attributes = $attributes + ['version' => 2, 'panes' => $panes];

        return render_block(parse_blocks('<!-- wp:' . self::NAME . ' ' . serialize_block_attributes($attributes) . ' /-->')[0]);
    }

    private function xpath($html)
    {
        $doc = new DOMDocument();
        libxml_use_internal_errors(true);
        $doc->loadHTML('<?xml encoding="UTF-8">' . $html);
        libxml_clear_errors();

        return new DOMXPath($doc);
    }

    /**
     * @return list<array{string, string}> each line's text and class
     */
    private function lines($html)
    {
        $lines = [];
        foreach ($this->xpath($html)->query('//code/*') as $line) {
            $lines[] = [preg_replace("/\n\z/", '', $line->textContent), $line->getAttribute('class')];
        }

        return $lines;
    }

    private function profile($slug, $data)
    {
        code_block_pro_insert_profile($slug, $data);

        return $slug;
    }

    public function test_a_marker_in_a_comment_marks_its_line_and_leaves_the_code()
    {
        $this->needsMbregex();

        $html = $this->render(['profile' => ''], ['code' => "a(); // [!code ++]\nb(); // [!code --]\nc(); // [!code hl]\nd(); // [!code focus]\ne();"]);

        $this->assertSame([['a();', 'line cbp-add'], ['b();', 'line cbp-del'], ['c();', 'line cbp-hl'], ['d();', 'line cbp-focus'], ['e();', 'line']], $this->lines($html));
        $this->assertStringNotContainsString('!code', $html);
    }

    public function test_a_marker_in_a_string_stays_as_written()
    {
        $this->needsMbregex();
        $code = "const s = '// [!code ++]';\nconst t = `\n// [!code hl]\n`;";

        $html = $this->render(['profile' => ''], ['code' => $code]);

        $this->assertSame(explode("\n", $code), array_column($this->lines($html), 0));
        $this->assertSame(['line'], array_unique(array_column($this->lines($html), 1)));
    }

    public function test_a_line_holding_only_a_marker_goes_and_marks_the_lines_after_it()
    {
        $this->needsMbregex();

        $html = $this->render(['profile' => ''], ['code' => "// [!code highlight:2]\na();\nb();\nc();\n    // [!code ++]\nd();"]);

        $this->assertSame([['a();', 'line cbp-hl'], ['b();', 'line cbp-hl'], ['c();', 'line'], ['d();', 'line cbp-add']], $this->lines($html));
    }

    public function test_comment_text_beside_a_marker_stays()
    {
        $this->needsMbregex();

        $html = $this->render(['profile' => ''], ['code' => 'a(); // keep this [!code hl] [!code ++]']);

        $this->assertSame([['a(); // keep this', 'line cbp-hl cbp-add']], $this->lines($html));
    }

    public function test_markers_work_in_each_languages_own_comments()
    {
        $this->needsMbregex();
        $cases = [
            'php' => ["<?php\n\$a = 1; # [!code ++]\n\$b = 2; /* [!code --] */", ['<?php', '$a = 1;', '$b = 2;']],
            'python' => ["a = 1  # [!code hl]", ['a = 1']],
            'html' => ['<p>a</p> <!-- [!code ++] -->', ['<p>a</p>']],
            'sql' => ['SELECT 1; -- [!code focus]', ['SELECT 1;']],
            'css' => ['a { color: red; } /* [!code hl] */', ['a { color: red; }']],
        ];

        foreach ($cases as $language => [$code, $expected]) {
            $lines = $this->lines($this->render(['profile' => ''], ['language' => $language, 'code' => $code]));
            $this->assertSame($expected, array_column($lines, 0), $language);
            $this->assertNotSame('line', end($lines)[1], $language);
        }
    }

    public function test_marker_comments_come_out_whole_and_leave_the_code_around_them()
    {
        $this->needsMbregex();
        $cases = [
            ['kotlin', "// [!code hl]\nfun a() {}", [['fun a() {}', 'line cbp-hl']]],
            ['dart', "  // [!code ++]\n  print(1);", [['  print(1);', 'line cbp-add']]],
            ['rust', "    /* [!code hl] */\nfn a() {}", [['fn a() {}', 'line cbp-hl']]],
            ['javascript', '  /* [!code hl] */ a();', [['  a();', 'line cbp-hl']]],
            ['javascript', "/** @type {Foo} [!code hl] */\nconst a = x;", [['/** @type {Foo} */', 'line cbp-hl'], ['const a = x;', 'line']]],
            ['jsx', "<div>\n    {/* [!code hl] */}\n    <p/>\n</div>", [['<div>', 'line'], ['    <p/>', 'line cbp-hl'], ['</div>', 'line']]],
            // A comment that spans lines keeps both of its delimiters.
            ['javascript', "a(); /* [!code hl]\n more */\nb();", [['a(); /*', 'line cbp-hl'], [' more */', 'line'], ['b();', 'line']]],
            ['html', "<!-- note\n[!code hl] -->\n<p>a</p>", [['<!-- note', 'line'], [' -->', 'line cbp-hl'], ['<p>a</p>', 'line']]],
        ];

        foreach ($cases as [$language, $code, $expected]) {
            $this->assertSame($expected, $this->lines($this->render(['profile' => ''], ['language' => $language, 'code' => $code])), "$language: $code");
        }
    }

    public function test_the_plain_fallback_strips_the_same_single_line_markers()
    {
        $this->needsMbregex();
        $cases = [
            ['kotlin', "// [!code hl]\nfun a() {}"],
            ['rust', "    /* [!code hl] */\nfn a() {}"],
            ['javascript', "  /* [!code hl] */ a();\nb(); // [!code ++]\nc(); // note [!code --]"],
            ['jsx', "<div>\n    {/* [!code hl] */}\n    <p/>\n</div>"],
            ['php', "<?php\n\$a = 1; # [!code focus:2]\n\$b = 2;"],
        ];

        foreach ($cases as [$language, $code]) {
            $highlighted = $this->lines($this->render(['profile' => ''], ['language' => $language, 'code' => $code]));
            add_filter('blocks.codeBlockPro.canUpgrade', '__return_false');
            $this->assertSame($highlighted, $this->lines($this->render(['profile' => ''], ['language' => $language, 'code' => $code])), "$language: $code");
            remove_all_filters('blocks.codeBlockPro.canUpgrade');
        }
    }

    public function test_without_mbregex_markers_and_line_features_still_apply()
    {
        $this->needsMbregex();
        $pane = ['code' => "a(); // [!code ++]\n// [!code hl]\nb();\nc();", 'focusLines' => '3'];
        $highlighted = $this->lines($this->render(['profile' => ''], $pane));

        add_filter('blocks.codeBlockPro.canUpgrade', '__return_false');
        $plain = $this->lines($this->render(['profile' => ''], $pane));

        $this->assertSame($highlighted, $plain);
        $this->assertSame([['a();', 'line cbp-add'], ['b();', 'line cbp-hl'], ['c();', 'line cbp-focus']], $plain);
    }

    public function test_line_lists_use_the_numbers_on_screen()
    {
        $this->needsMbregex();
        $slug = $this->profile('numbered', ['settings' => ['lineNumbers' => true]]);

        $html = $this->render(['profile' => $slug], ['code' => "a\nb\nc\nd", 'startLine' => 98, 'highlightLines' => '98, 100-101', 'sharpLines' => '99', 'addedLines' => '100', 'removedLines' => '101']);
        $xpath = $this->xpath($html);

        $this->assertSame(['98', '99', '100', '101'], array_map(fn ($line) => $line->getAttribute('data-line'), iterator_to_array($xpath->query('//code/*'))));
        $this->assertSame(['span', 'span', 'ins', 'del'], array_map(fn ($line) => $line->nodeName, iterator_to_array($xpath->query('//code/*'))));
        $this->assertSame([['a', 'line cbp-hl'], ['b', 'line cbp-sharp'], ['c', 'line cbp-hl cbp-add'], ['d', 'line cbp-hl cbp-del']], $this->lines($html));
        $this->assertSame('cbp-has-sharp cbp-has-diff cbp-digits-3', $xpath->query('//pre')->item(0)->getAttribute('class'));
        $this->assertStringContainsString('cbp-numbers', $xpath->query('//div')->item(0)->getAttribute('class'));
    }

    public function test_line_anchors_take_the_blocks_anchor_and_the_pane()
    {
        $this->needsMbregex();

        $html = $this->render(['profile' => '', 'lineAnchors' => true, 'anchor' => 'set up"><x'], ['code' => "a\nb"], ['code' => 'c', 'language' => 'php']);
        $xpath = $this->xpath($html);

        $this->assertSame(['set-up"><x-L1', 'set-up"><x-L2', 'set-up"><x-2-L1'], array_map(fn ($node) => $node->value, iterator_to_array($xpath->query('//code/*/@id'))));
        $this->assertSame('set-up"><x', $xpath->query('//div')->item(0)->getAttribute('id'));
        $this->assertSame(0, $xpath->query('//x')->length);
        $this->assertSame([], iterator_to_array($this->xpath($this->render(['profile' => ''], ['code' => 'a']))->query('//@id')));
    }

    public function test_blocks_without_an_anchor_still_get_unique_line_ids()
    {
        $this->needsMbregex();

        $ids = [];
        foreach ([1, 2, 3] as $n) {
            $ids[] = $this->xpath($this->render(['profile' => '', 'lineAnchors' => true], ['code' => 'a']))->query('//code/*/@id')->item(0)->value;
        }

        $this->assertCount(3, array_unique($ids));
    }

    public function test_two_panes_render_as_tabs_and_the_first_shows()
    {
        $this->needsMbregex();

        $html = $this->render(['profile' => '', 'theme' => 'nord'], ['code' => 'a();', 'label' => 'index.js'], ['code' => '<?php b();', 'language' => 'php']);
        $xpath = $this->xpath($html);
        $tabs = $xpath->query('//*[@role="tab"]');
        $panes = $xpath->query('//*[@role="tabpanel"]');

        $this->assertSame(1, $xpath->query('//*[@role="tablist"]')->length);
        $this->assertSame(['index.js', 'PHP'], [$tabs->item(0)->textContent, $tabs->item(1)->textContent]);
        $this->assertSame(['true', 'false'], [$tabs->item(0)->getAttribute('aria-selected'), $tabs->item(1)->getAttribute('aria-selected')]);
        $this->assertSame('-1', $tabs->item(1)->getAttribute('tabindex'));
        $this->assertSame($panes->item(1)->getAttribute('id'), $tabs->item(1)->getAttribute('aria-controls'));
        $this->assertSame($tabs->item(1)->getAttribute('id'), $panes->item(1)->getAttribute('aria-labelledby'));
        $this->assertStringContainsString('cbp-active', $panes->item(0)->getAttribute('class'));
        $this->assertStringNotContainsString('cbp-active', $panes->item(1)->getAttribute('class'));
        $this->assertSame('cbp-theme-nord', $panes->item(1)->getAttribute('data-cbp-theme'));
        $this->assertSame(['index.js', 'PHP'], array_map(fn ($node) => $node->textContent, iterator_to_array($xpath->query('//*[@class="cbp-pane-label"]'))));
        $this->assertTrue(wp_script_is('code-block-pro-view', 'enqueued'));
    }

    public function test_the_buttons_come_from_the_profile()
    {
        $slug = $this->profile('buttons', [
            'conditions' => [['id' => 'light', 'name' => 'Light', 'theme' => 'github-light'], ['id' => 'dark', 'name' => 'Dark', 'theme' => 'dracula', 'trigger' => ['type' => 'media', 'value' => '(prefers-color-scheme: dark)']]],
            'buttons' => [
                ['type' => 'copy', 'icon' => 'twoSquares', 'label' => '', 'copiedLabel' => ''],
                ['type' => 'copy', 'icon' => 'textSimple', 'label' => 'Grab', 'copiedLabel' => 'Got it'],
                ['type' => 'toggle', 'label' => '', 'conditions' => ['light', 'dark']],
                ['type' => 'custom', 'id' => 'run', 'label' => 'Run'],
            ],
        ]);

        $xpath = $this->xpath($this->render(['profile' => $slug]));
        $buttons = $xpath->query('//button');

        $this->assertSame(4, $buttons->length);
        $this->assertSame(['Copy', 'Copied!'], [$buttons->item(0)->getAttribute('aria-label'), $buttons->item(0)->getAttribute('data-cbp-copied')]);
        $this->assertSame(['Grab', 'Got it'], [$buttons->item(1)->textContent, $buttons->item(1)->getAttribute('data-cbp-copied')]);
        $this->assertSame([['', 'Auto'], ['light', 'Light'], ['dark', 'Dark']], json_decode($buttons->item(2)->getAttribute('data-cbp-states'), true));
        $this->assertSame('Theme Auto', $buttons->item(2)->textContent);
        $this->assertSame(['run', 'Run'], [$buttons->item(3)->getAttribute('data-cbp-button'), $buttons->item(3)->textContent]);
        $this->assertSame($slug, $xpath->query('//div')->item(0)->getAttribute('data-cbp-profile'));
        $this->assertSame(1, $xpath->query('//*[@role="status"]')->length);
        $this->assertTrue(wp_script_is('code-block-pro-view', 'enqueued'));
    }

    public function test_a_block_with_nothing_to_click_loads_no_script()
    {
        $html = $this->render(['profile' => $this->profile('quiet', ['settings' => ['headerType' => 'none'], 'buttons' => []])]);

        $this->assertFalse(wp_script_is('code-block-pro-view', 'enqueued'));
        $this->assertStringNotContainsString('cbp-header', $html);
    }

    public function test_buttons_without_a_header_sit_over_the_code()
    {
        $html = $this->render(['profile' => $this->profile('overlay', ['settings' => ['headerType' => 'none'], 'buttons' => [['type' => 'copy']]])]);

        $this->assertStringContainsString('class="cbp-header cbp-header-overlay', $html);
    }

    public function test_see_more_shows_only_when_the_fold_hides_a_line()
    {
        $slug = $this->profile('more', ['settings' => ['seeMoreType' => 'blockRight', 'seeMoreString' => 'More', 'seeMoreCollapse' => true]]);

        $xpath = $this->xpath($this->render(['profile' => $slug], ['code' => "a\nb\nc", 'seeMoreAfter' => 2]));
        $button = $xpath->query('//*[contains(@class, "cbp-more-button")]')->item(0);

        $this->assertSame('More', $button->textContent);
        $this->assertSame(['false', 'Collapse'], [$button->getAttribute('aria-expanded'), $button->getAttribute('data-cbp-collapse')]);
        $this->assertSame($xpath->query('//*[contains(@class, "cbp-pane")]')->item(0)->getAttribute('id'), $button->getAttribute('aria-controls'));
        $this->assertSame('cbp-fold cbp-fold1-2', $xpath->query('//pre')->item(0)->getAttribute('class'));
        $this->assertStringNotContainsString('cbp-more', $this->render(['profile' => $slug], ['code' => "a\nb", 'seeMoreAfter' => 2]));
    }

    public function test_a_fold_with_no_button_still_clamps_the_code()
    {
        $html = $this->render(['profile' => $this->profile('clamp', ['settings' => ['seeMoreType' => '']])], ['code' => "a\nb\nc", 'seeMoreAfter' => 1]);

        $this->assertStringContainsString('cbp-fold cbp-fold1-1', $html);
        $this->assertStringNotContainsString('cbp-more', $html);
    }

    public function test_the_footer_shows_the_text_or_a_link()
    {
        $slug = $this->profile('footer', ['settings' => ['footerType' => 'simpleStringStart']]);

        $plain = $this->xpath($this->render(['profile' => $slug]));
        $linked = $this->xpath($this->render(['profile' => $slug, 'footerString' => 'Docs', 'footerLink' => 'https://example.com/a?b=1', 'footerLinkTarget' => true]));
        $hostile = $this->render(['profile' => $slug, 'footerLink' => 'javascript:alert(1)']);

        $this->assertSame('JavaScript', $plain->query('//*[contains(@class, "cbp-footer")]')->item(0)->textContent);
        $link = $linked->query('//a')->item(0);
        $this->assertSame(['Docs', 'https://example.com/a?b=1', '_blank', 'noopener noreferrer'], [$link->textContent, $link->getAttribute('href'), $link->getAttribute('target'), $link->getAttribute('rel')]);
        $this->assertStringNotContainsString('javascript:', $hostile);
    }

    public function test_text_from_the_block_and_profile_is_escaped_and_inert()
    {
        $slug = $this->profile('texts', ['settings' => ['headerType' => 'simpleString'], 'buttons' => [['type' => 'custom', 'id' => 'x', 'label' => '[gallery] <b>']]]);

        $html = $this->render(['profile' => $slug, 'headerString' => '<script>alert(1)</script> [gallery]'], ['code' => 'a', 'label' => '<i>tab</i>'], ['code' => 'b']);

        $this->assertStringNotContainsString('<script>', $html);
        $this->assertStringNotContainsString('<b>', $html);
        $this->assertStringNotContainsString('<i>', $html);
        $this->assertStringNotContainsString('[', $html);
        $this->assertSame($html, do_shortcode($html));
    }

    public function test_each_line_option_renders_fresh_rather_than_from_another_blocks_cache()
    {
        $this->needsMbregex();
        $code = "a();\nb();";

        $first = $this->lines($this->render(['profile' => ''], ['code' => $code, 'highlightLines' => '1']));
        $second = $this->lines($this->render(['profile' => ''], ['code' => $code, 'highlightLines' => '2']));
        $GLOBALS['wp_query']->is_feed = true;
        $feed = $this->render(['profile' => ''], ['code' => $code, 'highlightLines' => '2']);

        $this->assertSame(['line cbp-hl', 'line'], array_column($first, 1));
        $this->assertSame(['line', 'line cbp-hl'], array_column($second, 1));
        $this->assertStringContainsString('style=', $feed);
    }

    public function test_attribute_values_from_the_block_and_profile_are_escaped()
    {
        // Condition names reach the switch only with the Theme Pack's conditions on.
        add_filter('blocks.codeBlockPro.customConditions', '__return_true');
        $hostile = 'x" onclick="alert(1)';
        $slug = $this->profile('quotes', [
            'conditions' => [['id' => 'main', 'name' => $hostile, 'theme' => 'nord'], ['id' => 'dark', 'name' => '</button><b>', 'theme' => 'dracula', 'trigger' => ['type' => 'button']]],
            'buttons' => [['type' => 'copy', 'label' => $hostile, 'copiedLabel' => $hostile], ['type' => 'toggle', 'conditions' => ['main', 'dark']]],
            'settings' => ['seeMoreType' => 'blockLeft', 'seeMoreString' => $hostile],
        ]);

        $xpath = $this->xpath($this->render(['profile' => $slug], ['code' => "a\nb", 'seeMoreAfter' => 1, 'label' => $hostile], ['code' => 'c']));

        $this->assertSame(0, $xpath->query('//@onclick')->length);
        $this->assertSame(0, $xpath->query('//b')->length);
        $this->assertSame($hostile, $xpath->query('//*[contains(@class, "cbp-copy")]/@aria-label')->item(0)->value);
        $this->assertSame([['', 'Auto'], ['main', $hostile], ['dark', 'dark']], json_decode($xpath->query('//*[contains(@class, "cbp-toggle")]/@data-cbp-states')->item(0)->value, true));
        $this->assertSame($hostile, $xpath->query('//*[contains(@class, "cbp-more-button")]/@data-cbp-expand')->item(0)->value);
        $this->assertSame($hostile, $xpath->query('//*[@role="tab"]')->item(0)->textContent);
    }

    public function test_a_block_whose_only_control_is_see_more_loads_the_script()
    {
        $slug = $this->profile('fold-only', ['settings' => ['headerType' => 'none', 'seeMoreType' => 'roundCenter'], 'buttons' => []]);

        $this->render(['profile' => $slug], ['code' => "a\nb", 'seeMoreAfter' => 1]);

        $this->assertTrue(wp_script_is('code-block-pro-view', 'enqueued'));
    }

    public function test_a_block_using_every_feature_carries_no_inline_style()
    {
        $slug = $this->profile('everything', [
            'settings' => ['lineNumbers' => true, 'highlightingHover' => true, 'headerType' => 'pillString', 'footerType' => 'simpleStringEnd', 'seeMoreType' => 'roundCenter', 'seeMoreTransition' => true, 'fontSize' => '1rem'],
            'conditions' => [['id' => 'light', 'theme' => 'github-light'], ['id' => 'dark', 'theme' => 'dracula', 'trigger' => ['type' => 'media', 'value' => '(prefers-color-scheme: dark)']]],
            'buttons' => [['type' => 'copy'], ['type' => 'toggle'], ['type' => 'custom', 'id' => 'run']],
        ]);

        $html = $this->render(
            ['profile' => $slug, 'lineAnchors' => true, 'removeBlurOnHover' => true, 'footerString' => 'f'],
            ['code' => "a(); // [!code ++]\nb();\nc();", 'highlightLines' => '1', 'sharpLines' => '2', 'focusLines' => '3', 'seeMoreAfter' => 1],
            ['code' => '<?php d();', 'language' => 'php']
        );

        $this->assertStringNotContainsString('style=', $html);
        $this->assertStringContainsString('data-code-block-pro="' . CODE_BLOCK_PRO_VERSION . '"', $html);
        $this->assertStringContainsString('cbp-block cbp-profile-everything cbp-numbers cbp-hover cbp-reveal cbp-has-footer cbp-tabbed cbp-more-transition', $html);
    }

    public function test_a_feed_gets_inline_colors_because_readers_load_no_stylesheet()
    {
        $this->needsMbregex();
        $GLOBALS['wp_query']->is_feed = true;

        $html = $this->render(['profile' => '', 'theme' => 'nord'], ['code' => 'const a = 1;']);

        $this->assertStringContainsString('<div class="cbp-pane" style="--cbp-fg:#d8dee9ff;--cbp-bg:#2e3440ff;color:#d8dee9ff;background-color:#2e3440ff">', $html);
        $this->assertMatchesRegularExpression('#<span [^>]*style="color: \#81A1C1;"[^>]*>const</span>#', $html);
        $this->assertStringNotContainsString('cbp-theme-', $html);
    }

    public function test_a_block_loads_only_the_font_its_profile_uses()
    {
        $this->render(['profile' => '']);
        $this->render(['profile' => $this->profile('fira', ['settings' => ['fontFamily' => 'Code-Pro-Fira-Code']])]);
        $this->render(['profile' => $this->profile('system', ['settings' => ['fontFamily' => '']])]);

        $fonts = array_values(array_filter(wp_styles()->queue, fn ($handle) => str_starts_with($handle, 'code-block-pro-font-')));
        $this->assertSame(['code-block-pro-font-Code-Pro-JetBrains-Mono', 'code-block-pro-font-Code-Pro-Fira-Code'], $fonts);
        $this->assertStringEndsWith('/build/fonts/Code-Pro-Fira-Code.css', wp_styles()->registered['code-block-pro-font-Code-Pro-Fira-Code']->src);
    }

    public function test_profile_font_settings_reach_the_page_through_its_stylesheet()
    {
        code_block_pro_insert_profile('fonts', ['settings' => ['fontSize' => '1rem', 'lineHeight' => '1.5rem', 'clampFonts' => true, 'fontFamily' => 'Code-Pro-Comic-Mono.ttf', 'tabSize' => 4]]);
        code_block_pro_insert_profile('plain', []);

        $this->assertSame(
            ['.cbp-block.cbp-profile-fonts{font-size:clamp(16px, 1rem, 24px);line-height:clamp(24px, 1.5rem, 36px);font-family:Code-Pro-Comic-Mono,ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;tab-size:4}'],
            code_block_pro_profile_setting_rules(code_block_pro_profile('fonts'))
        );
        $this->assertStringStartsWith('.cbp-block.cbp-profile-fonts{', code_block_pro_profile_css(code_block_pro_profile('fonts')));
        $this->assertTrue(code_block_pro_profile_needs_stylesheet(code_block_pro_profile('fonts')));
        $this->assertFalse(code_block_pro_profile_needs_stylesheet(code_block_pro_profile('plain')));
    }
}
