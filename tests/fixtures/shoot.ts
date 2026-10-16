import { expect, type Locator, type Page } from '@playwright/test';

/** `path`'s last segment is the base name, no extension; `-hover` and `-expanded` are suffixed to it. */
export const shootBlock = async (
	page: Page,
	block: Locator,
	path: string[],
) => {
	// An empty block has no box to capture; the digest's height still pins it.
	if (!(await block.isVisible())) return;
	// The screenshot's own scroll would slide another line under a parked mouse.
	await block.scrollIntoViewIfNeeded();
	const name = (suffix: string) => [
		...path.slice(0, -1),
		`${path.at(-1)}${suffix}.png`,
	];
	await page.mouse.move(0, 0);
	await expect.soft(block).toHaveScreenshot(name(''));

	const hovers = await block.evaluate(
		(el) =>
			el.matches('.cbp-highlight-hover, .cbp-unblur-on-hover') ||
			!!el.querySelector('.code-block-pro-copy-button'),
	);
	if (hovers) {
		// A statically highlighted line looks the same hovered.
		const line = block.locator('.line:not(.cbp-line-highlight)').first();
		// Blurred lines take no pointer events, so the actionability check never passes.
		await ((await line.count()) ? line : block).hover({
			force: true,
			// A long line's centre can sit past the pre's visible edge.
			position: { x: 8, y: 4 },
		});
		await expect.soft(block).toHaveScreenshot(name('-hover'));
	}

	const more = block.locator('.cbp-see-more-simple-btn');
	if (await more.isVisible()) {
		await more.click();
		await page.mouse.move(0, 0);
		await expect.soft(block).toHaveScreenshot(name('-expanded'));
	}
};
