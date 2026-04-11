import type { Locator } from '@playwright/test';
import { expect, test } from '@wordpress/e2e-test-utils-playwright';
import {
	addCode,
	enableMaxHeight,
	getBlock,
	openPanel,
	previewPage,
	setCheckbox,
	setFooter,
	setHeader,
	setHeightDesign,
	setupCodeBlock,
} from '../helpers';

test.beforeEach(async ({ admin, editor, page, requestUtils }) => {
	await setupCodeBlock({ admin, editor, page, requestUtils });
});

const fiveLines = 'line 1\nline 2\nline 3\nline 4\nline 5';

function getLineSpan(container: Locator, text: string) {
	return container.locator(`span.line:has-text("${text}")`);
}

test.describe('Max Height', () => {
	test('Expand button appears and works', async ({ page, editor }) => {
		await setHeader(page, 'none');
		await setFooter(page, 'none');
		await addCode(editor, fiveLines);
		await enableMaxHeight(page);
		await setHeightDesign(page, 'roundCenter');
		await page.getByLabel('See more text').fill('Show More');
		await page.getByLabel('Hide after line').fill('3');
		await previewPage(page);
		const frontBlock = page.locator('.wp-block-kevinbatdorf-code-block-pro');
		await expect(getLineSpan(frontBlock, 'line 5')).not.toBeInViewport();
		// Click expand
		const expandBtn = page.locator('.cbp-see-more-simple-btn');
		await expect(expandBtn).toContainText('Show More');
		await expandBtn.click();
		await expect(getLineSpan(frontBlock, 'line 5')).toBeVisible();
		// One-time expand — button should disappear
		await expect(expandBtn).not.toBeVisible();
	});

	test('Collapse toggle works', async ({ page, editor }) => {
		await setHeader(page, 'none');
		await setFooter(page, 'none');
		await addCode(editor, fiveLines);
		await enableMaxHeight(page);
		await setHeightDesign(page, 'roundCenter');
		await setCheckbox(page, 'enable-collapse', true);
		// Explicitly set both texts to avoid state leakage from previous tests
		await page.getByLabel('See more text').fill('Expand');
		await page.getByLabel('Collapse text').fill('Hide');
		await page.getByLabel('Hide after line').fill('3');
		await previewPage(page);
		const frontBlock = page.locator('.wp-block-kevinbatdorf-code-block-pro');
		const btn = page.locator('.cbp-see-more-simple-btn');
		// Expand
		await btn.click();
		await expect(getLineSpan(frontBlock, 'line 5')).toBeVisible();
		await expect(btn).toContainText('Hide');
		// Check aria-expanded on the button
		await expect(btn).toHaveAttribute('aria-expanded', 'true');
		// Collapse
		await btn.click();
		await expect(btn).toContainText('Expand');
		await expect(btn).toHaveAttribute('aria-expanded', 'false');
		await expect(page.locator('.cbp-see-more-container')).toBeVisible();
	});

	test('Height calculation with headers and footers', async ({
		page,
		editor,
	}) => {
		await setHeader(page, 'headlights');
		await setFooter(page, 'simpleStringEnd');
		await addCode(editor, fiveLines);
		await enableMaxHeight(page);
		await setHeightDesign(page, 'blockLeft');
		await page.getByLabel('Hide after line').fill('3');
		await previewPage(page);
		const frontBlock = page.locator('.wp-block-kevinbatdorf-code-block-pro');
		await expect(getLineSpan(frontBlock, 'line 5')).not.toBeInViewport();
		const expandBtn = page.locator('.cbp-see-more-simple-btn');
		await expandBtn.click();
		await expect(getLineSpan(frontBlock, 'line 5')).toBeVisible();
	});

	test('Editor max height control', async ({ page, editor }) => {
		await addCode(editor, fiveLines);
		const block = getBlock(editor);
		const initialHeight = await block.evaluate(
			(el) => el.getBoundingClientRect().height,
		);
		expect(initialHeight).toBeGreaterThan(80);
		await openPanel(page, 'Max Height');
		await page.getByLabel('Max editor height (admin only)').fill('70');
		await page.waitForTimeout(500);
		const newHeight = await block.evaluate(
			(el) => el.getBoundingClientRect().height,
		);
		expect(newHeight).toBeLessThan(initialHeight);
	});
});
