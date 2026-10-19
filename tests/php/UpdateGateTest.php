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

    public function test_the_capability_check_covers_every_mbregex_function_phiki_calls()
    {
        $gate = file_get_contents(dirname(__DIR__, 2) . '/php/update-gate.php');
        $called = [];
        $files = new RecursiveIteratorIterator(new RecursiveDirectoryIterator(dirname(__DIR__, 2) . '/vendor/phiki/phiki/src'));
        foreach ($files as $file) {
            if ($file->getExtension() === 'php' && preg_match_all('/\bmb_ereg\w*(?=\()/', file_get_contents($file->getPathname()), $found)) {
                $called = array_merge($called, $found[0]);
            }
        }

        $this->assertNotEmpty($called);
        foreach (array_unique($called) as $function) {
            $this->assertStringContainsString("'$function'", $gate);
        }
    }

    public function test_site_health_says_whether_this_server_can_color_code()
    {
        $tests = apply_filters('site_status_tests', ['direct' => [], 'async' => []]);
        $this->assertArrayHasKey('code_block_pro_mbregex', $tests['direct']);
        $run = $tests['direct']['code_block_pro_mbregex']['test'];

        add_filter('blocks.codeBlockPro.canUpgrade', '__return_true');
        $this->assertSame('good', $run()['status']);

        add_filter('blocks.codeBlockPro.canUpgrade', '__return_false');
        $result = $run();
        $this->assertSame('critical', $result['status']);
        $this->assertStringContainsString('mbregex', $result['description']);
        $this->assertStringContainsString('https://wordpress.org/plugins/code-block-pro/advanced/', $result['actions']);
    }

    public function test_the_plugins_screen_explains_a_server_without_mbregex()
    {
        $row = function () {
            ob_start();
            do_action("after_plugin_row_{$this->basename}", $this->basename, [], 'all');

            return (string) ob_get_clean();
        };

        add_filter('blocks.codeBlockPro.canUpgrade', '__return_true');
        $this->assertSame('', $row());

        add_filter('blocks.codeBlockPro.canUpgrade', '__return_false');
        $this->assertStringContainsString('mbregex', $row());

        $this->assertStringContainsString('<tr class="plugin-update-tr">', $row());
        update_option('active_plugins', [$this->basename]);
        $this->assertStringContainsString('<tr class="plugin-update-tr active">', $row());
    }

    public function test_the_inserter_offers_no_block_on_a_server_without_mbregex()
    {
        $args = fn () => apply_filters('register_block_type_args', ['supports' => ['anchor' => true]], 'kevinbatdorf/code-block-pro');

        add_filter('blocks.codeBlockPro.canUpgrade', '__return_true');
        $this->assertArrayNotHasKey('inserter', $args()['supports']);

        add_filter('blocks.codeBlockPro.canUpgrade', '__return_false');
        $this->assertSame(['anchor' => true, 'inserter' => false], $args()['supports']);
        $this->assertSame([], apply_filters('register_block_type_args', [], 'core/paragraph'));
    }
}
