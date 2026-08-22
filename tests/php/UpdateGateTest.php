<?php

class UpdateGateTest extends WP_UnitTestCase
{
    private $basename;

    public function set_up()
    {
        parent::set_up();
        $this->basename = plugin_basename(dirname(__DIR__, 2) . '/code-block-pro.php');
    }

    private function transient()
    {
        $transient = new stdClass();
        $transient->response = [
            $this->basename => (object) ['new_version' => '2.0.0'],
            'other-plugin/other-plugin.php' => (object) ['new_version' => '1.0.0'],
        ];

        return $transient;
    }

    public function test_update_is_withheld_when_highlighting_is_unavailable()
    {
        add_filter('blocks.codeBlockPro.canHighlight', '__return_false');

        $filtered = apply_filters('site_transient_update_plugins', $this->transient());

        $this->assertArrayNotHasKey($this->basename, $filtered->response);
    }

    public function test_other_plugins_are_untouched_when_highlighting_is_unavailable()
    {
        add_filter('blocks.codeBlockPro.canHighlight', '__return_false');

        $filtered = apply_filters('site_transient_update_plugins', $this->transient());

        $this->assertArrayHasKey('other-plugin/other-plugin.php', $filtered->response);
    }

    public function test_update_is_offered_when_highlighting_is_available()
    {
        add_filter('blocks.codeBlockPro.canHighlight', '__return_true');

        $filtered = apply_filters('site_transient_update_plugins', $this->transient());

        $this->assertArrayHasKey($this->basename, $filtered->response);
    }

    public function test_the_build_decides_when_nothing_overrides_the_capability()
    {
        $filtered = apply_filters('site_transient_update_plugins', $this->transient());

        if (function_exists('mb_ereg_search_init')) {
            $this->assertArrayHasKey($this->basename, $filtered->response);

            return;
        }

        $this->assertArrayNotHasKey($this->basename, $filtered->response);
    }

    public function test_an_empty_transient_survives_the_gate()
    {
        add_filter('blocks.codeBlockPro.canHighlight', '__return_false');

        $this->assertFalse(apply_filters('site_transient_update_plugins', false));
    }

    public function test_the_upgrader_refuses_us_when_highlighting_is_unavailable()
    {
        add_filter('blocks.codeBlockPro.canHighlight', '__return_false');

        $response = apply_filters('upgrader_pre_install', true, ['plugin' => $this->basename]);

        $this->assertWPError($response);
    }

    public function test_the_upgrader_installs_us_when_highlighting_is_available()
    {
        add_filter('blocks.codeBlockPro.canHighlight', '__return_true');

        $response = apply_filters('upgrader_pre_install', true, ['plugin' => $this->basename]);

        $this->assertTrue($response);
    }

    public function test_the_upgrader_still_installs_other_plugins()
    {
        add_filter('blocks.codeBlockPro.canHighlight', '__return_false');

        $response = apply_filters('upgrader_pre_install', true, ['plugin' => 'other-plugin/other-plugin.php']);

        $this->assertTrue($response);
    }

    public function test_an_install_naming_no_plugin_is_left_alone()
    {
        add_filter('blocks.codeBlockPro.canHighlight', '__return_false');

        $response = apply_filters('upgrader_pre_install', true, ['type' => 'plugin', 'action' => 'install']);

        $this->assertTrue($response);
    }
}
