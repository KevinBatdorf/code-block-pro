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

test.describe('Copy button editor', () => {
	test('Copy button renders by default and can be toggled', async ({
		page,
		editor,
	}) => {
		await addCode(editor, 'const x = 1;');
		await openPanel(page, 'Buttons');
		const checkbox = page.locator('[data-cy="copy-button"]');
		await expect(checkbox).toBeChecked();
		const block = getBlock(editor);
		await expect(block.locator('.code-block-pro-copy-button')).toBeVisible();
		// Uncheck
		await checkbox.uncheck();
		await expect(
			block.locator('.code-block-pro-copy-button'),
		).not.toBeVisible();
	});

	test('Can switch button styles', async ({ page, editor }) => {
		await addCode(editor, 'const x = 1;');
		await openPanel(page, 'Buttons');
		const block = getBlock(editor);
		// Default heroicons — check sidebar aria-current and block SVG
		const heroiconsBtn = page.locator('#code-block-pro-copy-button-heroicons');
		await expect(heroiconsBtn).toHaveAttribute('aria-current', 'true');
		let blockHtml = await block.innerHTML();
		expect(blockHtml).toContain('M9 5H7a2 2 0 00-2 2v12a2'); // Clipboard.tsx
		expect(blockHtml).not.toContain('M16.5 8.25V6a2.25 2.25'); // TwoSquares.tsx

		// Switch to twoSquares
		await page.locator('#code-block-pro-copy-button-twoSquares').click();
		await expect(heroiconsBtn).toHaveAttribute('aria-current', 'false');
		await expect(
			page.locator('#code-block-pro-copy-button-twoSquares'),
		).toHaveAttribute('aria-current', 'true');
		blockHtml = await block.innerHTML();
		expect(blockHtml).toContain('M16.5 8.25V6a2.25 2.25'); // TwoSquares.tsx
		expect(blockHtml).not.toContain('M9 5H7a2 2 0 00-2 2v12a2'); // Clipboard.tsx
	});

	test('Hides button options when unchecked', async ({ page }) => {
		await openPanel(page, 'Buttons');
		const checkbox = page.locator('[data-cy="copy-button"]');
		await checkbox.uncheck();
		await expect(
			page.locator('#code-block-pro-copy-button-heroicons'),
		).not.toBeVisible();
	});

	test('Text button supports custom text', async ({
		page,
		editor,
		context,
	}) => {
		await context.grantPermissions(['clipboard-read', 'clipboard-write']);
		await addCode(editor, 'const x = 1;');
		await openPanel(page, 'Buttons');
		// Switch to textSimple
		await page.locator('#code-block-pro-copy-button-textSimple').click();
		const block = getBlock(editor);
		// Default text should be "Copy"
		await expect(block.locator('.code-block-pro-copy-button')).toContainText(
			'Copy',
		);
		// Type custom copy text
		await page.locator('#code-block-pro-copy-button-text').fill('Grab it');
		await expect(block.locator('.code-block-pro-copy-button')).toContainText(
			'Grab it',
		);
		// Type custom "Copied!" text
		await page
			.locator('#code-block-pro-copy-button-text-copied')
			.fill('Got it!');
		// Preview and verify front-end
		await previewPage(page);
		const frontBlock = page.locator('.wp-block-kevinbatdorf-code-block-pro');
		const copyBtn = frontBlock.locator('.code-block-pro-copy-button');
		await expect(copyBtn).toBeVisible({ timeout: 10000 });
		await expect(copyBtn).toContainText('Grab it');
		// Click copy — text should change to "Got it!"
		await copyBtn.click();
		await expect(copyBtn).toContainText('Got it!');
	});
});

test.describe('Copy button front-end', () => {
	test('Copies code to clipboard on click', async ({
		page,
		editor,
		context,
	}) => {
		await context.grantPermissions(['clipboard-read', 'clipboard-write']);
		await addCode(editor, 'const foo = "bar";');
		await previewPage(page);
		const frontBlock = page.locator('.wp-block-kevinbatdorf-code-block-pro');
		await expect(frontBlock).toBeVisible();
		const copyBtn = frontBlock.locator('.code-block-pro-copy-button');
		await expect(copyBtn).toBeVisible({ timeout: 10000 });
		await copyBtn.click();
		const clipboard = await page.evaluate(() => navigator.clipboard.readText());
		expect(clipboard).toContain('const foo = "bar"');
	});

	test('Copies URI-decoded code', async ({ page, editor, context }) => {
		await context.grantPermissions(['clipboard-read', 'clipboard-write']);
		await openPanel(page, 'Extra Settings');
		await setCheckbox(page, 'use-decode-uri', true);
		await addCode(editor, '<script>&lt;</script>');
		await previewPage(page);
		const frontBlock = page.locator('.wp-block-kevinbatdorf-code-block-pro');
		await expect(frontBlock).toBeVisible();
		const copyBtn = frontBlock.locator('.code-block-pro-copy-button');
		await expect(copyBtn).toBeVisible({ timeout: 10000 });
		await copyBtn.click();
		const clipboard = await page.evaluate(() => navigator.clipboard.readText());
		// Should contain the full original text with &lt; preserved
		expect(clipboard).toContain('<script>&lt;</script>');
	});

	test('Shortcode-escaped code copies correctly', async ({
		page,
		editor,
		context,
	}) => {
		await context.grantPermissions(['clipboard-read', 'clipboard-write']);
		await openPanel(page, 'Language');
		await page.locator('#code-block-pro-language').selectOption('plaintext');
		await addCode(editor, '[embed]foo[/embed]');
		await previewPage(page);
		const frontBlock = page.locator('.wp-block-kevinbatdorf-code-block-pro');
		await expect(frontBlock).toBeVisible();
		const copyBtn = frontBlock.locator('.code-block-pro-copy-button');
		await expect(copyBtn).toBeVisible({ timeout: 10000 });
		await copyBtn.click();
		const clipboard = await page.evaluate(() => navigator.clipboard.readText());
		expect(clipboard).toContain('[embed]foo[/embed]');
	});

	test('Audio/video shortcodes copy with escaping on', async ({
		page,
		editor,
		context,
	}) => {
		await context.grantPermissions(['clipboard-read', 'clipboard-write']);
		await openPanel(page, 'Language');
		await page.locator('#code-block-pro-language').selectOption('plaintext');
		await addCode(editor, '[audio src="test.mp3"]\n[video src="test.mp4"]');
		await previewPage(page);
		const frontBlock = page.locator('.wp-block-kevinbatdorf-code-block-pro');
		await expect(frontBlock).toBeVisible();
		const copyBtn = frontBlock.locator('.code-block-pro-copy-button');
		await expect(copyBtn).toBeVisible({ timeout: 10000 });
		await copyBtn.click();
		const clipboard = await page.evaluate(() => navigator.clipboard.readText());
		expect(clipboard).toContain('[audio src="test.mp3"]');
		expect(clipboard).toContain('[video src="test.mp4"]');
	});

	test('Audio/video shortcodes render when escaping off', async ({
		page,
		editor,
		context,
	}) => {
		await context.grantPermissions(['clipboard-read', 'clipboard-write']);
		await openPanel(page, 'Language');
		await page.locator('#code-block-pro-language').selectOption('plaintext');
		await openPanel(page, 'Extra Settings');
		await setCheckbox(page, 'use-escape-shortcodes', false);
		await addCode(editor, '[audio src="test.mp3"]\n[video src="test.mp4"]');
		await previewPage(page);
		const frontBlock = page.locator('.wp-block-kevinbatdorf-code-block-pro');
		await expect(frontBlock).toBeVisible();
		const copyBtn = frontBlock.locator('.code-block-pro-copy-button');
		await expect(copyBtn).toBeVisible({ timeout: 10000 });
		await copyBtn.click();
		const clipboard = await page.evaluate(() => navigator.clipboard.readText());
		// With escaping off, shortcodes are rendered by WP — clipboard differs
		expect(clipboard).not.toContain('[audio src="test.mp3"]');
	});
});
