<?php

class OverridesTest extends WP_UnitTestCase
{
    public const NAME = 'kevinbatdorf/code-block-pro';

    private function render(array $attributes)
    {
        $attributes += ['version' => 2, 'panes' => [['language' => 'javascript', 'code' => "a();\nb();"]]];

        return render_block(parse_blocks('<!-- wp:' . self::NAME . ' ' . serialize_block_attributes($attributes) . ' /-->')[0]);
    }

    private function numbered(string $html)
    {
        return str_contains($html, 'cbp-numbers') && str_contains($html, 'data-line="1"');
    }

    public function test_a_block_can_turn_line_numbers_on_against_its_profile()
    {
        code_block_pro_insert_profile('plain', ['settings' => ['lineNumbers' => false]]);

        $this->assertFalse($this->numbered($this->render(['profile' => 'plain'])));
        $this->assertTrue($this->numbered($this->render(['profile' => 'plain', 'overrides' => ['lineNumbers' => true]])));
    }

    public function test_a_block_can_turn_line_numbers_off_against_its_profile()
    {
        code_block_pro_insert_profile('numbered', ['settings' => ['lineNumbers' => true]]);

        $this->assertTrue($this->numbered($this->render(['profile' => 'numbered'])));
        $this->assertFalse($this->numbered($this->render(['profile' => 'numbered', 'overrides' => ['lineNumbers' => false]])));
    }

    /**
     * @dataProvider unsetOverrides
     */
    public function test_anything_but_true_or_false_leaves_the_profile_in_charge($overrides)
    {
        code_block_pro_insert_profile('numbered', ['settings' => ['lineNumbers' => true]]);

        $this->assertTrue($this->numbered($this->render(['profile' => 'numbered', 'overrides' => $overrides])));
    }

    public static function unsetOverrides()
    {
        return [
            'no override' => [[]],
            'a string' => [['lineNumbers' => 'false']],
            'not an object' => ['off'],
        ];
    }
}
