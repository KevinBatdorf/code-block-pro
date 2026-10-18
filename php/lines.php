<?php

defined('ABSPATH') or die;

const CODE_BLOCK_PRO_MARKER = '\[!code\s+(highlight|hl|\+\+|--|focus)(?::(\d{1,4}))?\]';

/** Each feature's line list holds display numbers. */
const CODE_BLOCK_PRO_LINE_CLASSES = [
    'highlight' => 'cbp-hl',
    'focus' => 'cbp-focus',
    'sharp' => 'cbp-sharp',
    'added' => 'cbp-add',
    'removed' => 'cbp-del',
];

/**
 * "1, 3-5, [7,9]" as sorted line numbers. A piece that isn't a number or a range is skipped, not the whole list.
 *
 * @return list<int>
 */
function code_block_pro_parse_lines(mixed $list): array
{
    if (is_int($list)) {
        $list = (string) $list;
    }
    if (!is_string($list) || strlen($list) > 2000) {
        return [];
    }

    $lines = [];
    // A list of huge ranges would otherwise build millions of entries on every render.
    $budget = 10001;
    // 1.x wrote ranges as [a,b]; a-b is what people type.
    preg_match_all('/\[\s*(\d{1,6})\s*,\s*(\d{1,6})\s*\]|(\d{1,6})\s*-\s*(\d{1,6})|(?<![-\d])(\d{1,6})/', $list, $matches, PREG_SET_ORDER | PREG_UNMATCHED_AS_NULL);
    foreach ($matches as $match) {
        [$from, $to] = isset($match[5]) ? [(int) $match[5], (int) $match[5]] : (isset($match[1]) ? [(int) $match[1], (int) $match[2]] : [(int) $match[3], (int) $match[4]]);
        for ($line = $from; $line <= $to && $budget-- > 0; $line++) {
            $lines[$line] = true;
        }
    }
    $lines = array_keys($lines);
    sort($lines);

    return $lines;
}

/**
 * Everything a pane's line features need, normalized, so it can key the render cache.
 *
 * @param array<mixed> $pane
 * @param array<string, string|int|bool> $settings The profile's settings.
 * @return CodeBlockProLineOptions
 */
function code_block_pro_line_options(array $pane, array $settings, string $anchor = '', bool $anchors = false): array
{
    return [
        'start' => is_numeric($pane['startLine'] ?? null) ? max(0, min(999999, (int) $pane['startLine'])) : 1,
        'numbers' => (bool) ($settings['lineNumbers'] ?? false),
        'anchor' => $anchors ? $anchor : null,
        'highlight' => code_block_pro_parse_lines($pane['highlightLines'] ?? ''),
        'focus' => code_block_pro_parse_lines($pane['focusLines'] ?? ''),
        'sharp' => code_block_pro_parse_lines($pane['sharpLines'] ?? ''),
        'added' => code_block_pro_parse_lines($pane['addedLines'] ?? ''),
        'removed' => code_block_pro_parse_lines($pane['removedLines'] ?? ''),
        'fold' => is_numeric($pane['seeMoreAfter'] ?? null) ? max(0, min(999, (int) $pane['seeMoreAfter'])) : 0,
    ];
}

/**
 * @return CodeBlockProLineOptions
 */
function code_block_pro_no_line_options(): array
{
    return ['start' => 1, 'numbers' => false, 'anchor' => null, 'highlight' => [], 'focus' => [], 'sharp' => [], 'added' => [], 'removed' => [], 'fold' => 0];
}

/**
 * @param CodeBlockProLineOptions $options
 * @param array<int, list<string>> $marked 0-based line => features its markers named.
 * @return array<int, list<string>> 0-based line => classes, for lines that have any.
 */
function code_block_pro_line_flags(int $count, array $options, array $marked = []): array
{
    $flags = [];
    foreach (CODE_BLOCK_PRO_LINE_CLASSES as $feature => $class) {
        foreach ($options[$feature] as $number) {
            $index = $number - $options['start'];
            if ($index >= 0 && $index < $count) {
                $flags[$index][$class] = true;
            }
        }
    }
    foreach ($marked as $index => $features) {
        foreach ($features as $feature) {
            if ($index < $count) {
                $flags[$index][CODE_BLOCK_PRO_LINE_CLASSES[$feature]] = true;
            }
        }
    }
    ksort($flags);

    return array_map('array_keys', $flags);
}

/**
 * @param CodeBlockProLineOptions $options
 * @param list<string> $classes
 * @return array<string, string>
 */
function code_block_pro_line_attributes(int $index, array $options, array $classes): array
{
    $number = $options['start'] + $index;
    $attributes = ['class' => implode(' ', ['line', ...$classes])];
    if ($options['anchor'] !== null) {
        $attributes['id'] = "{$options['anchor']}L$number";
    }
    if ($options['numbers']) {
        $attributes['data-line'] = (string) $number;
    }

    return $attributes;
}

/**
 * Screen readers announce ins and del, so a diff reads as one.
 *
 * @param list<string> $classes
 */
function code_block_pro_line_tag(array $classes): string
{
    return in_array('cbp-del', $classes, true) ? 'del' : (in_array('cbp-add', $classes, true) ? 'ins' : 'span');
}

/**
 * @param CodeBlockProLineOptions $options
 * @param array<int, list<string>> $flags
 * @return list<string>
 */
function code_block_pro_pre_classes(int $count, array $options, array $flags): array
{
    $used = $flags ? array_merge(...array_values($flags)) : [];
    $classes = [];
    if (in_array('cbp-focus', $used, true)) {
        $classes[] = 'cbp-has-focus';
    }
    if (in_array('cbp-sharp', $used, true)) {
        $classes[] = 'cbp-has-sharp';
    }
    if (array_intersect(['cbp-add', 'cbp-del'], $used)) {
        $classes[] = 'cbp-has-diff';
    }
    if ($options['numbers']) {
        $classes[] = 'cbp-digits-' . strlen((string) ($options['start'] + max(0, $count - 1)));
    }
    if ($options['fold'] > 0 && $options['fold'] < $count) {
        array_push($classes, 'cbp-fold', ...code_block_pro_digit_classes('fold', $options['fold']));
    }

    return $classes;
}

/**
 * @return list<string> One class per non-zero digit, ones first: 307 is cbp-fold1-7 cbp-fold3-3.
 */
function code_block_pro_digit_classes(string $name, int $value): array
{
    $classes = [];
    foreach (array_reverse(str_split((string) $value)) as $place => $digit) {
        if ($digit !== '0') {
            $classes[] = "cbp-$name" . ($place + 1) . "-$digit";
        }
    }

    return $classes;
}

/**
 * The plain fallback has no tokens to tell a comment by, so only markers that end the line count,
 * and only after a comment opener that starts the line or follows a space.
 *
 * @param list<string> $lines
 * @return array{lines: list<string>, marked: array<int, list<string>>}
 */
function code_block_pro_strip_markers_plain(array $lines): array
{
    $kept = [];
    $marked = [];
    $pending = [];
    foreach ($lines as $line) {
        $stripped = stripos($line, '[!code') === false ? null : code_block_pro_strip_marker_comment($line);
        if ($stripped) {
            array_push($pending, ...$stripped['markers']);
            $line = $stripped['line'];
            if (trim($line) === '') {
                continue;
            }
        }
        $kept[] = $line;
        code_block_pro_mark($marked, count($kept) - 1, $pending);
        $pending = [];
    }

    return ['lines' => $kept ?: [''], 'marked' => $marked];
}

/**
 * @return array{line: string, markers: list<array<int|string, string>>}|null
 */
function code_block_pro_strip_marker_comment(string $line): ?array
{
    // A block comment holding only markers can sit mid-line, before code.
    $inline = '/(?<=^|\s)(?:\/\*+|<!--|\{\/\*)((?:\s*' . CODE_BLOCK_PRO_MARKER . ')+)\s*(?>\*\/\}|\*+\/|-->)[ \t]*(?=\S)/i';
    if (preg_match_all($inline, $line, $found)) {
        preg_match_all('/' . CODE_BLOCK_PRO_MARKER . '/i', implode(' ', $found[1]), $markers, PREG_SET_ORDER);
        $rest = code_block_pro_strip_marker_comment((string) preg_replace($inline, '', $line));

        return ['line' => $rest['line'] ?? (string) preg_replace($inline, '', $line), 'markers' => [...$markers, ...($rest['markers'] ?? [])]];
    }
    if (!preg_match('/(?:\s*' . CODE_BLOCK_PRO_MARKER . ')+\s*(\*\/\}|\*+\/|-->)?\s*$/i', $line, $tail, PREG_OFFSET_CAPTURE)) {
        return null;
    }
    $head = substr($line, 0, $tail[0][1]);
    if (!preg_match_all('/(?<=^|\s)(\/\/|#|--|;|%|\/\*+|<!--|\{\/\*)/', $head, $openers, PREG_OFFSET_CAPTURE)) {
        return null;
    }
    preg_match_all('/' . CODE_BLOCK_PRO_MARKER . '/i', $tail[0][0], $markers, PREG_SET_ORDER);
    $opener = end($openers[0]);
    $text = trim(substr($head, $opener[1] + strlen($opener[0])));
    $closer = $tail[3][0] ?? '';

    return [
        'line' => $text === '' ? rtrim(substr($head, 0, $opener[1])) : rtrim($head) . ($closer === '' ? '' : " $closer"),
        'markers' => $markers,
    ];
}

/**
 * @param array<int, list<string>> $marked
 * @param array<array<int|string, string>> $markers Matches of CODE_BLOCK_PRO_MARKER.
 */
function code_block_pro_mark(array &$marked, int $index, array $markers): void
{
    $features = ['highlight' => 'highlight', 'hl' => 'highlight', '++' => 'added', '--' => 'removed', 'focus' => 'focus'];
    foreach ($markers as $marker) {
        $feature = $features[strtolower($marker[1])];
        // Markers arrive in line order, so a line already marked means every line from $index to it is too.
        for ($line = $index + max(1, (int) ($marker[2] ?? 1)) - 1; $line >= $index && !in_array($feature, $marked[$line] ?? [], true); $line--) {
            $marked[$line][] = $feature;
        }
    }
}
