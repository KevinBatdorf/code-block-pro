<?php

use Phiki\Theme\ParsedTheme;
use Phiki\Theme\TokenSettings;

defined('ABSPATH') or die;

/**
 * Picks theme rules the way vscode-textmate 8 does, which 1.x rendered with; phiki's own matcher picks differently.
 */
class CodeBlockProTheme extends ParsedTheme
{
    private const NOT_SET = -1;

    private const FONT_STYLES = ['italic' => 1, 'bold' => 2, 'underline' => 4, 'strikethrough' => 8];

    private stdClass $root;

    private int $defaultFontStyle = 0;

    /** @var array<string, list<stdClass>> */
    private array $candidates = [];

    /** @var array<string, TokenSettings|null> */
    private array $matches = [];

    public static function fromFile(string $file): self
    {
        $theme = json_decode((string) file_get_contents($file), true);
        $rules = is_array($theme) ? ($theme['tokenColors'] ?? $theme['settings'] ?? null) : null;
        if (!is_array($rules)) {
            throw new InvalidArgumentException("$file is not a VS Code theme.");
        }

        return new self((string) ($theme['name'] ?? ''), (array) ($theme['colors'] ?? []), $rules);
    }

    /**
     * @param array<string, string> $colors
     * @param array<mixed> $rules The theme's tokenColors.
     */
    public function __construct(string $name, array $colors, array $rules)
    {
        parent::__construct($name, $colors);

        $parsed = $this->parse($rules);
        usort($parsed, function ($a, $b) {
            return strcmp($a->scope, $b->scope) ?: self::compareParents($a->parents, $b->parents) ?: $a->index - $b->index;
        });
        while ($parsed && $parsed[0]->scope === '') {
            $default = array_shift($parsed);
            $this->defaultFontStyle = $default->fontStyle === self::NOT_SET ? $this->defaultFontStyle : $default->fontStyle;
        }

        $this->root = self::node(self::rule(0, null, self::NOT_SET, null), []);
        foreach ($parsed as $rule) {
            $this->insert($this->root, 0, $rule->scope, $rule->parents, $rule->fontStyle, $rule->foreground);
        }
    }

    /**
     * @param array<string> $scopes Outermost first, as phiki hands them over.
     */
    public function match(array $scopes): ?TokenSettings
    {
        $key = implode(' ', $scopes);
        if (array_key_exists($key, $this->matches)) {
            return $this->matches[$key];
        }

        // Each scope's own best rule overrides only what it sets, outermost to innermost.
        $scopes = array_values($scopes);
        $fontStyle = $this->defaultFontStyle;
        $foreground = null;
        foreach ($scopes as $i => $scope) {
            $parents = array_reverse(array_slice($scopes, 0, $i));
            foreach ($this->candidatesFor($scope) as $rule) {
                if (!self::parentsMatch($parents, $rule->parents)) {
                    continue;
                }
                $fontStyle = $rule->fontStyle === self::NOT_SET ? $fontStyle : $rule->fontStyle;
                $foreground = $rule->foreground ?? $foreground;
                break;
            }
        }

        $styles = array_keys(array_filter(self::FONT_STYLES, function ($bit) use ($fontStyle) {
            return ($fontStyle & $bit) !== 0;
        }));

        return $this->matches[$key] = $foreground === null && !$styles ? null : new TokenSettings(null, $foreground, implode(' ', $styles));
    }

    /**
     * Phiki writes these into the <pre> style attribute without escaping.
     */
    public function base(): TokenSettings
    {
        return new TokenSettings(self::hex($this->colors['editor.background'] ?? null), self::hex($this->colors['editor.foreground'] ?? null), null);
    }

    private static function hex(mixed $color): ?string
    {
        return is_string($color) && preg_match('/^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/iD', $color) ? $color : null;
    }

    /**
     * @param array<mixed> $rules
     * @return list<stdClass>
     */
    private function parse(array $rules): array
    {
        $parsed = [];
        foreach (array_values($rules) as $index => $entry) {
            if (!is_array($entry) || in_array($entry['settings'] ?? null, [null, false, 0, 0.0, ''], true)) {
                continue;
            }
            $settings = is_array($entry['settings']) ? $entry['settings'] : [];

            $selectors = [''];
            if (is_string($entry['scope'] ?? null)) {
                $selectors = explode(',', trim($entry['scope'], ','));
            } elseif (is_array($entry['scope'] ?? null) && array_is_list($entry['scope'])) {
                $selectors = array_filter($entry['scope'], 'is_string');
            }

            $fontStyle = self::NOT_SET;
            if (is_string($settings['fontStyle'] ?? null)) {
                $fontStyle = 0;
                foreach (explode(' ', $settings['fontStyle']) as $style) {
                    $fontStyle |= self::FONT_STYLES[$style] ?? 0;
                }
            }

            $foreground = self::hex($settings['foreground'] ?? null);

            foreach ($selectors as $selector) {
                $segments = explode(' ', trim($selector));
                $parsed[] = (object) [
                    'scope' => array_pop($segments),
                    'parents' => $segments ? array_reverse($segments) : null,
                    'index' => $index,
                    'fontStyle' => $fontStyle,
                    'foreground' => $foreground,
                ];
            }
        }

        return $parsed;
    }

    /**
     * @param list<string>|null $parents
     */
    private function insert(stdClass $node, int $depth, string $scope, ?array $parents, int $fontStyle, ?string $foreground): void
    {
        if ($scope === '') {
            $this->insertHere($node, $depth, $parents, $fontStyle, $foreground);
            return;
        }

        $dot = strpos($scope, '.');
        $head = $dot === false ? $scope : substr($scope, 0, $dot);
        $tail = $dot === false ? '' : substr($scope, $dot + 1);

        // A child starts from everything its less specific parent already set.
        $node->children[$head] ??= self::node(self::copy($node->main), array_map([self::class, 'copy'], $node->scoped));

        $this->insert($node->children[$head], $depth + 1, $tail, $parents, $fontStyle, $foreground);
    }

    /**
     * @param list<string>|null $parents
     */
    private function insertHere(stdClass $node, int $depth, ?array $parents, int $fontStyle, ?string $foreground): void
    {
        if ($parents === null) {
            self::overwrite($node->main, $depth, $fontStyle, $foreground);
            return;
        }

        foreach ($node->scoped as $rule) {
            if ($rule->parents === $parents) {
                self::overwrite($rule, $depth, $fontStyle, $foreground);
                return;
            }
        }

        $node->scoped[] = self::rule(
            $depth,
            $parents,
            $fontStyle === self::NOT_SET ? $node->main->fontStyle : $fontStyle,
            $foreground ?? $node->main->foreground
        );
    }

    /**
     * @return list<stdClass>
     */
    private function candidatesFor(string $scope): array
    {
        if (isset($this->candidates[$scope])) {
            return $this->candidates[$scope];
        }

        $segments = explode('.', $scope);
        if (end($segments) === '') {
            array_pop($segments);
        }
        $node = $this->root;
        foreach ($segments as $segment) {
            if (!isset($node->children[$segment])) {
                break;
            }
            $node = $node->children[$segment];
        }

        $rules = array_merge([$node->main], $node->scoped);
        usort($rules, [self::class, 'compareSpecificity']);

        return $this->candidates[$scope] = $rules;
    }

    private static function compareSpecificity(stdClass $a, stdClass $b): int
    {
        if ($a->depth !== $b->depth) {
            return $b->depth - $a->depth;
        }

        $aCount = count($a->parents ?? []);
        $bCount = count($b->parents ?? []);
        if ($aCount === $bCount) {
            for ($i = 0; $i < $aCount; $i++) {
                $lengths = strlen($b->parents[$i]) - strlen($a->parents[$i]);
                if ($lengths !== 0) {
                    return $lengths;
                }
            }
        }

        return $bCount - $aCount;
    }

    /**
     * @param list<string>|null $a
     * @param list<string>|null $b
     */
    private static function compareParents(?array $a, ?array $b): int
    {
        if ($a === null || $b === null) {
            return ($a === null ? 0 : 1) - ($b === null ? 0 : 1);
        }
        if (count($a) !== count($b)) {
            return count($a) - count($b);
        }
        foreach ($a as $i => $scope) {
            $order = strcmp($scope, $b[$i]);
            if ($order !== 0) {
                return $order;
            }
        }

        return 0;
    }

    /**
     * @param list<string> $path Innermost first.
     * @param list<string>|null $parents Innermost first.
     */
    private static function parentsMatch(array $path, ?array $parents): bool
    {
        if ($parents === null) {
            return true;
        }

        $i = 0;
        foreach ($path as $scope) {
            if ($scope === $parents[$i] || str_starts_with($scope, $parents[$i] . '.')) {
                $i++;
                if ($i === count($parents)) {
                    return true;
                }
            }
        }

        return false;
    }

    private static function overwrite(stdClass $rule, int $depth, int $fontStyle, ?string $foreground): void
    {
        $rule->depth = max($rule->depth, $depth);
        $rule->fontStyle = $fontStyle === self::NOT_SET ? $rule->fontStyle : $fontStyle;
        $rule->foreground = $foreground ?? $rule->foreground;
    }

    /**
     * @param list<string>|null $parents
     */
    private static function rule(int $depth, ?array $parents, int $fontStyle, ?string $foreground): stdClass
    {
        return (object) ['depth' => $depth, 'parents' => $parents, 'fontStyle' => $fontStyle, 'foreground' => $foreground];
    }

    private static function copy(stdClass $rule): stdClass
    {
        return clone $rule;
    }

    /**
     * @param array<stdClass> $scoped
     */
    private static function node(stdClass $main, array $scoped): stdClass
    {
        return (object) ['main' => $main, 'scoped' => $scoped, 'children' => []];
    }
}
