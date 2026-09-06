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

    public function test_update_is_withheld_when_the_upgrade_is_blocked()
    {
        add_filter('blocks.codeBlockPro.canUpgrade', '__return_false');

        $filtered = apply_filters('site_transient_update_plugins', $this->transient());

        $this->assertArrayNotHasKey($this->basename, $filtered->response);
    }

    public function test_other_plugins_are_untouched_when_the_upgrade_is_blocked()
    {
        add_filter('blocks.codeBlockPro.canUpgrade', '__return_false');

        $filtered = apply_filters('site_transient_update_plugins', $this->transient());

        $this->assertArrayHasKey('other-plugin/other-plugin.php', $filtered->response);
    }

    public function test_update_is_offered_when_the_upgrade_is_allowed()
    {
        add_filter('blocks.codeBlockPro.canUpgrade', '__return_true');

        $filtered = apply_filters('site_transient_update_plugins', $this->transient());

        $this->assertArrayHasKey($this->basename, $filtered->response);
    }

    public function test_a_one_point_release_still_reaches_a_blocked_site()
    {
        add_filter('blocks.codeBlockPro.canUpgrade', '__return_false');

        $transient = $this->transient();
        $transient->response[$this->basename] = (object) ['new_version' => '1.29.0'];

        $filtered = apply_filters('site_transient_update_plugins', $transient);

        $this->assertArrayHasKey($this->basename, $filtered->response);
    }

    public function test_an_offer_with_no_version_is_left_alone()
    {
        add_filter('blocks.codeBlockPro.canUpgrade', '__return_false');

        $transient = $this->transient();
        $transient->response[$this->basename] = (object) [];

        $filtered = apply_filters('site_transient_update_plugins', $transient);

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
        add_filter('blocks.codeBlockPro.canUpgrade', '__return_false');

        $this->assertFalse(apply_filters('site_transient_update_plugins', false));
    }
}
