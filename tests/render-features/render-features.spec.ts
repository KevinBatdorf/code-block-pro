import { expect, type Locator, type Page, test } from '@playwright/test';

const watchCsp = (page: Page) =>
	page.addInitScript(() => {
		const found: string[] = [];
		Object.assign(window, { cspViolations: found });
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

const css = (locator: Locator, property: string, pseudo?: string) =>
	locator.evaluate(
		(el, [name, after]) =>
			getComputedStyle(el, after || null).getPropertyValue(name),
		[property, pseudo ?? ''] as const,
	);

const lines = (block: Locator) => block.locator('pre > code > .line');

test.beforeEach(async ({ page }) => {
	await watchCsp(page);
});

test('each line feature paints from classes, under a strict CSP', async ({
	page,
}) => {
	await page.goto('/lines/');
	const blocks = page.locator('.cbp-block');
	await expect(blocks).toHaveCount(4);
	await expect(page.locator('.cbp-block [style]')).toHaveCount(0);
	// No inline script or style of ours, which the policy would refuse.
	expect(
		await page
			.locator('script:not([src]), style')
			.evaluateAll((tags) =>
				tags.filter((tag) => /cbp|codeBlockPro/.test(tag.textContent ?? '')),
			),
	).toHaveLength(0);
	const [numbered, blurred, focused] = [
		blocks.nth(0),
		blocks.nth(1),
		blocks.nth(2),
	];

	// Markers come out of the code and onto their lines.
	await expect(numbered.locator('pre')).not.toContainText('[!code');
	await expect(lines(numbered).nth(1)).toHaveClass('line cbp-add');
	await expect(lines(numbered).nth(2)).toHaveClass('line cbp-del');
	expect(await css(lines(numbered).nth(1), 'content', '::after')).toContain(
		'+',
	);

	// Numbers start where the pane says, and the gutter holds them.
	expect(
		await lines(numbered).evaluateAll((all) =>
			all.map((line) => line.getAttribute('data-line')),
		),
	).toEqual(['10', '11', '12', '13', '14']);
	expect(await css(lines(numbered).first(), 'content', '::before')).not.toBe(
		'none',
	);

	// A highlight spans the whole scroll width, not just its own text.
	const highlight = lines(numbered).first();
	await expect(highlight).toHaveClass('line cbp-hl');
	expect(await css(highlight, 'background-color')).not.toBe('rgba(0, 0, 0, 0)');
	const widths = await lines(numbered).evaluateAll((all) =>
		all.map((line) => (line as HTMLElement).offsetWidth),
	);
	const scroll = await numbered
		.locator('pre')
		.evaluate((pre) => pre.scrollWidth);
	expect(scroll).toBeGreaterThan(
		await numbered.locator('pre').evaluate((pre) => pre.clientWidth),
	);
	expect(new Set(widths)).toEqual(new Set([scroll]));

	// Blur leaves the sharp line alone and lifts on hover.
	expect(await css(lines(blurred).first(), 'filter')).toBe('blur(1.35px)');
	expect(await css(lines(blurred).nth(1), 'filter')).toBe('none');
	await blurred.hover();
	await expect.poll(() => css(lines(blurred).first(), 'filter')).toBe('none');

	// Focus dims every line outside it.
	expect(await css(lines(focused).nth(2), 'opacity')).toBe('0.5');
	expect(await css(lines(focused).first(), 'opacity')).toBe('1');

	expect(await cspViolations(page)).toEqual([]);
});

test('a line anchor scrolls to its line and lights it', async ({ page }) => {
	await page.goto('/lines/#lines-L13');
	const target = page.locator('#lines-L13');
	await expect(target).toBeInViewport();
	expect(await target.evaluate((el) => el.matches(':target'))).toBe(true);
	expect(await css(target, 'background-color')).not.toBe('rgba(0, 0, 0, 0)');
});

test('see more clamps the code after its line and opens it', async ({
	page,
}) => {
	await page.goto('/lines/');
	const block = page.locator('.cbp-block').nth(3);
	const pre = block.locator('pre');
	const button = block.locator('.cbp-more-button');
	const lineHeight = parseFloat(await css(lines(block).first(), 'line-height'));
	const collapsed = Math.round(16 + 5 * lineHeight);

	await expect
		.poll(() => pre.evaluate((el) => Math.round(el.clientHeight)))
		.toBe(collapsed);
	await expect(button).toHaveAttribute('aria-expanded', 'false');
	await expect(lines(block).nth(29)).not.toBeInViewport();

	await button.click();
	await expect(button).toHaveAttribute('aria-expanded', 'true');
	await expect(button).toHaveText('Collapse');
	await expect
		.poll(() => pre.evaluate((el) => el.scrollHeight - el.clientHeight))
		.toBe(0);

	await button.click();
	await expect(button).toHaveAttribute('aria-expanded', 'false');
	await expect
		.poll(() => pre.evaluate((el) => Math.round(el.clientHeight)))
		.toBe(collapsed);
});

test('a link to a line past the fold opens the fold, and the button agrees', async ({
	page,
}) => {
	await page.goto('/lines/#fold-L20');
	const block = page.locator('.cbp-block').nth(3);
	const button = block.locator('.cbp-more-button');

	await expect(page.locator('#fold-L20')).toBeInViewport();
	await expect(button).toHaveAttribute('aria-expanded', 'true');
	await expect(button).toHaveText('Collapse');
	await button.click();
	await expect(button).toHaveAttribute('aria-expanded', 'false');
	await expect(page.locator('#fold-L20')).not.toBeInViewport();
});

test('copy puts the code on the clipboard, without markers or removed lines', async ({
	page,
	context,
}) => {
	await context.grantPermissions(['clipboard-read', 'clipboard-write']);
	await page.goto('/lines/');
	const block = page.locator('.cbp-block').first();
	const button = block.locator('.cbp-copy');

	await button.click();
	await expect(button).toHaveText('Copied!');
	await expect(block.locator('.cbp-status')).toHaveText('Copied!');
	const copied = await page.evaluate(() => navigator.clipboard.readText());

	expect(copied).toBe(
		`const a = 1;\nconst b = 2;\nconst line = '${'x'.repeat(300)}';\nexport { a, b };`,
	);
	await expect(button).toHaveText('Copy');

	// A second click while it still says "Copied!" mustn't keep that as its label.
	await button.click();
	await button.click();
	await expect(button).toHaveText('Copy', { timeout: 5000 });
});

test('copy takes the pane on show', async ({ page, context }) => {
	await context.grantPermissions(['clipboard-read', 'clipboard-write']);
	await page.goto('/panes/');
	const block = page.locator('.cbp-block').first();

	await block.getByRole('tab').nth(1).click();
	await block.locator('.cbp-copy').click();

	expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
		'<?php\nfunction greet(string $name): string\n{\n    return "Hello, {$name}";\n}',
	);
});

test('tabs switch which pane shows and change nothing else', async ({
	page,
}) => {
	await page.goto('/panes/');
	const block = page.locator('.cbp-block').first();
	const [first, second] = [
		block.locator('.cbp-pane').nth(0),
		block.locator('.cbp-pane').nth(1),
	];
	const tabs = block.getByRole('tab');
	const before = await block
		.locator('pre')
		.evaluateAll((all) => all.map((pre) => pre.outerHTML));
	await expect(first).toBeVisible();
	await expect(second).toBeHidden();
	await expect(block.locator('.cbp-header')).toHaveClass(
		/cbp-theme-github-light/,
	);

	await tabs.nth(1).click();
	await expect(second).toBeVisible();
	await expect(first).toBeHidden();
	await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
	await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'false');
	// The PHP pane's theme comes from the profile's language override.
	await expect(block.locator('.cbp-header')).toHaveClass(/cbp-theme-nord/);
	await expect(block.locator('.cbp-header')).not.toHaveClass(
		/cbp-theme-github-light/,
	);

	await page.keyboard.press('ArrowLeft');
	await expect(tabs.nth(0)).toBeFocused();
	await expect(first).toBeVisible();
	expect(
		await block
			.locator('pre')
			.evaluateAll((all) => all.map((pre) => pre.outerHTML)),
	).toEqual(before);
	expect(await cspViolations(page)).toEqual([]);
});

test('a custom button sends its id and the code to the page', async ({
	page,
}) => {
	await page.goto('/panes/');
	await page.evaluate(() => {
		document.addEventListener('code-block-pro:button', (event) => {
			const { id, code } = (event as CustomEvent).detail;
			Object.assign(window, { pressed: { id, code } });
		});
	});

	await page
		.locator('.cbp-block')
		.first()
		.getByRole('button', { name: 'Run' })
		.click();

	expect(
		await page.evaluate(
			() => (window as unknown as { pressed: unknown }).pressed,
		),
	).toEqual({
		id: 'run',
		code: "const greet = (name) => {\n  return `Hello, ${name}`;\n};\n\ngreet('you');",
	});
});

test('the switch recolors every block on the page without a reload', async ({
	page,
}) => {
	await page.goto('/panes/');
	const blocks = page.locator('.cbp-profile-features');
	const toggle = blocks.first().locator('.cbp-toggle');
	const token = blocks.nth(1).locator('pre code .line span').first();
	const light = await css(token, 'color');

	await expect(toggle).toHaveText('Theme Auto');
	await toggle.click();
	await expect(toggle).toHaveText('Theme Light');
	await toggle.click();
	await expect(toggle).toHaveText('Theme Dark');
	for (const i of [0, 1]) {
		await expect(blocks.nth(i)).toHaveAttribute('data-cbp-condition', 'dark');
	}
	await expect.poll(() => css(token, 'color')).not.toBe(light);
	await expect(blocks.nth(1).locator('.cbp-toggle')).toHaveText('Theme Dark');

	// The choice outlives a reload.
	await page.reload();
	await expect(blocks.nth(1)).toHaveAttribute('data-cbp-condition', 'dark');

	await blocks.first().locator('.cbp-toggle').click();
	await expect(blocks.first()).not.toHaveAttribute('data-cbp-condition');
	await expect(blocks.first().locator('.cbp-toggle')).toHaveText('Theme Auto');
});

test('a switch for one block changes only that block and forgets on reload', async ({
	page,
}) => {
	await page.goto('/switch-block/');
	const blocks = page.locator('.cbp-profile-switch-block');
	const toggle = blocks.first().locator('.cbp-toggle');

	await toggle.click();
	await toggle.click();
	await expect(toggle).toHaveText('Theme Dark');
	await expect(blocks.first()).toHaveAttribute('data-cbp-condition', 'dark');
	await expect(blocks.nth(1)).not.toHaveAttribute('data-cbp-condition');
	await expect(blocks.nth(1).locator('.cbp-toggle')).toHaveText('Theme Auto');

	await page.reload();
	await expect(blocks.first().locator('.cbp-toggle')).toHaveText('Theme Auto');
	await expect(blocks.first()).not.toHaveAttribute('data-cbp-condition');
});

test('a switch for the whole site follows the reader to other pages', async ({
	page,
}) => {
	await page.goto('/switch-site/');
	const toggle = page.locator('.cbp-toggle');
	await toggle.click();
	await toggle.click();
	await expect(toggle).toHaveText('Theme Dark');

	// That page's block has no switch of its own.
	await page.goto('/switch-elsewhere/');
	const block = page.locator('.cbp-profile-no-switch');
	await expect(block.locator('.cbp-toggle')).toHaveCount(0);
	await expect(block).toHaveAttribute('data-cbp-condition', 'dark');
});

test('two panes with a highlight, a blur and the buttons row', async ({
	page,
}, testInfo) => {
	await page.setViewportSize({ width: 900, height: 700 });
	await page.goto('/panes/');
	const block = page.locator('.cbp-block').first();
	await block.locator('.cbp-copy').hover();
	const shot = testInfo.outputPath('two-panes.png');
	await block.screenshot({ path: shot });
	await testInfo.attach('two-panes', { path: shot, contentType: 'image/png' });
});

test.describe('without script', () => {
	test.use({ javaScriptEnabled: false });

	test('every pane shows under its label, and nothing needs a click', async ({
		page,
	}) => {
		await page.goto('/panes/');
		const block = page.locator('.cbp-block').first();

		await expect(block.locator('.cbp-pane')).toHaveCount(2);
		await expect(block.locator('.cbp-pane').nth(1)).toBeVisible();
		await expect(block.locator('.cbp-pane-label').nth(1)).toHaveText('PHP');
		await expect(block.getByRole('tablist')).toBeHidden();
		await expect(block.locator('.cbp-buttons')).toBeHidden();
	});
});
