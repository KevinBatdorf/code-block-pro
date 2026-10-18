import type { Page } from '@playwright/test';
import { expect, test } from '@wordpress/e2e-test-utils-playwright';

type Glyph = [string, string, string, string, string];

/** Every character of each block's code with the color and font it is painted in. */
const paint = (page: Page) =>
	page.locator('.cbp-block').evaluateAll((blocks) =>
		blocks.map((block) => {
			const glyphs: Glyph[] = [];
			const code = block.querySelector('pre code') as Element;
			const walker = document.createTreeWalker(code, NodeFilter.SHOW_TEXT);
			for (let node = walker.nextNode(); node; node = walker.nextNode()) {
				const style = getComputedStyle(node.parentElement as Element);
				for (const char of node.textContent ?? '') {
					if (char.trim() === '') continue;
					glyphs.push([
						char,
						style.color,
						style.fontStyle,
						style.fontWeight,
						style.textDecorationLine,
					]);
				}
			}
			const pre = getComputedStyle(block.querySelector('pre') as Element);
			return { glyphs, color: pre.color, background: pre.backgroundColor };
		}),
	);

const watchCsp = (page: Page) =>
	page.addInitScript(() => {
		const found: string[] = [];
		Object.assign(window, { cspViolations: found });
		// Core prints inline <style> elements of its own, which the policy refuses too.
		document.addEventListener('securitypolicyviolation', (event) => {
			const target = event.target as Element | null;
			if (
				target?.closest?.('.cbp-block') ||
				event.blockedURI.includes('code-block-pro')
			) {
				found.push(`${event.violatedDirective}: ${event.blockedURI}`);
			}
		});
	});

const cspViolations = (page: Page) =>
	page.evaluate(
		() => (window as unknown as { cspViolations: string[] }).cspViolations,
	);

test('one render under two conditions paints what each theme paints alone', async ({
	page,
}, testInfo) => {
	await watchCsp(page);
	await page.emulateMedia({ colorScheme: 'light' });
	const response = await page.goto('/two-conditions/');
	expect(response?.headers()['content-security-policy']).toContain(
		"style-src 'self'",
	);
	await expect(page.locator('.cbp-block')).toHaveCount(9);
	await expect(page.locator('.cbp-block [style]')).toHaveCount(0);
	await expect(
		page.locator(
			'link[rel="stylesheet"][href*="code-block-pro-profile=twotone"]',
		),
	).toHaveCount(1);
	const profileBlock = page.locator('.cbp-profile-twotone').first();
	const markup = await profileBlock.innerHTML();

	for (const [scheme, alone] of [
		['light', 1],
		['dark', 2],
	] as const) {
		await page.emulateMedia({ colorScheme: scheme });
		const blocks = await paint(page);
		for (let language = 0; language < 3; language++) {
			const profile = blocks[language * 3];
			const expected = blocks[language * 3 + alone];
			expect(profile.glyphs.length).toBeGreaterThan(20);
			expect(profile.glyphs, `${scheme}, block ${language}`).toEqual(
				expected.glyphs,
			);
			expect([profile.color, profile.background]).toEqual([
				expected.color,
				expected.background,
			]);
		}
		const shot = testInfo.outputPath(`two-conditions-${scheme}.png`);
		await profileBlock.screenshot({ path: shot });
		await testInfo.attach(`two-conditions-${scheme}`, {
			path: shot,
			contentType: 'image/png',
		});
	}

	expect(await profileBlock.innerHTML()).toBe(markup);
	expect(await cspViolations(page)).toEqual([]);
});

test('the later of two active conditions wins, and each stays off until triggered', async ({
	page,
}) => {
	await watchCsp(page);
	await page.emulateMedia({ colorScheme: 'light' });
	await page.goto('/stacked-conditions/');
	await expect(page.locator('.cbp-block')).toHaveCount(18);
	const themes = [
		'github-light',
		'monokai',
		'dracula',
		'nord',
		'solarized-dark',
	];
	// `chosen` is what a switch button sets on the block; it overrides every trigger.
	const states = [
		{
			dark: false,
			funky: false,
			chosen: '',
			theme: 'github-light',
			background: 'rgb(253, 246, 227)',
		},
		{
			dark: true,
			funky: false,
			chosen: '',
			theme: 'monokai',
			php: 'solarized-dark',
		},
		{
			dark: false,
			funky: true,
			chosen: '',
			theme: 'dracula',
			background: 'rgb(16, 16, 16)',
		},
		{
			dark: true,
			funky: true,
			chosen: '',
			theme: 'dracula',
			background: 'rgb(16, 16, 16)',
		},
		{ dark: false, funky: false, chosen: 'contrast', theme: 'nord' },
		{ dark: true, funky: true, chosen: 'contrast', theme: 'nord' },
		{
			dark: true,
			funky: true,
			chosen: 'main',
			theme: 'github-light',
			background: 'rgb(253, 246, 227)',
		},
		{
			dark: false,
			funky: true,
			chosen: 'dark',
			theme: 'monokai',
			php: 'solarized-dark',
		},
	];

	for (const state of states) {
		await page.emulateMedia({ colorScheme: state.dark ? 'dark' : 'light' });
		await page.evaluate(({ funky, chosen }) => {
			document.body.classList.toggle('is-funky', funky);
			for (const block of document.querySelectorAll('.cbp-profile-stacked')) {
				if (chosen) block.setAttribute('data-cbp-condition', chosen);
				else block.removeAttribute('data-cbp-condition');
			}
		}, state);
		const blocks = await paint(page);
		for (let language = 0; language < 3; language++) {
			const theme = language === 2 && state.php ? state.php : state.theme;
			const profile = blocks[language * 6];
			const expected = blocks[language * 6 + 1 + themes.indexOf(theme)];
			const label = `${JSON.stringify(state)}, block ${language}`;
			expect(profile.glyphs, label).toEqual(expected.glyphs);
			expect(profile.color, label).toBe(expected.color);
			expect(profile.background, label).toBe(
				state.background ?? expected.background,
			);
		}
	}
	expect(await cspViolations(page)).toEqual([]);
});

test('editing a profile recolors every block that uses it, with no re-save', async ({
	page,
	admin,
	requestUtils,
}) => {
	await requestUtils.login();
	const pages = ['/uses-default/', '/also-uses-default/'];
	// Rendered first, so the edit has cached renders to replace.
	const before = [];
	for (const path of pages) {
		await page.goto(path);
		before.push(
			await page.locator('.cbp-profile-default pre').getAttribute('class'),
		);
	}
	// A retry finds the theme the first attempt saved, so switch to the other one.
	const [theme, background] =
		before[0] === 'cbp-theme-dracula'
			? ['monokai', 'rgb(39, 40, 34)']
			: ['dracula', 'rgb(40, 42, 54)'];
	expect(before).toEqual([before[0], before[0]]);

	await admin.visitAdminPage('edit.php', 'post_type=cbp_profile');
	await page.locator('a.row-title', { hasText: 'Default' }).click();
	await page
		.locator('select[name="cbp_profile[conditions][0][theme]"]')
		.selectOption(theme);
	await page.locator('#publish').click();
	await expect(page.locator('#message')).toBeVisible();

	for (const path of pages) {
		await page.goto(path);
		const pre = page.locator('.cbp-profile-default pre');
		await expect(pre).toHaveClass(`cbp-theme-${theme}`);
		expect(
			await pre.evaluate((el) => getComputedStyle(el).backgroundColor),
		).toBe(background);
	}
	await page.goto('/uses-default/');
	await expect(
		page.locator('.cbp-block:not(.cbp-profile-default) pre'),
	).toHaveClass('cbp-theme-github-light');
});
