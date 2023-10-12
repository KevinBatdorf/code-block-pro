<?php
defined('ABSPATH') or die;

if (!class_exists('CBPRouter')) {
    class CBPRouter extends \WP_REST_Controller
    {
        protected static $instance = null;
        protected $namespace = 'code-block-pro/v1';
        protected $capability = 'edit_posts';
        public function getHandler($namespace, $endpoint, $callback)
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
        public function postHandler($namespace, $endpoint, $callback)
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

        public static function __callStatic($name, array $arguments)
        {
            $name = "{$name}Handler";
            if (is_null(self::$instance)) {
                self::$instance = new static();
            }
            $r = self::$instance;
            return $r->$name($r->namespace, ...$arguments);
        }
    }
}
