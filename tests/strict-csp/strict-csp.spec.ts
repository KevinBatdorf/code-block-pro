import { expect, type Page, test } from '@playwright/test';

const color = (page: Page, selector: string) =>
	page
		.locator(selector)
		.first()
		.evaluate((el) => getComputedStyle(el).color);

const background = (page: Page, selector: string) =>
	page
		.locator(selector)
		.first()
		.evaluate((el) => getComputedStyle(el).backgroundColor);

test('a 2.x block keeps its colors under a strict style-src', async ({
	page,
}, testInfo) => {
	await page.addInitScript(() => {
		const found: string[] = [];
		Object.assign(window, { cspViolations: found });
		document.addEventListener('securitypolicyviolation', (event) => {
			const target = event.target as Element | null;
			if (target?.closest?.('.cbp-block')) {
				found.push(`${event.violatedDirective}: ${event.sample}`);
			}
		});
	});

	const response = await page.goto('/two-themes/');
	expect(response?.status()).toBe(200);
	expect(response?.headers()['content-security-policy']).toContain(
		"style-src 'self'",
	);

	const blocks = page.locator('.cbp-block');
	await expect(blocks).toHaveCount(2);
	await expect(page.locator('.cbp-block [style]')).toHaveCount(0);
	await expect(
		page.locator('.wp-block-kevinbatdorf-code-block-pro'),
	).toHaveCount(0);

	// nord: storage.type #81a1c1 on #2e3440; github-light: storage.type.function #d73a49 on #fff.
	expect(await color(page, '.cbp-theme-nord .phiki-storage\\.type\\.js')).toBe(
		'rgb(129, 161, 193)',
	);
	expect(await background(page, 'pre.cbp-theme-nord')).toBe('rgb(46, 52, 64)');
	expect(
		await color(
			page,
			'.cbp-theme-github-light .phiki-storage\\.type\\.function\\.php',
		),
	).toBe('rgb(215, 58, 73)');
	expect(await background(page, 'pre.cbp-theme-github-light')).toBe(
		'rgb(255, 255, 255)',
	);

	for (const theme of ['nord', 'github-light']) {
		await expect(
			page.locator(
				`link[rel="stylesheet"][href*="/build/themes/${theme}.css"]`,
			),
		).toHaveCount(1);
	}
	expect(
		await page.evaluate(
			() => (window as unknown as { cspViolations: string[] }).cspViolations,
		),
	).toEqual([]);

	// Puts the policy in the screenshot, beside the colored blocks.
	await page.evaluate((policy) => {
		const banner = document.createElement('pre');
		banner.textContent = `Content-Security-Policy: ${policy}`;
		Object.assign(banner.style, {
			font: '14px monospace',
			padding: '8px',
			background: '#fffbe6',
			border: '1px solid #e0c060',
		});
		document.querySelector('.cbp-block')?.before(banner);
	}, response?.headers()['content-security-policy'] ?? '');
	const shot = testInfo.outputPath('strict-csp.png');
	await page.locator('main, body').first().screenshot({ path: shot });
	await testInfo.attach('strict-csp', { path: shot, contentType: 'image/png' });
});
