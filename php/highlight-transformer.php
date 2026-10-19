<?php

use Phiki\Phast\ClassList;
use Phiki\Phast\Element;
use Phiki\Phast\Properties;
use Phiki\Phast\Text;
use Phiki\Theme\TokenSettings;
use Phiki\Token\HighlightedToken;
use Phiki\Token\Token;
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

    /** @var array<int, list<string>> */
    private array $flags = [];

    private int $count = 0;

    /** @var array<int, int> Output line => the line it is on the front end; a kept marker-only line has none. */
    private array $rows = [];

    /**
     * @param array<string, array{slug: string, fg: string}> $conditions Condition id => its theme, the base condition first.
     * @param bool $classes False keeps phiki's inline styles, for a lone theme with no stylesheet.
     * @param CodeBlockProLineOptions $options
     * @param bool $keepMarkers Keep markers as typed, each marker-only line in a `cbp-marker` span that takes no line number.
     */
    public function __construct(private array $conditions, private bool $classes, private array $options, private bool $keepMarkers = false)
    {
    }

    public function count(): int
    {
        return $this->count;
    }

    /**
     * @param array<int, array<Token>> $tokens
     * @return array<int, array<Token>>
     */
    public function tokens(array $tokens): array
    {
        $kept = [];
        $marked = [];
        $pending = [];
        $this->rows = [];
        $shown = 0;
        foreach ($tokens as $line) {
            $line = array_values($line);
            // stripMarkers rewrites token text in place.
            [$stripped, $markers] = self::stripMarkers($this->keepMarkers ? array_map(fn ($token) => clone $token, $line) : $line);
            array_push($pending, ...$markers);
            // A marker-only line leaves the front end; its marker applies to the line after it.
            if ($markers && trim(implode('', array_map(fn ($token) => $token->text, $stripped))) === '') {
                if ($this->keepMarkers) {
                    $kept[] = $line;
                }
                continue;
            }
            $this->rows[count($kept)] = $shown;
            $kept[] = $this->keepMarkers ? $line : $stripped;
            code_block_pro_mark($marked, $shown++, $pending);
            $pending = [];
        }
        if (!$kept) {
            $this->rows[0] = $shown++;
            $kept[] = [new Token($tokens[0][0]->scopes ?? ['source'], '', 0, 0)];
        }

        $this->count = $shown;
        $this->flags = code_block_pro_line_flags($this->count, $this->options, $marked);

        return $kept;
    }

    /**
     * Markers only count inside a comment, so one in a string or heredoc stays as written.
     *
     * @param list<Token> $line
     * @return array{list<Token>, list<array<int|string, string>>}
     */
    private static function stripMarkers(array $line): array
    {
        $has = fn (Token $token, string $prefix) => (bool) array_filter($token->scopes, fn ($scope) => str_starts_with($scope, $prefix));
        $text = fn (array $tokens) => implode('', array_map(fn ($token) => $token->text, $tokens));
        $marker = '/[ \t]*' . CODE_BLOCK_PRO_MARKER . '/i';
        $markers = [];

        for ($i = 0, $count = count($line); $i < $count; $i = $end) {
            $end = $i;
            while ($end < $count && $has($line[$end], 'comment')) {
                $end++;
            }
            if ($end === $i) {
                $end++;
                continue;
            }
            $run = array_slice($line, $i, $end - $i);
            if (stripos($text($run), '[!code') === false || !preg_match_all($marker, $text($run), $found, PREG_SET_ORDER)) {
                continue;
            }
            array_push($markers, ...$found);
            foreach ($run as $token) {
                $token->text = (string) preg_replace($marker, '', $token->text);
            }
            // A grammar that splits a comment's text into several tokens can split a marker too.
            $body = array_values(array_filter($run, fn ($token) => !$has($token, 'punctuation.definition.comment')));
            if ($body && preg_match($marker, $text($body))) {
                $body[0]->text = (string) preg_replace($marker, '', $text($body));
                foreach (array_slice($body, 1) as $token) {
                    $token->text = '';
                }
            }

            // Delimiters alone may go only when the comment opens and closes on this line.
            $left = trim($text($run));
            $closed = $has($run[0], 'comment.line') || preg_match('/^(\/\*|<!--|\{-|\(\*).*(\*\/|-->|-\}|\*\))$/s', $left);
            if (preg_match('/[\p{L}\p{N}]/u', $left) || !$closed) {
                continue;
            }
            foreach ($run as $token) {
                $token->text = str_ends_with($token->text, "\n") ? "\n" : '';
            }
            // JSX wraps a comment in braces of its own.
            $from = $i - 1;
            $before = self::neighbor($line, $from, -1);
            $after = self::neighbor($line, $end, 1);
            if ($before !== null && $after !== null && $has($line[$before], 'punctuation.section.embedded.begin') && $has($line[$after], 'punctuation.section.embedded.end')) {
                $line[$before]->text = '';
                $line[$after]->text = str_ends_with($line[$after]->text, "\n") ? "\n" : '';
                $from = $before - 1;
                $after = self::neighbor($line, $after + 1, 1);
            }
            // Code after the comment keeps the indent before it; a comment ending the line takes its space along.
            if ($after !== null && trim($line[$after]->text) !== '') {
                for ($k = $end; $k < $after; $k++) {
                    $line[$k]->text = str_ends_with($line[$k]->text, "\n") ? "\n" : '';
                }
                $line[$after]->text = ltrim($line[$after]->text, " \t");
                continue;
            }
            for ($back = $from; $back >= 0; $back--) {
                $line[$back]->text = rtrim($line[$back]->text, " \t");
                if ($line[$back]->text !== '') {
                    break;
                }
            }
        }

        return [array_values(array_filter($line, fn ($token) => $token->text !== '')), $markers];
    }

    /**
     * The nearest token from $at, stepping by $step, that holds more than spaces.
     *
     * @param list<Token> $line
     */
    private static function neighbor(array $line, int $at, int $step): ?int
    {
        for (; $at >= 0 && $at < count($line); $at += $step) {
            if (trim($line[$at]->text, " \t") !== '') {
                return $at;
            }
        }

        return null;
    }

    public function pre(Element $pre): Element
    {
        $properties = new Properties();
        $classes = code_block_pro_pre_classes($this->count, $this->options, $this->flags);
        if ($classes) {
            $properties->set('class', new ClassList($classes));
        }
        if (!$this->classes) {
            $properties->set('style', (string) $pre->properties->get('style'));
        }
        // Properties drops falsy values, which includes the string '0'.
        $properties->set('tabindex', new Text('0'));

        return new Element('pre', $properties, $pre->children);
    }

    public function code(Element $code): Element
    {
        // Phiki ends every line with the newline it split on; the last one has nothing after it.
        $last = end($code->children);
        $token = $last instanceof Element ? end($last->children) : null;
        $text = $token instanceof Element ? ($token->children[0] ?? null) : null;
        if ($last instanceof Element && $text instanceof Text && str_ends_with($text->value, "\n")) {
            $text->value = substr($text->value, 0, -1);
            if ($text->value === '') {
                array_pop($last->children);
            }
        }

        return $code;
    }

    /**
     * @param array<int, HighlightedToken> $tokens
     */
    public function line(Element $span, array $tokens, int $index): Element
    {
        if (!isset($this->rows[$index])) {
            $span->properties->set('class', new ClassList(['line', 'cbp-marker']));

            return $span;
        }
        $index = $this->rows[$index];
        $classes = $this->flags[$index] ?? [];
        foreach (code_block_pro_line_attributes($index, $this->options, $classes) as $name => $value) {
            $span->properties->set($name, $name === 'class' ? new ClassList(explode(' ', $value)) : new Text(esc_attr($value)));
        }

        return new Element(code_block_pro_line_tag($classes), $span->properties, $span->children);
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
