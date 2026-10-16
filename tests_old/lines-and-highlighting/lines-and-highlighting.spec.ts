import { expect, test } from '@wordpress/e2e-test-utils-playwright';
import {
	addCode,
	getBlock,
	openPanel,
	previewPage,
	setCheckbox,
	setupCodeBlock,
} from '../helpers';

test.beforeEach(async ({ admin, editor, page, requestUtils }) => {
	await setupCodeBlock({ admin, editor, page, requestUtils });
});

test.describe('Line numbers', () => {
	test('Line numbers toggle on/off', async ({ page, editor }) => {
		await addCode(editor, 'const x = 1;');
		await openPanel(page, 'Line Settings');
		const checkbox = page.locator('[data-cy="show-line-numbers"]');
		await expect(checkbox).not.toBeChecked();
		const block = getBlock(editor);
		await expect(block).not.toHaveClass(/cbp-has-line-numbers/);
		// Enable
		await setCheckbox(page, 'show-line-numbers', true);
		await expect(block).toHaveClass(/cbp-has-line-numbers/);
		// Disable
		await setCheckbox(page, 'show-line-numbers', false);
		await expect(block).not.toHaveClass(/cbp-has-line-numbers/);
	});

	test('Line numbers start from custom value', async ({ page, editor }) => {
		await addCode(editor, 'line 1\nline 2');
		await openPanel(page, 'Line Settings');
		await setCheckbox(page, 'show-line-numbers', true);
		await page.locator('#code-block-pro-line-number-start').fill('5');
		const block = getBlock(editor);
		const style = await block.getAttribute('style');
		// Assert exact value, not just presence
		expect(style).toContain('--cbp-line-number-start: 5');
	});
});

test.describe('Line highlights', () => {
	test('Single and range line highlighting', async ({ page, editor }) => {
		const fiveLines = 'line 1\nline 2\nline 3\nline 4\nline 5';
		await addCode(editor, fiveLines);
		await openPanel(page, 'Line Settings');
		await setCheckbox(page, 'show-line-numbers', true);
		await setCheckbox(page, 'enable-highlighting', true);
		// Highlight line 2
		await page.locator('#code-block-pro-show-highlighted-lines').fill('2');
		const block = getBlock(editor);
		let highlights = block.locator('.cbp-line-highlight');
		await expect(highlights).toHaveCount(1);
		// Highlight range [2,4]
		await page.locator('#code-block-pro-show-highlighted-lines').fill('[2,4]');
		highlights = block.locator('.cbp-line-highlight');
		await expect(highlights).toHaveCount(3);
	});

	test('No hover highlighting by default on front-end', async ({
		page,
		editor,
	}) => {
		const fiveLines = 'line 1\nline 2\nline 3\nline 4\nline 5';
		await addCode(editor, fiveLines);
		await openPanel(page, 'Line Settings');
		await setCheckbox(page, 'show-line-numbers', true);
		await previewPage(page);
		const highlighters = page.locator('.cbp-line-highlighter');
		await expect(highlighters).toHaveCount(0);
	});

	test('Hover highlighting enabled on front-end', async ({ page, editor }) => {
		const fiveLines = 'line 1\nline 2\nline 3\nline 4\nline 5';
		await addCode(editor, fiveLines);
		await openPanel(page, 'Line Settings');
		await setCheckbox(page, 'show-line-numbers', true);
		await setCheckbox(page, 'enable-highlighting-hover', true);
		await previewPage(page);
		const highlighters = page.locator('.cbp-line-highlighter');
		await expect(highlighters).toHaveCount(5);
	});
});

test.describe('Line blurring', () => {
	test('Lines can be blurred by number and range', async ({ page, editor }) => {
		const fiveLines = 'line 1\nline 2\nline 3\nline 4\nline 5';
		await addCode(editor, fiveLines);
		await openPanel(page, 'Line Settings');
		await setCheckbox(page, 'show-line-numbers', true);
		const block = getBlock(editor);
		let noBlur = block.locator('.cbp-no-blur');
		await expect(noBlur).toHaveCount(0);
		// Enable blur
		await setCheckbox(page, 'enable-blur', true);
		await expect(block).toHaveClass(/cbp-blur-enabled/);
		// Blur line 2
		await page.locator('#code-block-pro-show-blurred-lines').fill('2');
		noBlur = block.locator('.cbp-no-blur');
		await expect(noBlur).toHaveCount(1);
		// Range [2,4]
		await page.locator('#code-block-pro-show-blurred-lines').fill('[2,4]');
		noBlur = block.locator('.cbp-no-blur');
		await expect(noBlur).toHaveCount(3);
	});
});
