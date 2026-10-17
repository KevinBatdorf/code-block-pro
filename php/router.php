<?php
defined('ABSPATH') or die;

if (!class_exists('CBPRouter')) {
    /**
     * @method static void get(non-falsy-string $endpoint, callable $callback)
     * @method static void post(non-falsy-string $endpoint, callable $callback)
     */
    class CBPRouter extends \WP_REST_Controller
    {
        /** @var self|null */
        protected static $instance = null;
        protected $namespace = 'code-block-pro/v1';
        /** @var string */
        protected $capability = 'edit_posts';
        /**
         * @param non-falsy-string $namespace
         * @param non-falsy-string $endpoint
         * @return void
         */
        public function getHandler(string $namespace, string $endpoint, callable $callback)
        {
            \register_rest_route(
                $namespace,
                $endpoint,
                [
                    'methods' => 'GET',
                    'callback' => $callback,
                    'permission_callback' => function () {
                        return \current_user_can($this->capability);
                    },
                ]
            );
        }
        /**
         * @param non-falsy-string $namespace
         * @param non-falsy-string $endpoint
         * @return void
         */
        public function postHandler(string $namespace, string $endpoint, callable $callback)
        {
            \register_rest_route(
                $namespace,
                $endpoint,
                [
                    'methods' => 'POST',
                    'callback' => $callback,
                    'permission_callback' => function () {
                        return \current_user_can($this->capability);
                    },
                ]
            );
        }

        /**
         * @param array<int, mixed> $arguments
         * @return mixed
         */
        public static function __callStatic(string $name, array $arguments)
        {
            $name = "{$name}Handler";
            if (is_null(self::$instance)) {
                self::$instance = new self();
            }
            $r = self::$instance;
            return $r->$name($r->namespace, ...$arguments);
        }
    }
}
