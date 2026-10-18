<?php

use Phiki\Phast\ClassList;
use Phiki\Phast\Element;
use Phiki\Phast\Properties;
use Phiki\Phast\Text;
use Phiki\Theme\TokenSettings;
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

    private const FONT_BITS = ['italic' => 1, 'bold' => 2, 'underline' => 4, 'strikethrough' => 8];

    /**
     * @param array<string, array{slug: string, fg: string}> $conditions Condition id => its theme, the base condition first.
     * @param bool $classes False keeps phiki's inline styles, for a lone theme with no stylesheet.
     */
    public function __construct(private array $conditions, private bool $classes = true)
    {
    }

    public function pre(Element $pre): Element
    {
        if (!$this->classes) {
            return new Element('pre', new Properties(['style' => $pre->properties->get('style'), 'tabindex' => self::tabindex()]), $pre->children);
        }

        $classes = new ClassList();
        foreach ($this->conditions as $id => $theme) {
            $classes->add($id === $this->baseId() ? "cbp-theme-{$theme['slug']}" : "cbp-$id-theme-{$theme['slug']}");
        }

        return new Element('pre', new Properties(['class' => $classes, 'tabindex' => self::tabindex()]), $pre->children);
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

        if (!$this->classes) {
            return $span;
        }

        $base = $token->settings[$this->baseId()] ?? null;
        if ($base && $base->foreground) {
            $classes->add(code_block_pro_color_class($base->foreground));
        }
        foreach (self::fontStyles($base) as $style) {
            if (isset(self::FONT_STYLES[$style])) {
                $classes->add(self::FONT_STYLES[$style]);
            }
        }

        $bits = [];
        foreach ($this->conditions as $id => $theme) {
            $bits[$id] = array_sum(array_intersect_key(self::FONT_BITS, array_flip(self::fontStyles($token->settings[$id] ?? null))));
        }
        foreach (array_slice($this->conditions, 1, null, true) as $id => $theme) {
            // Every condition names a color, or the base condition's would show through.
            $classes->add(code_block_pro_color_class($token->settings[$id]->foreground ?? $theme['fg'], $id));
            if (array_filter($bits)) {
                $classes->add("cbp-$id-font{$bits[$id]}");
            }
        }
        $span->properties->remove('style');

        return $span;
    }

    /**
     * @return list<string>
     */
    private static function fontStyles(?TokenSettings $settings): array
    {
        return preg_split('/\s+/', (string) $settings?->fontStyle, -1, PREG_SPLIT_NO_EMPTY) ?: [];
    }

    private function baseId(): string
    {
        return (string) array_key_first($this->conditions);
    }

    public function postprocess(string $html): string
    {
        return code_block_pro_inert_brackets($html);
    }
}
