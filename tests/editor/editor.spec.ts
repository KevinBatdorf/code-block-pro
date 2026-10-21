import type { Locator } from '@playwright/test';
import {
	type Admin,
	type Editor,
	expect,
	test,
} from '@wordpress/e2e-test-utils-playwright';
import { publishPosts, readIndex, readMarkup } from '../fixtures/publish';
import { newPost } from '../helpers';

const tokens = (code: Locator) =>
	code.evaluate((el) =>
		Array.from(el.querySelectorAll('.line'), (line) => ({
			tag: line.tagName,
			classes: line.className,
			number: line.getAttribute('data-line'),
			spans: Array.from(line.querySelectorAll('span'), (span) => [
				span.className,
				span.textContent,
			]),
		})),
	);

test.beforeEach(async ({ requestUtils }) => {
	await requestUtils.login();
});

test('typed code stays lined up and the server colors it as the front end does', async ({
	admin,
	editor,
	page,
}) => {
	await newPost(admin, 'editor');
	await editor.insertBlock({ name: 'kevinbatdorf/code-block-pro' });
	const block = editor.canvas.locator(
		'[data-type="kevinbatdorf/code-block-pro"]',
	);
	const input = block.locator('textarea.cbp-input');
	const code = block.locator('pre > code');

	// A new block takes typing with no click first.
	await expect(input).toBeFocused();
	await page.keyboard.type('x');
	await expect(input).toHaveValue('x');
	await page.keyboard.press('Backspace');

	await page.getByRole('combobox', { name: 'Language' }).fill('JavaScript');
	await page.getByRole('option', { name: 'JavaScript', exact: true }).click();
	await input.click();
	const typed = 'const a = 1;\n\nfunction add(b) {\n  return a + b;\n}';
	for (const key of typed) {
		await input.press(key === '\n' ? 'Enter' : key);
		expect(await code.textContent()).toBe(await input.inputValue());
	}
	await input.press('ArrowUp');
	await input.press('Home');
	await input.press('Backspace');
	expect(await code.textContent()).toBe(await input.inputValue());

	await expect(code.locator('.cbp-pending')).toHaveCount(0);
	await expect(
		code.locator('.phiki-storage\\.type\\.js').first(),
	).toBeVisible();
	const lineHeight = await code.evaluate((el) =>
		Number.parseFloat(getComputedStyle(el).lineHeight),
	);
	const tops = await code.evaluate((el) =>
		Array.from(el.children, (line) => line.getBoundingClientRect().top),
	);
	tops.forEach((top, i) =>
		expect(top - tops[0]).toBeCloseTo(i * lineHeight, 0),
	);

	// The pre's padding takes clicks too.
	const box = await block.locator('pre').boundingBox();
	if (!box) throw new Error('No pre');
	await page.getByRole('combobox', { name: 'Language' }).click();
	await page.mouse.click(box.x + 40, box.y + 4);
	await page.keyboard.type('// ');
	await expect(input).toHaveValue(/\/\/ /);
	await page.keyboard.press('Backspace');
	await page.keyboard.press('Backspace');
	await page.keyboard.press('Backspace');
	await expect(block.locator('[aria-busy]')).toHaveAttribute(
		'aria-busy',
		'false',
	);

	const inEditor = await tokens(code);
	await editor.saveDraft();
	const postId = new URL(page.url()).searchParams.get('post');
	await page.goto(`/?p=${postId}&preview=true`);
	expect(await tokens(page.locator('.cbp-block pre > code'))).toEqual(inEditor);
});

test('a new render swaps only the lines that changed and adds no stylesheet twice', async ({
	admin,
	editor,
	page,
}) => {
	await newPost(admin, 'swaps');
	await editor.insertBlock({ name: 'kevinbatdorf/code-block-pro' });
	const block = editor.canvas.locator(
		'[data-type="kevinbatdorf/code-block-pro"]',
	);
	const input = block.locator('textarea.cbp-input');
	const code = block.locator('pre > code');
	const settled = async () => {
		await expect(block.locator('[aria-busy]')).toHaveAttribute(
			'aria-busy',
			'false',
		);
		await expect(code.locator('.cbp-pending')).toHaveCount(0);
	};
	await page.getByRole('combobox', { name: 'Language' }).fill('JavaScript');
	await page.getByRole('option', { name: 'JavaScript', exact: true }).click();
	await input.fill('const a = 1;\nconst b = 2;\nconst c = 3;');
	await settled();
	await code.evaluate((el) => {
		for (const line of el.children) Object.assign(line, { kept: true });
	});

	await input.fill('const a = 1;\nconst b = 24;\nconst c = 3;');
	await settled();

	expect(await code.textContent()).toBe(await input.inputValue());
	expect(
		await code.evaluate((el) =>
			Array.from(el.children, (line) => 'kept' in line),
		),
	).toEqual([true, false, true]);
	const links = await block.evaluate((el) =>
		Array.from(
			el.ownerDocument.querySelectorAll('link[id^="code-block-pro"]'),
			(link) => link.id,
		),
	);
	expect(links.length).toBeGreaterThan(0);
	expect(new Set(links).size).toBe(links.length);
});

test('the sidebar sums up the profile, and one block can override its line numbers', async ({
	admin,
	editor,
	page,
}) => {
	await newPost(admin, 'overrides');
	await editor.insertBlock({ name: 'kevinbatdorf/code-block-pro' });
	const block = editor.canvas.locator(
		'[data-type="kevinbatdorf/code-block-pro"]',
	);
	await page.keyboard.type('a');
	await page.keyboard.press('Enter');
	await page.keyboard.type('b');
	await page.getByRole('tab', { name: 'Settings' }).click();

	await expect(page.locator('.cbp-profile-summary__title')).toHaveText(
		'Default',
	);
	await expect(
		page.locator('.cbp-profile-summary__features li').first(),
	).toHaveText('Dracula');
	const numbers = page.getByRole('checkbox', { name: 'Line numbers' });
	await expect(numbers).not.toBeChecked();
	await expect(page.getByText('Off, as the profile sets.')).toBeVisible();

	await numbers.check();
	await expect(block.locator('.cbp-block')).toHaveClass(/\bcbp-numbers\b/);
	await expect(page.getByText('Set for this block only.')).toBeVisible();

	await numbers.uncheck();
	await expect(block.locator('.cbp-block')).not.toHaveClass(/\bcbp-numbers\b/);
	expect(
		await page.evaluate(
			() =>
				(
					window as unknown as {
						wp: {
							data: {
								select: (store: string) => {
									getBlocks: () => { attributes: Record<string, unknown> }[];
								};
							};
						};
					}
				).wp.data
					.select('core/block-editor')
					.getBlocks()[0].attributes.overrides,
		),
	).toBeUndefined();
});

test('the inserter offers the block', async ({ admin, page }) => {
	await newPost(admin, 'inserter');
	await page.getByRole('button', { name: 'Block Inserter' }).click();
	await page.getByRole('searchbox', { name: /Search/ }).fill('Code');
	await expect(
		page.getByRole('option', { name: 'Code', exact: true }),
	).toBeVisible();
	await expect(page.getByRole('option', { name: 'Code Pro' })).toBeVisible();
});

test('a 1.x block keeps its menus, and its align and anchor reach the page', async ({
	admin,
	editor,
	page,
}) => {
	// Publishing, opening, saving and loading the page take most of the default 30 s.
	test.setTimeout(60_000);
	await admin.visitAdminPage('edit.php');
	const bare = readIndex().find((entry) => entry.slug === '01-bare');
	if (!bare) throw new Error('No 01-bare fixture');
	const [id] = await publishPosts(page, [
		{ title: '1.x align', content: readMarkup(bare) },
	]);
	await admin.visitAdminPage('post.php', `post=${id}&action=edit`);
	await editor.canvas
		.locator('[data-type="kevinbatdorf/code-block-pro"]')
		.click();

	const toolbar = page.getByRole('toolbar', { name: 'Block tools' });
	await toolbar.getByRole('button', { name: 'Options' }).click();
	await expect(page.getByRole('menuitem', { name: 'Copy' })).toBeVisible();
	await page.keyboard.press('Escape');

	await toolbar.getByRole('button', { name: 'Align' }).click();
	await page.getByRole('menuitemradio', { name: /Wide width/ }).click();
	await editor.openDocumentSettingsSidebar();
	await page.getByRole('button', { name: 'Advanced' }).click();
	await page.getByRole('textbox', { name: 'HTML anchor' }).fill('setup');
	// The post is published, so the top bar offers Save, not Save draft.
	await page
		.getByRole('region', { name: 'Editor top bar' })
		.getByRole('button', { name: 'Save', exact: true })
		.click();
	await expect(
		page.getByRole('button', { name: 'Dismiss this notice' }).filter({
			hasText: 'Post updated.',
		}),
	).toBeVisible();

	await page.goto(`/?p=${id}`);
	const wrapper = page.locator('.wp-block-kevinbatdorf-code-block-pro');
	await expect(wrapper).toHaveClass(/\balignwide\b/);
	await expect(wrapper).toHaveAttribute('id', 'setup');
});

test('Tab indents inside the code until Escape, then leaves it', async ({
	admin,
	editor,
	page,
}) => {
	await newPost(admin, 'tabs');
	await editor.insertBlock({ name: 'kevinbatdorf/code-block-pro' });
	const input = editor.canvas.locator(
		'[data-type="kevinbatdorf/code-block-pro"] textarea.cbp-input',
	);

	await expect(input).toBeFocused();
	await page.keyboard.type('x');
	await page.keyboard.press('Enter');
	await page.keyboard.type('y');
	await page.keyboard.press('ArrowLeft');
	await page.keyboard.press('Tab');
	await expect(input).toHaveValue('x\n  y');
	await expect(input).toBeFocused();

	await page.keyboard.press('ControlOrMeta+a');
	await page.keyboard.press('Tab');
	await expect(input).toHaveValue('  x\n    y');
	await page.keyboard.press('Shift+Tab');
	await page.keyboard.press('Shift+Tab');
	await expect(input).toHaveValue('x\ny');
	await expect(input).toBeFocused();

	await page.keyboard.press('Escape');
	await page.keyboard.press('Tab');
	await expect(input).not.toBeFocused();
	await expect(input).toHaveValue('x\ny');
});

test('tabs are added, labeled, reordered and removed', async ({
	admin,
	editor,
	page,
}) => {
	await newPost(admin, 'panes');
	await editor.insertBlock({ name: 'kevinbatdorf/code-block-pro' });
	const block = editor.canvas.locator(
		'[data-type="kevinbatdorf/code-block-pro"]',
	);
	const input = block.locator('textarea.cbp-input');
	const tabs = block.locator('.cbp-tab');
	const language = page.getByRole('combobox', { name: 'Language' });

	await page.keyboard.type('const a = 1;');
	await language.fill('JavaScript');
	await page.getByRole('option', { name: 'JavaScript', exact: true }).click();
	await expect(tabs).toHaveCount(0);

	await page.getByRole('button', { name: 'Add tab' }).click();
	await expect(tabs).toHaveText(['JavaScript', 'JavaScript']);
	await language.fill('PHP');
	await page.getByRole('option', { name: 'PHP', exact: true }).click();
	await page.getByRole('textbox', { name: 'Tab label' }).fill('Server');
	await expect(tabs).toHaveText(['JavaScript', 'Server']);
	await input.click();
	await page.keyboard.type('echo 1;');
	await expect(input).toHaveValue('echo 1;');

	await page.getByRole('button', { name: 'Move tab 2 (Server) up' }).click();
	await expect(tabs).toHaveText(['Server', 'JavaScript']);
	await expect(input).toHaveValue('echo 1;');
	// Focus follows the tab that moved, so pressing again can't put it back.
	await expect(
		page.getByRole('button', { name: 'Server', exact: true }),
	).toBeFocused();

	// Two blocks share the canvas, so their tab ids come from the block, not the request.
	await expect(tabs.first()).toHaveAttribute('id', /^cbp-e\d+-tab-0$/);
	await tabs.first().click();
	await expect(tabs.first()).toBeFocused();
	await page.keyboard.press('ArrowRight');
	await expect(tabs.nth(1)).toBeFocused();
	await expect(tabs.nth(1)).toHaveAttribute('tabindex', '0');
	await expect(tabs.first()).toHaveAttribute('tabindex', '-1');
	await expect(input).toHaveValue('const a = 1;');

	// The new tab's pane exists only once the server answers; the textarea must not wait.
	await page.route(PREVIEW, (route) => route.abort());
	await page.getByRole('button', { name: 'Add tab' }).click();
	await expect(input).toHaveCount(1);
	await expect(input).toHaveValue('');
	await input.click();
	await page.keyboard.type('x');
	await expect(input).toHaveValue('x');
	await page.keyboard.press('Backspace');
	await page.unroute(PREVIEW);
	await page.getByRole('textbox', { name: 'Tab label' }).fill('Extra');
	await expect(tabs).toHaveText(['Server', 'JavaScript', 'Extra']);
	await page.getByRole('button', { name: 'Remove tab 3 (Extra)' }).click();
	await expect(tabs).toHaveText(['Server', 'JavaScript']);
	await expect(input).toHaveValue('const a = 1;');
	await expect(
		page.getByRole('button', { name: 'JavaScript', exact: true }),
	).toBeFocused();

	await editor.saveDraft();
	const postId = new URL(page.url()).searchParams.get('post');
	await page.goto(`/?p=${postId}&preview=true`);
	await expect(page.locator('.cbp-block .cbp-tab')).toHaveText([
		'Server',
		'JavaScript',
	]);
	await expect(page.locator('.cbp-block .cbp-pane code')).toHaveText([
		'echo 1;',
		'const a = 1;',
	]);
});

test('the sidebar sets line options the editor and the front end both show', async ({
	admin,
	editor,
	page,
}) => {
	await newPost(admin, 'sidebar');
	await editor.insertBlock({ name: 'kevinbatdorf/code-block-pro' });
	const block = editor.canvas.locator(
		'[data-type="kevinbatdorf/code-block-pro"]',
	);
	await page.keyboard.type('a');
	await page.keyboard.press('Enter');
	await page.keyboard.type('b');
	await page.keyboard.press('Enter');
	await page.keyboard.type('c');

	await page.getByRole('tab', { name: 'Settings' }).click();
	await page.getByRole('button', { name: 'Lines' }).click();
	await page.getByRole('spinbutton', { name: 'First line number' }).fill('10');
	await page.getByRole('textbox', { name: 'Highlight lines' }).fill('11');
	await page.getByRole('checkbox', { name: 'Link to each line' }).check();
	const highlighted = block.locator('pre > code > .line.cbp-hl');
	await expect(highlighted).toHaveText('b');
	// The editor's ids start with the block's own, so two blocks never share #L10.
	await expect(block.locator('pre > code > .line').first()).toHaveAttribute(
		'id',
		/^cbp-e\d+-L10$/,
	);

	await editor.saveDraft();
	const postId = new URL(page.url()).searchParams.get('post');
	await page.goto(`/?p=${postId}&preview=true`);
	await expect(page.locator('.cbp-block .line.cbp-hl')).toHaveText('b');
	await expect(page.locator('#L12')).toHaveText('c');
});

// Plain permalinks put the route in the query string.
const PREVIEW = (url: URL) =>
	decodeURIComponent(url.href).includes('/code-block-pro/v1/preview');

const insertBlock = async ({
	admin,
	editor,
}: {
	admin: Admin;
	editor: Editor;
}) => {
	await newPost(admin, 'requests');
	await editor.insertBlock({ name: 'kevinbatdorf/code-block-pro' });
	const input = editor.canvas.locator(
		'[data-type="kevinbatdorf/code-block-pro"] textarea.cbp-input',
	);
	await expect(input).toBeFocused();
	return input;
};

test.describe('preview requests', () => {
	test('a slow render shows a spinner in the block toolbar', async ({
		admin,
		editor,
		page,
	}) => {
		const input = await insertBlock({ admin, editor });
		await page.route(PREVIEW, async (route) => {
			await new Promise((resolve) => setTimeout(resolve, 1500));
			await route.continue();
		});
		await page.keyboard.insertText('const pasted = true;\n'.repeat(20));
		await expect(input).toHaveValue(/pasted/);
		const toolbar = page.getByRole('toolbar', { name: 'Block tools' });
		await expect(toolbar.locator('.cbp-status-spinner')).toBeVisible();
		await page.unroute(PREVIEW);
		await expect(toolbar.locator('.cbp-status-spinner')).toBeHidden({
			timeout: 10000,
		});
	});

	test('a slow server gets one request at a time, only the newest edit', async ({
		admin,
		editor,
		page,
	}) => {
		const input = await insertBlock({ admin, editor });
		const sent: string[] = [];
		await page.route(PREVIEW, async (route) => {
			sent.push(
				route.request().postDataJSON().attributes.panes?.[0]?.code ?? '',
			);
			await new Promise((resolve) => setTimeout(resolve, 800));
			await route.continue();
		});
		await input.pressSequentially('abcdefghijklmnopqrst', { delay: 30 });
		await expect
			.poll(() => sent.at(-1), { timeout: 10000 })
			.toBe('abcdefghijklmnopqrst');
		// Typing took ~600 ms against 800 ms replies: the first key, then the last.
		expect(sent.length).toBeLessThanOrEqual(3);
	});

	test('a fast server is asked at most every 150 ms while typing', async ({
		admin,
		editor,
		page,
	}) => {
		const input = await insertBlock({ admin, editor });
		const times: number[] = [];
		await page.route(PREVIEW, async (route) => {
			times.push(Date.now());
			await route.continue();
		});
		await input.pressSequentially('abcdefghijklmnopqrst', { delay: 20 });
		await expect(
			editor.canvas.locator(
				'[data-type="kevinbatdorf/code-block-pro"] [aria-busy="false"]',
			),
		).toBeVisible({ timeout: 10000 });
		const gaps = times.slice(1).map((time, i) => time - times[i]);
		expect(Math.min(...gaps)).toBeGreaterThanOrEqual(140);
	});

	test('only a render of the code as it opened may fill the page cache', async ({
		admin,
		editor,
		page,
	}) => {
		const saved: boolean[] = [];
		await page.route(PREVIEW, async (route) => {
			saved.push(route.request().postDataJSON().saved);
			await route.continue();
		});
		const input = await insertBlock({ admin, editor });
		await expect.poll(() => saved.length).toBeGreaterThan(0);
		await input.pressSequentially('abc', { delay: 200 });
		await expect.poll(() => saved.length).toBeGreaterThan(1);
		expect(saved[0]).toBe(true);
		expect(saved.slice(1)).not.toContain(true);
	});

	test('a block that remounts shows its last render at once', async ({
		admin,
		editor,
		page,
	}) => {
		const input = await insertBlock({ admin, editor });
		await page.getByRole('combobox', { name: 'Language' }).fill('JavaScript');
		await page.getByRole('option', { name: 'JavaScript', exact: true }).click();
		await input.fill('const a = 1;');
		const block = editor.canvas.locator(
			'[data-type="kevinbatdorf/code-block-pro"]',
		);
		await expect(block.locator('[aria-busy="false"]')).toBeVisible({
			timeout: 10000,
		});
		await expect(block.locator('pre > code .token').first()).toBeVisible();

		await page.route(PREVIEW, async (route) => {
			await new Promise((resolve) => setTimeout(resolve, 5000));
			await route.continue();
		});
		// Switching to the code editor would persist that mode for every later test.
		await page.evaluate(() => {
			const { select, dispatch } = (
				window as unknown as {
					wp: {
						data: {
							select: (store: string) => { getBlockOrder: () => string[] };
							dispatch: (store: string) => {
								removeBlock: (id: string) => void;
							};
						};
					};
				}
			).wp.data;
			dispatch('core/block-editor').removeBlock(
				select('core/block-editor').getBlockOrder()[0],
			);
		});
		await expect(block).toHaveCount(0);
		await page.evaluate(() => {
			const { dispatch } = (
				window as unknown as {
					wp: { data: { dispatch: (store: string) => { undo: () => void } } };
				}
			).wp.data;
			dispatch('core/editor').undo();
		});
		// Well before the held request answers.
		await expect(block.locator('pre > code .token').first()).toBeVisible({
			timeout: 2000,
		});
		await page.unroute(PREVIEW);
	});

	test('a failed request shows a warning that can try again', async ({
		admin,
		editor,
		page,
	}) => {
		const input = await insertBlock({ admin, editor });
		await page.route(PREVIEW, (route) =>
			route.fulfill({
				status: 500,
				contentType: 'application/json',
				body: JSON.stringify({ code: 'boom', message: 'The server broke.' }),
			}),
		);
		await input.pressSequentially('x');
		// Typing hides the block toolbar until the mouse moves.
		await page.mouse.move(10, 10);
		await page.mouse.move(200, 200);
		const warning = page.getByRole('button', {
			name: 'Problems with this code',
		});
		await warning.click();
		await expect(
			page.getByText('The preview could not update: The server broke.'),
		).toBeVisible();
		await page.unroute(PREVIEW);
		await page.getByRole('button', { name: 'Try again' }).click();
		await expect(warning).toBeHidden();
	});

	test('a problem the server reports shows in the toolbar', async ({
		admin,
		editor,
		page,
	}) => {
		const input = await insertBlock({ admin, editor });
		await page.evaluate(() => {
			const { select, dispatch } = (
				window as unknown as {
					wp: {
						data: {
							select: (store: string) => {
								getSelectedBlockClientId: () => string;
							};
							dispatch: (store: string) => {
								updateBlockAttributes: (id: string, attributes: object) => void;
							};
						};
					};
				}
			).wp.data;
			const id = select('core/block-editor').getSelectedBlockClientId();
			dispatch('core/block-editor').updateBlockAttributes(id, {
				panes: [{ language: 'not-a-language', code: 'x' }],
			});
		});
		await input.click();
		await page.mouse.move(10, 10);
		await page.mouse.move(200, 200);
		await page.getByRole('button', { name: 'Problems with this code' }).click();
		await expect(page.getByText('not-a-language')).toBeVisible();
	});
});
