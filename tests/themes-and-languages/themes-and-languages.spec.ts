import { expect, test } from '@wordpress/e2e-test-utils-playwright';
import {
	addCode,
	getBlock,
	openPanel,
	setTheme,
	setupCodeBlock,
} from '../helpers';

test.beforeEach(async ({ admin, editor, page, requestUtils }) => {
	await setupCodeBlock({ admin, editor, page, requestUtils });
});

test.describe('Theme switching', () => {
	test('Renders correct colors per theme', async ({ page, editor }) => {
		await addCode(editor, 'const hello = "world";');
		const block = getBlock(editor);
		const constSpanSelector =
			'pre:not(.code-block-pro-copy-button-pre) span.line span';

		// Nord — const should be #81A1C1
		await setTheme(page, 'nord');
		let constSpan = block.locator(constSpanSelector).first();
		await expect(constSpan).toBeVisible();
		let color = await constSpan.evaluate(
			(el) => window.getComputedStyle(el).color,
		);
		expect(color).toBe('rgb(129, 161, 193)'); // #81A1C1

		// Dracula — const should be #FF79C6
		await setTheme(page, 'dracula');
		constSpan = block.locator(constSpanSelector).first();
		color = await constSpan.evaluate((el) => window.getComputedStyle(el).color);
		expect(color).toBe('rgb(255, 121, 198)'); // #FF79C6

		// Rose Pine Dawn — const should be #286983
		await setTheme(page, 'rose-pine-dawn');
		constSpan = block.locator(constSpanSelector).first();
		color = await constSpan.evaluate((el) => window.getComputedStyle(el).color);
		expect(color).toBe('rgb(40, 105, 131)'); // #286983

		// Poimandres — const should be #91B4D5
		await setTheme(page, 'poimandres');
		constSpan = block.locator(constSpanSelector).first();
		color = await constSpan.evaluate((el) => window.getComputedStyle(el).color);
		expect(color).toBe('rgb(145, 180, 213)'); // #91B4D5
	});

	test('Themes can be disabled via manager', async ({ page }) => {
		await openPanel(page, 'Theme');
		await expect(
			page.locator('button#code-block-pro-theme-nord'),
		).toBeVisible();
		await page.locator('[data-cy="manage-themes"]').click();
		const modal = page.getByRole('dialog');
		await modal.getByText('Nord', { exact: true }).click();
		await modal.getByRole('button', { name: 'Close' }).click();
		await expect(
			page.locator('button#code-block-pro-theme-nord'),
		).not.toBeVisible();
	});

	test('Themes can be filtered via search', async ({ page }) => {
		await openPanel(page, 'Theme');
		await page.locator('#code-block-pro-search-themes').fill('monokai');
		await expect(
			page.locator('button[id*="code-block-pro-theme-monokai"]').first(),
		).toBeVisible();
		await expect(
			page.locator('button#code-block-pro-theme-dracula'),
		).not.toBeVisible();
	});

	test('Themes CTA shows in panel and modal', async ({ page }) => {
		await openPanel(page, 'Theme');
		// CTA links should appear in the panel
		const ctaLinks = page.locator('a[href*="code-block-pro.com"]');
		const panelCtaCount = await ctaLinks.count();
		expect(panelCtaCount).toBeGreaterThanOrEqual(2);
		// Open modal, check CTA there too
		await page.locator('[data-cy="manage-themes"]').click();
		const modal = page.getByRole('dialog');
		const modalCta = modal.locator('a[href*="code-block-pro.com"]');
		const modalCtaCount = await modalCta.count();
		expect(modalCtaCount).toBeGreaterThanOrEqual(1);
		await modal.getByRole('button', { name: 'Close' }).click();
	});

	test('Theme CTA can be removed via filter hook', async ({ page, editor }) => {
		// Use wp.hooks.addFilter to replace themes with only Nord
		await page.evaluate(() => {
			// @ts-expect-error wp is global in WP admin
			window.wp.hooks.addFilter(
				'blocks.codeBlockPro.themes',
				'test/override',
				() => ({
					nord: {
						name: 'Nord',
						priority: 1,
						styles: {
							'color-text': '#D8DEE9',
							'color-background': '#2E3440',
						},
					},
				}),
			);
		});
		await addCode(editor, 'const x = 1;');
		await openPanel(page, 'Theme');
		// CTA links should no longer appear
		const ctaLinks = page.locator('a[href*="code-block-pro.com"]');
		await expect(ctaLinks).toHaveCount(0);
	});

	test('Random theme renders without errors', async ({ page, editor }) => {
		await addCode(editor, 'const x = 1;');
		await openPanel(page, 'Theme');
		const themeButtons = page.locator('button[id^="code-block-pro-theme-"]');
		const count = await themeButtons.count();
		expect(count).toBeGreaterThan(0);
		const randomIndex = Math.floor(Math.random() * Math.min(count, 10));
		const btn = themeButtons.nth(randomIndex);
		await btn.scrollIntoViewIfNeeded();
		await btn.click();
		// Should not show loading or error text
		const block = getBlock(editor);
		await expect(block).toContainText('const');
		const blockHtml = await block.innerHTML();
		expect(blockHtml).not.toContain('Loading...');
		expect(blockHtml).not.toContain('ssembly');
	});
});

test.describe('Language switching', () => {
	test('Theme colors change per language; plaintext shows raw text', async ({
		page,
		editor,
	}) => {
		await addCode(editor, 'const hello = "world";');
		await setTheme(page, 'nord');
		const block = getBlock(editor);
		// JS — const should have specific Nord blue color
		const constSpan = block
			.locator('pre:not(.code-block-pro-copy-button-pre) span.line span')
			.first();
		const jsColor = await constSpan.evaluate(
			(el) => window.getComputedStyle(el).color,
		);
		expect(jsColor).toBe('rgb(129, 161, 193)'); // #81A1C1

		// Switch to plaintext
		await openPanel(page, 'Language');
		await page.locator('#code-block-pro-language').selectOption('plaintext');
		// Plaintext should have fewer colored spans
		const plainSpans = block.locator(
			'pre:not(.code-block-pro-copy-button-pre) span.line span',
		);
		const plainCount = await plainSpans.count();
		// Plaintext wraps everything in a single span
		expect(plainCount).toBeLessThanOrEqual(2);
	});
});
