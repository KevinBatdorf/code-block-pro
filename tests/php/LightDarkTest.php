<?php

class LightDarkTest extends WP_UnitTestCase
{
    public const NAME = 'kevinbatdorf/code-block-pro';

    public function set_up()
    {
        parent::set_up();
        wp_dequeue_script('code-block-pro-view');
    }

    public function tear_down()
    {
        wp_dequeue_script('code-block-pro-view');
        parent::tear_down();
    }

    private function conditions(array ...$conditions)
    {
        return code_block_pro_sanitize_profile(['conditions' => [['id' => 'light', 'theme' => 'github-light'], ...$conditions]])['conditions'];
    }

    private function render($slug)
    {
        $attributes = ['version' => 2, 'profile' => $slug, 'panes' => [['language' => 'javascript', 'code' => 'a();']]];

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

    public function test_dark_follows_the_browser_setting()
    {
        $conditions = $this->conditions(['id' => 'dark', 'theme' => 'dracula', 'trigger' => ['type' => 'media', 'value' => '(prefers-color-scheme: dark)']]);

        $this->assertSame(['light', 'dark'], array_column($conditions, 'id'));
        $this->assertSame(['type' => 'media', 'value' => '(prefers-color-scheme: dark)'], $conditions[1]['trigger']);
    }

    public function test_dark_can_follow_a_class_on_the_page()
    {
        $conditions = $this->conditions(['id' => 'dark', 'theme' => 'dracula', 'trigger' => ['type' => 'class', 'value' => 'dark-mode']]);

        $this->assertSame(['type' => 'class', 'value' => 'dark-mode'], $conditions[1]['trigger']);
    }

    /**
     * @dataProvider otherTriggers
     */
    public function test_any_other_trigger_is_dropped($trigger)
    {
        $this->assertSame(['light'], array_column($this->conditions(['id' => 'other', 'theme' => 'dracula', 'trigger' => $trigger]), 'id'));
    }

    public static function otherTriggers()
    {
        return [
            'a switch button only' => [['type' => 'button']],
            'another media query' => [['type' => 'media', 'value' => '(min-width: 600px)']],
            'a class that is not one' => [['type' => 'class', 'value' => 'x) body (.y']],
            'no trigger' => [null],
        ];
    }

    public function test_a_profile_has_one_dark_at_most()
    {
        $conditions = $this->conditions(
            ['id' => 'dark', 'theme' => 'dracula', 'trigger' => ['type' => 'media', 'value' => '(prefers-color-scheme: dark)']],
            ['id' => 'night', 'theme' => 'monokai', 'trigger' => ['type' => 'class', 'value' => 'night']],
        );

        $this->assertSame(['light', 'dark'], array_column($conditions, 'id'));
    }

    public function test_a_dropped_condition_takes_its_language_themes_with_it()
    {
        $profile = code_block_pro_sanitize_profile([
            'conditions' => [['id' => 'light', 'theme' => 'github-light'], ['id' => 'fun', 'theme' => 'dracula', 'trigger' => ['type' => 'button']]],
            'languages' => ['php' => ['light' => 'nord', 'fun' => 'monokai']],
        ]);

        $this->assertSame(['php' => ['light' => 'nord']], $profile['languages']);
    }

    public function test_the_theme_pack_brings_back_every_condition_and_trigger()
    {
        add_filter('blocks.codeBlockPro.customConditions', '__return_true');

        $conditions = $this->conditions(
            ['id' => 'dark', 'theme' => 'dracula', 'trigger' => ['type' => 'media', 'value' => '(prefers-color-scheme: dark)']],
            ['id' => 'wide', 'theme' => 'monokai', 'trigger' => ['type' => 'media', 'value' => '(min-width: 600px)']],
            ['id' => 'fun', 'theme' => 'nord', 'trigger' => ['type' => 'button']],
        );

        $this->assertSame(['light', 'dark', 'wide', 'fun'], array_column($conditions, 'id'));
    }

    public function test_the_switch_changes_the_page_and_remembers_unless_told_otherwise()
    {
        $buttons = code_block_pro_sanitize_profile(['buttons' => [
            ['type' => 'toggle'],
            ['type' => 'toggle', 'scope' => 'site', 'remember' => false],
            ['type' => 'toggle', 'scope' => 'everywhere'],
        ]])['buttons'];

        $this->assertSame([['page', true], ['site', false], ['page', true]], array_map(fn ($button) => [$button['scope'], $button['remember']], $buttons));
    }

    public function test_a_block_with_a_dark_theme_names_both_and_needs_no_script()
    {
        code_block_pro_insert_profile('both', ['conditions' => [
            ['id' => 'light', 'theme' => 'github-light'],
            ['id' => 'dark', 'theme' => 'dracula', 'trigger' => ['type' => 'media', 'value' => '(prefers-color-scheme: dark)']],
        ]]);

        $block = $this->xpath($this->render('both'))->query('//div')->item(0);

        $this->assertSame(['light', 'dark'], [$block->getAttribute('data-cbp-light'), $block->getAttribute('data-cbp-dark')]);
        $this->assertFalse(wp_script_is('code-block-pro-view', 'enqueued'));
    }

    public function test_the_switch_offers_auto_light_and_dark_with_its_settings()
    {
        code_block_pro_insert_profile('switch', [
            'conditions' => [
                ['id' => 'main', 'name' => 'Anything', 'theme' => 'github-light'],
                ['id' => 'c1', 'name' => 'Else', 'theme' => 'dracula', 'trigger' => ['type' => 'class', 'value' => 'dark-mode']],
            ],
            'buttons' => [['type' => 'toggle', 'scope' => 'block', 'remember' => false]],
        ]);

        $toggle = $this->xpath($this->render('switch'))->query('//*[contains(@class, "cbp-toggle")]')->item(0);

        $this->assertSame([['', 'Auto'], ['light', 'Light'], ['dark', 'Dark']], json_decode($toggle->getAttribute('data-cbp-states'), true));
        $this->assertSame(['block', '0'], [$toggle->getAttribute('data-cbp-scope'), $toggle->getAttribute('data-cbp-remember')]);
    }

    public function test_without_a_dark_theme_there_is_no_switch()
    {
        code_block_pro_insert_profile('light-only', ['buttons' => [['type' => 'toggle'], ['type' => 'copy']]]);

        $xpath = $this->xpath($this->render('light-only'));

        $this->assertSame(0, $xpath->query('//*[contains(@class, "cbp-toggle")]')->length);
        $this->assertSame(1, $xpath->query('//*[contains(@class, "cbp-copy")]')->length);
    }
}
