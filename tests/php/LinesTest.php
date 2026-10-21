<?php

class LinesTest extends WP_UnitTestCase
{
    public function test_a_line_list_takes_numbers_dash_ranges_and_1x_bracket_ranges()
    {
        $this->assertSame([1, 3, 4, 5], code_block_pro_parse_lines('1,3-5'));
        $this->assertSame([1, 3, 4, 5], code_block_pro_parse_lines('1, [3, 5]'));
        $this->assertSame([2, 7, 8], code_block_pro_parse_lines(' 8 7-8 2 '));
        $this->assertSame([3], code_block_pro_parse_lines('[3,3]'));
        $this->assertSame([12], code_block_pro_parse_lines(12));
    }

    public function test_a_bad_piece_of_a_line_list_is_skipped_not_the_whole_list()
    {
        $this->assertSame([1, 4], code_block_pro_parse_lines('1, x, 4'));
        $this->assertSame([1], code_block_pro_parse_lines('1,'));
        $this->assertSame([], code_block_pro_parse_lines('5-3'));
        $this->assertSame([], code_block_pro_parse_lines('-1'));
        $this->assertSame([], code_block_pro_parse_lines(''));
        $this->assertSame([], code_block_pro_parse_lines(['1']));
        $this->assertCount(10001, code_block_pro_parse_lines('1-999999'));
    }

    public function test_line_options_read_the_pane_and_the_profile()
    {
        $options = code_block_pro_line_options(
            ['startLine' => '10', 'highlightLines' => '10,12', 'focusLines' => '11', 'sharpLines' => '1-2', 'addedLines' => '13', 'removedLines' => '14', 'seeMoreAfter' => '5'],
            ['lineNumbers' => true],
            'intro-',
            true
        );

        $this->assertSame(['start' => 10, 'numbers' => true, 'anchor' => 'intro-', 'highlight' => [10, 12], 'focus' => [11], 'sharp' => [1, 2], 'added' => [13], 'removed' => [14], 'fold' => 5], $options);
        $this->assertNull(code_block_pro_line_options([], [], 'intro-', false)['anchor']);
        $this->assertSame(1, code_block_pro_line_options(['startLine' => 'abc'], [])['start']);
        $this->assertSame(0, code_block_pro_line_options(['startLine' => -4], [])['start']);
    }

    public function test_lists_hold_display_numbers_so_the_start_shifts_them()
    {
        $options = code_block_pro_line_options(['startLine' => 998, 'highlightLines' => '1, 999, 1000, 2000'], []);

        $this->assertSame([1 => ['cbp-hl'], 2 => ['cbp-hl']], code_block_pro_line_flags(3, $options));
    }

    public function test_markers_add_to_the_lists_from_the_pane()
    {
        $options = code_block_pro_line_options(['highlightLines' => '1'], []);

        $this->assertSame([0 => ['cbp-hl', 'cbp-add'], 1 => ['cbp-focus']], code_block_pro_line_flags(2, $options, [0 => ['added'], 1 => ['focus'], 5 => ['removed']]));
    }

    public function test_a_line_carries_its_number_and_anchor_only_when_something_reads_them()
    {
        $plain = code_block_pro_no_line_options();
        $numbered = ['numbers' => true, 'start' => 5] + $plain;
        $anchored = ['anchor' => 'intro-'] + $plain;

        $this->assertSame(['class' => 'line'], code_block_pro_line_attributes(0, $plain, []));
        $this->assertSame(['class' => 'line cbp-hl', 'data-line' => '6'], code_block_pro_line_attributes(1, $numbered, ['cbp-hl']));
        $this->assertSame(['class' => 'line', 'id' => 'intro-L3'], code_block_pro_line_attributes(2, $anchored, []));
        $this->assertSame(['class' => 'line cbp-add'], code_block_pro_line_attributes(0, $plain, ['cbp-add']));
    }

    public function test_the_pre_names_which_line_features_the_pane_uses()
    {
        $options = ['numbers' => true, 'start' => 95, 'fold' => 3] + code_block_pro_no_line_options();

        $classes = code_block_pro_pre_classes(10, $options, [0 => ['cbp-focus'], 1 => ['cbp-add']]);

        $this->assertSame(['cbp-has-focus', 'cbp-has-diff', 'cbp-digits-3', 'cbp-fold', 'cbp-fold1-3'], $classes);
    }

    public function test_a_fold_at_or_past_the_last_line_folds_nothing()
    {
        $options = ['fold' => 10] + code_block_pro_no_line_options();

        $this->assertSame([], code_block_pro_pre_classes(10, $options, []));
        $this->assertContains('cbp-fold', code_block_pro_pre_classes(11, $options, []));
    }

    public function test_numbers_go_into_css_one_digit_at_a_time()
    {
        $this->assertSame(['cbp-fold1-7', 'cbp-fold3-3'], code_block_pro_digit_classes('fold', 307));
        $this->assertSame(999, code_block_pro_line_options(['seeMoreAfter' => 5000], [])['fold']);
    }

    public function test_plain_text_markers_come_out_of_the_comment_that_holds_them()
    {
        $stripped = code_block_pro_strip_markers_plain([
            'a(); // [!code ++]',
            '// [!code highlight]',
            'b(); // keep this [!code hl]',
            '# [!code focus:2]',
            'c',
            'd <!-- [!code --] -->',
            's = "[!code ++]";',
        ]);

        $this->assertSame(['a();', 'b(); // keep this', 'c', 'd', 's = "[!code ++]";'], $stripped['lines']);
        $marked = $stripped['marked'];
        ksort($marked);
        $this->assertSame([0 => ['added'], 1 => ['highlight'], 2 => ['focus'], 3 => ['focus', 'removed']], array_map(function ($features) {
            sort($features);

            return $features;
        }, $marked));
    }

    public function test_the_plain_fallback_takes_only_markers_that_end_a_comment()
    {
        $lines = [
            "const s = '// [!code hl]';",
            'a(); // see 50% [!code hl]',
            '// TODO: x; [!code hl]',
            'a(); [!code hl]',
            's = "a // b"; // [!code ++]',
            'x /* [!code --] */',
        ];

        $stripped = code_block_pro_strip_markers_plain($lines);

        $this->assertSame(["const s = '// [!code hl]';", 'a(); // see 50%', '// TODO: x;', 'a(); [!code hl]', 's = "a // b";', 'x'], $stripped['lines']);
        $this->assertSame([1, 2, 4, 5], array_keys($stripped['marked']));
    }

    public function test_a_block_comment_left_open_keeps_its_opener()
    {
        $stripped = code_block_pro_strip_markers_plain([
            'a(); /* [!code hl]',
            'still a comment */',
            '<div> <!-- [!code ++]',
            'more -->',
        ]);

        $this->assertSame(['a(); /*', 'still a comment */', '<div> <!--', 'more -->'], $stripped['lines']);
        $this->assertSame([0, 2], array_keys($stripped['marked']));
    }

    public function test_kept_markers_leave_each_plain_line_as_written_and_name_the_lines_the_front_end_drops()
    {
        $lines = ['// [!code highlight]', 'a(); // [!code ++]', '    # [!code focus:2]', 'b();', 'c(); // note [!code --]', 's = "[!code ++]";'];

        $front = code_block_pro_strip_markers_plain($lines);
        $kept = code_block_pro_strip_markers_plain($lines, true);

        $this->assertSame(['a();', 'b();', 'c(); // note', 's = "[!code ++]";'], $front['lines']);
        $this->assertSame([], $front['markers']);
        $this->assertSame($lines, $kept['lines']);
        $this->assertSame([0 => true, 2 => true], $kept['markers']);
        $this->assertSame($front['marked'], $kept['marked']);
    }

    public function test_keep_markers_is_off_until_switched_on()
    {
        $this->assertFalse(code_block_pro_keep_markers());
        $this->assertTrue(code_block_pro_keep_markers(true));
        $this->assertTrue(code_block_pro_keep_markers());
        $this->assertFalse(code_block_pro_keep_markers(false));
        $this->assertFalse(code_block_pro_keep_markers());
    }

    public function test_marker_ranges_cost_one_step_per_line()
    {
        $start = microtime(true);
        code_block_pro_strip_markers_plain(array_fill(0, 5000, 'x // [!code hl:9999]'));

        $this->assertLessThan(1, microtime(true) - $start);
        $this->assertCount(10001, code_block_pro_parse_lines(implode(',', array_map(fn ($n) => ($n * 10000 + 1) . '-' . ($n * 10000 + 10000), range(0, 99)))));
    }
}
