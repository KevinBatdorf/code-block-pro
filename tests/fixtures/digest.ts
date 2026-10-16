import { expect, type Page } from '@playwright/test';

export type BlockDigest = {
	wrapper: string;
	background: string;
	color: string;
	/** Size / leading, family, then tab width of the code. */
	font: string;
	padding: string;
	/** Rendered height of the whole block, then of the code alone, in px. */
	height: [number, number];
	/** Width, colour and opacity of the line numbers, or null when there are none. */
	gutter: string | null;
	/** Where the first token starts, in px from the pre's left edge. */
	indent: number | null;
	lines: number;
	/** One string per line, empty when plain: its blur, highlight and painted number. */
	marks: string[];
	text: string;
	/** One string per token, so a colour change is a one-line diff. */
	tokens: string[];
	chrome: { tag: string; class: string; text: string }[];
	copy: string | null;
};

const changed: Record<keyof BlockDigest, string> = {
	text: 'code text changed',
	lines: 'line count changed',
	tokens: 'a glyph changed colour',
	marks: 'a line changed its blur, highlight or number',
	background: 'background changed',
	color: 'text colour changed',
	font: 'typography changed',
	padding: 'padding changed',
	height: 'height changed',
	gutter: 'line-number gutter changed',
	indent: 'the code moved sideways',
	wrapper: 'wrapper classes changed',
	chrome: 'chrome changed',
	copy: 'the copy payload changed',
};

/** Soft-asserts every field, so one run lists every way a block moved. */
export const expectSameBlocks = (
	actual: BlockDigest[],
	expected: BlockDigest[],
	where: string,
) => {
	expect
		.soft(actual.length, `${where}: block count changed`)
		.toBe(expected.length);
	for (const [b, block] of expected.entries()) {
		const found = actual[b];
		if (!found) continue;
		for (const key of Object.keys(changed) as (keyof BlockDigest)[]) {
			expect
				.soft(found[key], `${where}[${b}]: ${changed[key]}`)
				.toEqual(block[key]);
		}
	}
};

const BLOCK = '.wp-block-kevinbatdorf-code-block-pro';
const LINE_KEY = 'data-cbp-digest-line';

/** Waits for front.js and the fonts, failing rather than measuring a half-drawn page. */
export const settle = async (page: Page) => {
	// front.js marks each container when it finishes, and reading first races.
	// A renderer that stops marking shows up as a digest change, not a timeout.
	await page
		.waitForFunction(
			(block) => {
				const found = [...document.querySelectorAll(block)];
				return (
					found.length > 0 &&
					found.every((el) => el.classList.contains('cbp-hl-loaded'))
				);
			},
			BLOCK,
			{ timeout: 5000 },
		)
		.catch(() => undefined);
	// front.js sizes the highlighters from a ResizeObserver, a frame after it marks.
	const settled = await page.evaluate(() =>
		Promise.race([
			document.fonts.ready.then(
				() =>
					new Promise<boolean>((done) =>
						requestAnimationFrame(() =>
							requestAnimationFrame(() => done(true)),
						),
					),
			),
			new Promise<boolean>((done) => setTimeout(() => done(false), 10_000)),
		]),
	);
	if (!settled) throw new Error('Fonts never finished loading.');
};

/** Scripts can't read CSS counters, so the painted numbers come from Chromium's layout. */
const paintedNumbers = async (page: Page) => {
	await page.evaluate(
		([block, key]) => {
			document.querySelectorAll(block).forEach((wrapper, b) => {
				const lines = wrapper.querySelectorAll(
					'pre:not(.code-block-pro-copy-button-pre) .line',
				);
				lines.forEach((line, i) => line.setAttribute(key, `${b}:${i}`));
			});
		},
		[BLOCK, LINE_KEY] as const,
	);
	const cdp = await page.context().newCDPSession(page);
	const { documents, strings } = await cdp.send('DOMSnapshot.captureSnapshot', {
		computedStyles: [],
	});
	await cdp.detach();
	await page.evaluate((key) => {
		for (const line of document.querySelectorAll(`[${key}]`)) {
			line.removeAttribute(key);
		}
	}, LINE_KEY);

	const { nodes, layout } = documents[0];
	const parents = nodes.parentIndex ?? [];
	const text = (i: number) => (i >= 0 ? strings[i] : '');
	const numbers: Record<string, string> = {};
	(nodes.nodeName ?? []).forEach((name, i) => {
		if (text(name) !== '::before') return;
		const attrs = nodes.attributes?.[parents[i]] ?? [];
		const at = attrs.findIndex((a, j) => j % 2 === 0 && text(a) === LINE_KEY);
		if (at < 0) return;
		const painted = layout.nodeIndex
			.flatMap((node, l) =>
				(node === i || parents[node] === i) && layout.text[l] >= 0
					? [text(layout.text[l])]
					: [],
			)
			.join('');
		if (painted) numbers[text(attrs[at + 1])] = painted;
	});
	return numbers;
};

/** Reads what lands on screen, never markup or inline styles, which a new renderer changes by design. */
export const readDigest = async (page: Page): Promise<BlockDigest[]> => {
	await settle(page);
	const numbers = await paintedNumbers(page);
	return page.evaluate(
		([block, numbers]) =>
			[...document.querySelectorAll(block)].map((wrapper, b) => {
				const pre = wrapper.querySelector<HTMLElement>(
					'pre:not(.code-block-pro-copy-button-pre)',
				);
				const styled = getComputedStyle(pre ?? wrapper);
				const textarea = wrapper.querySelector<HTMLTextAreaElement>(
					'.code-block-pro-copy-button-textarea',
				);
				const button = wrapper.querySelector('.code-block-pro-copy-button');
				const lines = pre ? [...pre.querySelectorAll('.line')] : [];
				// front.js appends a highlighter span to lines; it carries no code.
				const tokens = pre
					? [...pre.querySelectorAll('.line > :not(.cbp-line-highlighter)')]
					: [];
				const numberOf = (i: number) => numbers[`${b}:${i}`];
				const firstNumbered = lines.find((_, i) => numberOf(i));
				const number = firstNumbered
					? getComputedStyle(firstNumbered, '::before')
					: null;
				return {
					wrapper: wrapper.className,
					background: styled.backgroundColor,
					color: styled.color,
					font: `${styled.fontSize} / ${styled.lineHeight} ${styled.fontFamily}, tab ${styled.tabSize}`,
					padding: styled.padding,
					height: [
						Math.round(wrapper.getBoundingClientRect().height),
						Math.round(pre?.getBoundingClientRect().height ?? 0),
					],
					gutter: number
						? `${number.width} ${number.color} ${number.opacity}`
						: null,
					indent:
						pre && tokens[0]
							? Math.round(
									tokens[0].getBoundingClientRect().left -
										pre.getBoundingClientRect().left,
								)
							: null,
					lines: lines.length,
					marks: lines.map((line, i) => {
						const marks: string[] = [];
						const { filter, opacity } = getComputedStyle(line);
						if (filter !== 'none') marks.push(filter);
						if (opacity !== '1') marks.push(`opacity ${opacity}`);
						const highlighter = line.querySelector('.cbp-line-highlighter');
						const highlight = highlighter
							? getComputedStyle(highlighter).backgroundColor
							: 'rgba(0, 0, 0, 0)';
						if (highlight !== 'rgba(0, 0, 0, 0)') {
							marks.push(`highlight ${highlight}`);
						}
						if (numberOf(i)) marks.push(`n ${numberOf(i)}`);
						return marks.join(', ');
					}),
					text: pre?.textContent ?? '',
					tokens: tokens.map(
						(token) =>
							`${getComputedStyle(token).color} ${token.textContent ?? ''}`,
					),
					chrome: [...wrapper.children]
						.filter((child) => child !== pre)
						.map((child) => ({
							tag: child.tagName.toLowerCase(),
							class: child.className,
							text: child.textContent ?? '',
						})),
					copy: textarea
						? textarea.value
						: (button?.getAttribute('data-code') ?? null),
				};
			}),
		[BLOCK, numbers] as const,
	);
};
