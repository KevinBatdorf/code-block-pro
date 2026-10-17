<?php

class RenderTest extends WP_UnitTestCase
{
    const NAME = 'kevinbatdorf/code-block-pro';
    const SCRIPT = 'kevinbatdorf-code-block-pro-view-script';
    const STYLE = 'kevinbatdorf-code-block-pro-style';

    public function tear_down()
    {
        wp_dequeue_script(self::SCRIPT);
        wp_dequeue_style(self::STYLE);
        parent::tear_down();
    }

    public static function fixtures()
    {
        $cases = [];
        foreach (glob(dirname(__DIR__) . '/fixtures/blocks/[0-9]*.html') as $file) {
            $cases[basename($file, '.html')] = [$file];
        }

        return $cases;
    }

    private function storedBlocks($file)
    {
        return array_values(array_filter(
            parse_blocks(file_get_contents($file)),
            function ($block) {
                return $block['blockName'] === self::NAME;
            }
        ));
    }

    private function storedBlock($slug)
    {
        return $this->storedBlocks(dirname(__DIR__) . "/fixtures/blocks/$slug.html")[0];
    }

    private function v2Block($code)
    {
        $attributes = wp_json_encode(['version' => 2, 'panes' => [['language' => 'html', 'code' => $code]]]);

        return parse_blocks('<!-- wp:' . self::NAME . ' ' . $attributes . ' /-->')[0];
    }

    public function test_the_block_renders_on_the_server()
    {
        $type = WP_Block_Type_Registry::get_instance()->get_registered(self::NAME);

        $this->assertNotNull($type);
        $this->assertTrue($type->is_dynamic());
    }

    public function test_the_block_loads_no_1x_asset_for_every_render()
    {
        $type = WP_Block_Type_Registry::get_instance()->get_registered(self::NAME);
        $handles = array_merge($type->style_handles, $type->view_style_handles, $type->script_handles, $type->view_script_handles);

        $this->assertNotContains(self::STYLE, $handles);
        $this->assertNotContains(self::SCRIPT, $handles);
    }

    public function test_the_1x_stylesheet_loads_up_front_where_block_stylesheets_do()
    {
        add_filter('should_load_block_assets_on_demand', '__return_false');

        wp_enqueue_registered_block_scripts_and_styles();

        $this->assertTrue(wp_style_is(self::STYLE, 'enqueued'));
    }

    public function test_the_1x_stylesheet_waits_for_a_1x_block_where_block_stylesheets_load_on_demand()
    {
        add_filter('should_load_block_assets_on_demand', '__return_true');

        wp_enqueue_registered_block_scripts_and_styles();

        $this->assertFalse(wp_style_is(self::STYLE, 'enqueued'));
    }

    /**
     * @dataProvider fixtures
     */
    public function test_a_stored_block_renders_its_saved_html_byte_for_byte($file)
    {
        $blocks = $this->storedBlocks($file);

        $this->assertNotEmpty($blocks);
        foreach ($blocks as $block) {
            $this->assertSame($block['innerHTML'], render_block($block));
        }
    }

    public function test_a_stored_block_loads_the_1x_front_end_from_its_1x_paths()
    {
        render_block($this->storedBlock('01-bare'));

        $this->assertTrue(wp_script_is(self::SCRIPT, 'enqueued'));
        $this->assertTrue(wp_style_is(self::STYLE, 'enqueued'));
        $this->assertStringEndsWith('/build/front/front.js', wp_scripts()->registered[self::SCRIPT]->src);
        $this->assertStringEndsWith('/build/style-index.css', wp_styles()->registered[self::STYLE]->src);
    }

    public function test_the_1x_front_script_is_told_where_the_plugin_is()
    {
        $after = implode("\n", wp_scripts()->get_data(self::SCRIPT, 'after') ?: []);
        $url = esc_url_raw(plugin_dir_url(dirname(__DIR__, 2) . '/code-block-pro.php'));

        $this->assertStringContainsString('window.codeBlockPro = ' . wp_json_encode(['pluginUrl' => $url]), $after);
    }

    public function test_rendering_a_stored_block_writes_nothing()
    {
        $writes = [];
        add_filter('query', function ($query) use (&$writes) {
            if (preg_match('/^\s*(INSERT|UPDATE|DELETE|REPLACE)\b/i', $query)) {
                $writes[] = $query;
            }

            return $query;
        });

        render_block($this->storedBlock('06-long-file'));

        $this->assertSame([], $writes);
    }

    public function test_a_2x_block_loads_none_of_the_1x_front_end()
    {
        render_block($this->v2Block('const a = 1;'));

        $this->assertFalse(wp_script_is(self::SCRIPT, 'enqueued'));
        $this->assertFalse(wp_style_is(self::STYLE, 'enqueued'));
    }

    public function test_a_2x_block_renders_its_code_as_inert_text()
    {
        $html = render_block($this->v2Block('<b>bold</b> &amp; [gallery]'));

        $this->assertStringContainsString('&lt;b&gt;bold&lt;/b&gt; &amp;amp; &#91;gallery&#93;', $html);
        $this->assertSame($html, do_shortcode($html));
    }
}
