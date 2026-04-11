import { expect, test } from '@wordpress/e2e-test-utils-playwright';
import {
	addCode,
	getBlock,
	openPanel,
	setFooter,
	setHeader,
	setupCodeBlock,
} from '../helpers';

test.beforeEach(async ({ admin, editor, page, requestUtils }) => {
	await setupCodeBlock({ admin, editor, page, requestUtils });
});

test.describe('Headers', () => {
	test('Default header renders and can switch types', async ({
		page,
		editor,
	}) => {
		await addCode(editor, 'const x = 1;');
		const block = getBlock(editor);
		// Default is headlights - has colored circles
		const headerHtml = await block.innerHTML();
		expect(headerHtml).toContain('FF5F56'); // Red circle color
		// Switch to headlightsMuted
		await setHeader(page, 'headlightsMuted');
		const updatedHtml = await block.innerHTML();
		expect(updatedHtml).toContain('d8dee9'); // Muted color
	});

	test('Header accepts text input', async ({ page, editor }) => {
		await addCode(editor, 'const x = 1;');
		await setHeader(page, 'simpleString');
		const block = getBlock(editor);
		// Should show language name (JavaScript)
		await expect(block).toContainText('JavaScript');
		// Change language to Ruby
		await openPanel(page, 'Language');
		await page.locator('#code-block-pro-language').selectOption('ruby');
		await openPanel(page, 'Header Type');
		await expect(block).toContainText('Ruby');
		// Type custom header text
		await page.locator('#code-block-pro-header-text').fill('Hello WordPress');
		await expect(block).toContainText('Hello WordPress');
	});
});

test.describe('Footers', () => {
	test('No footer by default; can add and remove', async ({ page, editor }) => {
		await addCode(editor, 'const x = 1;');
		await setHeader(page, 'none');
		const block = getBlock(editor);
		// With no header and no footer, there should be no "JavaScript" text
		// (only the code itself should be visible)
		await expect(block).not.toContainText('JavaScript');
		// Add footer — should now show language name
		await setFooter(page, 'simpleStringEnd');
		await expect(block).toContainText('JavaScript');
		// Remove footer
		await setFooter(page, 'none');
		await expect(block).not.toContainText('JavaScript');
	});

	test('Footer accepts text input', async ({ page, editor }) => {
		await addCode(editor, 'const x = 1;');
		await setHeader(page, 'none');
		await setFooter(page, 'simpleStringEnd');
		const block = getBlock(editor);
		// Should show "JavaScript" as default
		await expect(block).toContainText('JavaScript');
		// Switch language
		await openPanel(page, 'Language');
		await page.locator('#code-block-pro-language').selectOption('ruby');
		await openPanel(page, 'Footer Type');
		await expect(block).toContainText('Ruby');
		// Type custom footer text
		await page.locator('#code-block-pro-footer-text').fill('Custom Footer');
		await expect(block).toContainText('Custom Footer');
	});
});
