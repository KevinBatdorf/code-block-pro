<?php

use Phiki\Phast\ClassList;
use Phiki\Phast\Element;
use Phiki\Phast\Properties;
use Phiki\Phast\Text;
use Phiki\Token\HighlightedToken;
use Phiki\Transformers\AbstractTransformer;

defined('ABSPATH') or die;

class CodeBlockProTransformer extends AbstractTransformer
{
    private const FONT_STYLES = [
        'italic' => 'cbp-italic',
        'bold' => 'cbp-bold',
        'underline' => 'cbp-underline',
        'strikethrough' => 'cbp-strike',
    ];

    /**
     * @param string|null $theme Slug of a theme with a stylesheet, or null to keep phiki's inline styles.
     */
    public function __construct(private ?string $theme)
    {
    }

    public function pre(Element $pre): Element
    {
        if ($this->theme === null) {
            return new Element('pre', new Properties(['style' => $pre->properties->get('style'), 'tabindex' => self::tabindex()]), $pre->children);
        }

        return new Element('pre', new Properties(['class' => "cbp-theme-{$this->theme}", 'tabindex' => self::tabindex()]), $pre->children);
    }

    private static function tabindex(): Text
    {
        // Properties drops falsy values, which includes the string '0'.
        return new Text('0');
    }

    public function code(Element $code): Element
    {
        $children = [];
        foreach ($code->children as $i => $line) {
            if ($i > 0) {
                $children[] = new Text("\n");
            }
            $children[] = $line;
        }
        $code->children = $children;

        return $code;
    }

    /**
     * @param array<int, HighlightedToken> $tokens
     */
    public function line(Element $span, array $tokens, int $index): Element
    {
        // Phiki ends every line's last token with the newline it split on.
        $last = end($span->children);
        $text = $last instanceof Element ? ($last->children[0] ?? null) : null;
        if (!$text instanceof Text || !str_ends_with($text->value, "\n")) {
            return $span;
        }

        $text->value = substr($text->value, 0, -1);
        if ($text->value === '') {
            array_pop($span->children);
        }

        return $span;
    }

    public function token(Element $span, HighlightedToken $token, int $index, int $line): Element
    {
        $classes = $span->properties->get('class') ?? new ClassList();
        foreach ($token->token->scopes as $scope) {
            // Grammars build some scope names from the matched code, and phiki never escapes attributes.
            $scope = preg_replace('/[^A-Za-z0-9_.+#-]/', '', $scope);
            if ($scope) {
                $classes->add("phiki-$scope");
            }
        }
        $span->properties->set('class', $classes);

        if ($this->theme === null) {
            return $span;
        }

        $settings = $token->settings['default'] ?? null;
        if ($settings && $settings->foreground) {
            $classes->add(code_block_pro_color_class($settings->foreground));
        }
        foreach (preg_split('/\s+/', (string) $settings?->fontStyle, -1, PREG_SPLIT_NO_EMPTY) ?: [] as $style) {
            if (isset(self::FONT_STYLES[$style])) {
                $classes->add(self::FONT_STYLES[$style]);
            }
        }
        $span->properties->remove('style');

        return $span;
    }

    public function postprocess(string $html): string
    {
        return code_block_pro_inert_brackets($html);
    }
}
