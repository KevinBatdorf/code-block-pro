import type { Page } from '@playwright/test';

export type BlockDigest = {
	wrapper: string;
	background: string;
	color: string;
	lines: number;
	text: string;
	/** One string per token, so a colour change is a one-line diff. */
	tokens: string[];
	chrome: { tag: string; class: string; text: string }[];
	copy: string | null;
};

/**
 * Markup and inline styles are free to change under a new renderer, so this
 * reads neither: text, line count and glyph colour are the whole contract.
 */
export const readDigest = async (page: Page): Promise<BlockDigest[]> => {
	// front.js marks each container when it finishes, and reading first races.
	// A renderer that stops marking shows up as a digest change, not a timeout.
	await page
		.waitForFunction(
			() => {
				const found = [
					...document.querySelectorAll('.wp-block-kevinbatdorf-code-block-pro'),
				];
				return (
					found.length > 0 &&
					found.every((el) => el.classList.contains('cbp-hl-loaded'))
				);
			},
			undefined,
			{ timeout: 5000 },
		)
		.catch(() => undefined);
	return page.evaluate(() => {
		const wrappers = document.querySelectorAll(
			'.wp-block-kevinbatdorf-code-block-pro',
		);
		return [...wrappers].map((wrapper) => {
			const pre = wrapper.querySelector(
				'pre:not(.code-block-pro-copy-button-pre)',
			);
			const styled = getComputedStyle(pre ?? wrapper);
			const textarea = wrapper.querySelector<HTMLTextAreaElement>(
				'.code-block-pro-copy-button-textarea',
			);
			const button = wrapper.querySelector('.code-block-pro-copy-button');
			const tokens = pre ? [...pre.querySelectorAll('.line > *')] : [];
			return {
				wrapper: wrapper.className,
				background: styled.backgroundColor,
				color: styled.color,
				lines: pre?.querySelectorAll('.line').length ?? 0,
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
		});
	});
};
