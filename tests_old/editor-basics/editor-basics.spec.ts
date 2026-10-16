import { expect, test } from '@wordpress/e2e-test-utils-playwright';
import {
	addCode,
	getBlock,
	getCodePre,
	insertCodeBlock,
	newPost,
	openPanel,
	previewPage,
	setCheckbox,
	setTheme,
	setupCodeBlock,
} from '../helpers';

test.beforeEach(async ({ admin, editor, page, requestUtils }) => {
	await setupCodeBlock({ admin, editor, page, requestUtils });
});

test.describe('Font Styling', () => {
	test('Font size defaults to Small', async ({ page, editor }) => {
		await addCode(editor, 'const x = 1;');
		await openPanel(page, 'Font Styling');
		const pre = getCodePre(editor);
		await expect(pre).toHaveCSS('font-size', '14px'); // 0.875rem (Small)
	});

	test('Line height defaults to Tight', async ({ page, editor }) => {
		await addCode(editor, 'const x = 1;');
		await openPanel(page, 'Font Styling');
		const pre = getCodePre(editor);
		await expect(pre).toHaveCSS('line-height', '20px'); // 1.25rem (Tight)
	});

	test('Font family can be changed to Fira Code', async ({ page, editor }) => {
		await addCode(editor, 'const hello = "world";');
		await openPanel(page, 'Font Styling');
		await page
			.locator('#code-block-pro-font-family')
			.selectOption('Code-Pro-Fira-Code');
		await previewPage(page);
		const frontBlock = page.locator('.wp-block-kevinbatdorf-code-block-pro');
		const style = await frontBlock.getAttribute('style');
		expect(style).toContain('Code-Pro-Fira-Code');
	});

	test('System Default font removes font-family', async ({ page, editor }) => {
		await addCode(editor, 'const hello = "world";');
		await openPanel(page, 'Font Styling');
		// Set to System Default (empty value)
		await page.locator('#code-block-pro-font-family').selectOption('');
		await previewPage(page);
		const frontBlock = page.locator('.wp-block-kevinbatdorf-code-block-pro');
		const style = await frontBlock.getAttribute('style');
		expect(style).not.toContain('font-family');
	});
});

test.describe('Padding', () => {
	test('Padding enabled without line numbers', async ({ page, editor }) => {
		await addCode(editor, 'const x = 1;');
		await openPanel(page, 'Extra Settings');
		const checkbox = page.locator('[data-cy="disable-padding"]');
		await expect(checkbox).not.toBeChecked();
		// Check editor
		const pre = getCodePre(editor);
		await expect(pre).toHaveCSS('padding', '16px 0px 16px 16px');
		// Check front-end
		await previewPage(page);
		const frontPre = page.locator(
			'.wp-block-kevinbatdorf-code-block-pro pre:not(.code-block-pro-copy-button-pre)',
		);
		await expect(frontPre).toHaveCSS('padding', '16px 0px 16px 16px');
	});

	test('Padding disabled without line numbers', async ({ page, editor }) => {
		await addCode(editor, 'const x = 1;');
		await openPanel(page, 'Extra Settings');
		await setCheckbox(page, 'disable-padding', true);
		// Check editor
		const pre = getCodePre(editor);
		const padding = await pre.evaluate((el) =>
			window.getComputedStyle(el).getPropertyValue('padding'),
		);
		expect(padding).toContain('0px');
		// Check front-end
		await previewPage(page);
		const frontPre = page.locator(
			'.wp-block-kevinbatdorf-code-block-pro pre:not(.code-block-pro-copy-button-pre)',
		);
		await expect(frontPre).toHaveCSS('padding-top', '0px');
	});

	test('Padding enabled with line numbers', async ({ page, editor }) => {
		// Ensure padding is enabled (may have been disabled by previous test)
		await openPanel(page, 'Extra Settings');
		const disablePadding = page.locator('[data-cy="disable-padding"]');
		if (await disablePadding.isChecked()) {
			await disablePadding.uncheck();
		}
		await addCode(editor, 'line 1\nline 2\nline 3');
		await openPanel(page, 'Line Settings');
		await setCheckbox(page, 'show-line-numbers', true);
		await previewPage(page);
		const frontPre = page.locator(
			'.wp-block-kevinbatdorf-code-block-pro pre:not(.code-block-pro-copy-button-pre)',
		);
		// With line numbers the left padding may be larger for the gutter
		await expect(frontPre).toHaveCSS('padding-top', '16px');
		await expect(frontPre).toHaveCSS('padding-right', '0px');
		await expect(frontPre).toHaveCSS('padding-bottom', '16px');
	});

	test('Padding disabled with line numbers', async ({ page, editor }) => {
		await openPanel(page, 'Extra Settings');
		await setCheckbox(page, 'disable-padding', true);
		await openPanel(page, 'Line Settings');
		await setCheckbox(page, 'show-line-numbers', true);
		await addCode(editor, 'line 1\nline 2\nline 3');
		await previewPage(page);
		const frontPre = page.locator(
			'.wp-block-kevinbatdorf-code-block-pro pre:not(.code-block-pro-copy-button-pre)',
		);
		await expect(frontPre).toHaveCSS('padding-top', '0px');
	});
});

test.describe('Extra Settings', () => {
	test('URI decoding off does not preserve entities', async ({
		page,
		editor,
	}) => {
		await openPanel(page, 'Extra Settings');
		const checkbox = page.locator('[data-cy="use-decode-uri"]');
		await expect(checkbox).not.toBeChecked();
		// Type code with HTML entity
		await addCode(editor, '<script>&lt;</script>');
		// Editor pre should not contain encoded &lt;
		const block = getBlock(editor);
		const html = await block
			.locator('pre:not(.code-block-pro-copy-button-pre)')
			.innerHTML();
		expect(html).not.toContain('&amp;lt;');
		// Preview: front-end should render < not &lt;
		await previewPage(page);
		const frontBlock = page.locator('.wp-block-kevinbatdorf-code-block-pro');
		await expect(frontBlock).toContainText('<script><</script>');
	});

	test('URI decoding preserves entities when enabled', async ({
		page,
		editor,
	}) => {
		await openPanel(page, 'Extra Settings');
		await setCheckbox(page, 'use-decode-uri', true);
		await addCode(editor, '<script>&lt;</script>');
		// Editor should show syntax-highlighted lt
		const block = getBlock(editor);
		const html = await block
			.locator('pre:not(.code-block-pro-copy-button-pre)')
			.innerHTML();
		expect(html).toContain('lt');
		// Preview: front-end should preserve &lt;
		await previewPage(page);
		const frontBlock = page.locator('.wp-block-kevinbatdorf-code-block-pro');
		await expect(frontBlock).toContainText('&lt;');
	});

	test('Shortcode escaping is on by default', async ({ page }) => {
		await openPanel(page, 'Extra Settings');
		const checkbox = page.locator('[data-cy="use-escape-shortcodes"]');
		await expect(checkbox).toBeChecked();
	});

	test('Shortcodes render literally with escaping on', async ({
		page,
		editor,
	}) => {
		await openPanel(page, 'Language');
		await page.locator('#code-block-pro-language').selectOption('plaintext');
		await addCode(editor, '[embed]foo[/embed]');
		await previewPage(page);
		const frontBlock = page.locator('.wp-block-kevinbatdorf-code-block-pro');
		await expect(frontBlock).toContainText('[embed]foo[/embed]');
	});

	test('Shortcodes render as HTML with escaping off', async ({
		page,
		editor,
	}) => {
		await openPanel(page, 'Language');
		await page.locator('#code-block-pro-language').selectOption('plaintext');
		await openPanel(page, 'Extra Settings');
		await setCheckbox(page, 'use-escape-shortcodes', false);
		await addCode(editor, '[embed]https://example.com[/embed]');
		await previewPage(page);
		const frontBlock = page.locator('.wp-block-kevinbatdorf-code-block-pro');
		// With escaping off, [embed] should be rendered by WP as a link
		const html = await frontBlock.innerHTML();
		expect(html).toContain('<a');
	});
});

test.describe('Settings Persistence', () => {
	test('Theme persists across new posts', async ({ admin, page, editor }) => {
		await addCode(editor, 'const x = 1;');
		await setTheme(page, 'dracula');
		const block = getBlock(editor);
		const constSelector =
			'pre:not(.code-block-pro-copy-button-pre) span.line span';
		// Verify Dracula rendered on first post
		await expect
			.poll(
				async () => {
					const span = block.locator(constSelector).first();
					return span.evaluate((el) => window.getComputedStyle(el).color);
				},
				{ timeout: 10000 },
			)
			.toBe('rgb(255, 121, 198)');
		// Save draft and wait for the theme settings REST API to complete
		await page.getByRole('button', { name: 'Save draft' }).click();
		await expect(page.locator('.editor-post-saved-state.is-saved')).toBeVisible(
			{ timeout: 10000 },
		);
		// Wait for async settings save to finish
		await page.waitForTimeout(1000);
		// Create a new post and verify theme persists
		await newPost(admin, 'Persistence test');
		await insertCodeBlock(editor);
		await addCode(editor, 'const x = 1;');
		const newBlock = getBlock(editor);
		const constSpan = newBlock.locator(constSelector).first();
		await expect(constSpan).toBeVisible();
		const color = await constSpan.evaluate(
			(el) => window.getComputedStyle(el).color,
		);
		// Theme should persist — color should not be plain black/unstyled
		expect(color).not.toBe('rgb(0, 0, 0)');
		expect(color).toBeTruthy();
	});
});
