import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import type { Page } from '@playwright/test';
import { expect, test } from '@wordpress/e2e-test-utils-playwright';
import {
	type BlockDigest,
	expectSameBlocks,
	readDigest,
} from '../fixtures/digest';
import {
	publishFixtures,
	publishPosts,
	readIndex,
	readMarkup,
} from '../fixtures/publish';
import { shootBlock } from '../fixtures/shoot';
import { newPost } from '../helpers';

const index = readIndex();
const BASELINE = join(__dirname, '..', 'fixtures', 'baseline.json');
const baseline: Record<string, BlockDigest[]> = JSON.parse(
	readFileSync(BASELINE, 'utf8'),
);

/** Capture from a 1.x build only, or a newer renderer's regressions become the baseline. */
const CAPTURE = !!process.env.CAPTURE_BASELINE;
if (CAPTURE && existsSync(join(__dirname, '..', '..', 'src', 'legacy'))) {
	throw new Error(
		'This tree is not 1.x. Capture from the 1.28.0 zip: see tests/fixtures/README.md.',
	);
}

const ENVIRONMENT = join(
	__dirname,
	'legacy-blocks.spec.ts-snapshots',
	'environment.json',
);

const paragraph = (text: string) =>
	`<!-- wp:paragraph -->\n<p>${text}</p>\n<!-- /wp:paragraph -->`;

const visit = async (page: Page, id: number) => {
	const response = await page.goto(`/?p=${id}`, { timeout: 60_000 });
	expect(response?.status(), `post ${id}: the front end answered`).toBe(200);
	return readDigest(page);
};

test.beforeEach(async ({ requestUtils }) => {
	await requestUtils.login();
});

test('every stored block still validates in the editor', async ({
	admin,
	editor,
	page,
}) => {
	test.setTimeout(15 * 60 * 1000);
	await newPost(admin, 'validation');

	for (const entry of index) {
		await editor.setContent(readMarkup(entry));
		const blocks = await page.evaluate(() =>
			window.wp.data
				.select('core/block-editor')
				.getBlocks()
				.map((block: { isValid: boolean; name: string }) => ({
					name: block.name,
					isValid: block.isValid,
				})),
		);
		expect.soft(blocks, `${entry.slug}: no blocks parsed`).not.toHaveLength(0);
		for (const block of blocks) {
			// An unregistered block parses as core/missing, which always counts as valid.
			expect
				.soft(block.name, `${entry.slug}: the block never registered`)
				.toBe('kevinbatdorf/code-block-pro');
			expect
				.soft(block.isValid, `${entry.slug}: ${block.name} is invalid`)
				.toBe(true);
		}
		expect
			.soft(
				await editor.canvas.locator('.block-editor-warning').count(),
				`${entry.slug}: the editor shows a block warning`,
			)
			.toBe(0);
	}
});

test('saving a post writes every stored block back byte for byte', async ({
	admin,
	editor,
	page,
}) => {
	test.setTimeout(5 * 60 * 1000);
	await newPost(admin, 'save harness');
	const stored = index.map((entry) => readMarkup(entry).trimEnd());
	const [id] = await publishPosts(page, [
		{
			title: 'save harness',
			content: [...stored, paragraph('Untouched')].join('\n\n'),
		},
	]);

	await admin.visitAdminPage('post.php', `post=${id}&action=edit`);
	await editor.canvas.getByText('Untouched', { exact: true }).click();
	await page.keyboard.press('End');
	await page.keyboard.type(' and edited');
	await page.evaluate(() => window.wp.data.dispatch('core/editor').savePost());

	const saved: string = await page.evaluate(
		async (id) =>
			(
				await window.wp.apiFetch({
					path: `/wp/v2/posts/${id}?context=edit`,
				})
			).content.raw,
		id,
	);
	for (const [i, entry] of index.entries()) {
		expect
			.soft(saved.includes(stored[i]), `${entry.slug}: changed on save`)
			.toBe(true);
	}
	expect(saved).toBe(
		[...stored, paragraph('Untouched and edited')].join('\n\n'),
	);
});

test('a new block saves no markup', async ({ admin, editor, page }) => {
	await newPost(admin, 'new block');
	await editor.insertBlock({ name: 'kevinbatdorf/code-block-pro' });
	await editor.canvas
		.getByRole('textbox', { name: 'Code' })
		.fill('<b>bold</b> & [gallery]');
	await editor.saveDraft();

	const saved: string = await page.evaluate(
		async () =>
			(
				await window.wp.apiFetch({
					path: `/wp/v2/posts/${window.wp.data.select('core/editor').getCurrentPostId()}?context=edit`,
				})
			).content.raw,
	);
	expect(saved).toMatch(/^<!-- wp:kevinbatdorf\/code-block-pro \{.*\} \/-->$/);
	const [block] = await page.evaluate(
		(content) => window.wp.blocks.parse(content),
		saved,
	);
	// The editor stores code escaped.
	expect(block.attributes).toMatchObject({
		version: 2,
		panes: [{ code: '&lt;b&gt;bold&lt;/b&gt; &amp; [gallery]' }],
	});
});

test('every stored block renders the same on the front end', async ({
	admin,
	page,
}) => {
	test.setTimeout(15 * 60 * 1000);
	await newPost(admin, 'render harness');
	const ids = await publishFixtures(page, index);
	const captured: Record<string, BlockDigest[]> = {};

	for (const [i, entry] of index.entries()) {
		const actual = await visit(page, ids[i]);
		if (CAPTURE) {
			if (!actual.length) throw new Error(`${entry.slug} never rendered.`);
			captured[entry.slug] = actual;
			continue;
		}

		const expected = baseline[entry.slug];
		expect
			.soft(expected, `${entry.slug}: no baseline, capture one from 1.x`)
			.toBeDefined();
		if (expected) expectSameBlocks(actual, expected, entry.slug);
	}
	if (!CAPTURE) {
		expect
			.soft(
				Object.keys(baseline).toSorted(),
				'baseline and index list different fixtures',
			)
			.toEqual(index.map(({ slug }) => slug).toSorted());
	}

	if (CAPTURE)
		writeFileSync(BASELINE, `${JSON.stringify(captured, null, '\t')}\n`);
});

test('every stored block looks the same on the front end', async ({
	admin,
	browser,
	page,
}) => {
	test.skip(
		!process.env.PW_IMAGE,
		'Pixels only match inside the pinned Playwright image: npm run test:e2e:screens.',
	);
	test.setTimeout(20 * 60 * 1000);
	await page.goto('/');
	// Rasterising moves with the image's fonts, its CPU, Chromium and core's CSS.
	const environment = {
		image: process.env.PW_IMAGE,
		arch: process.arch,
		chromium: browser.version(),
		playwright: test.info().config.version,
		wordpress: await page
			.locator('meta[name="generator"]')
			.getAttribute('content'),
	};
	if (CAPTURE) {
		mkdirSync(dirname(ENVIRONMENT), { recursive: true });
		writeFileSync(ENVIRONMENT, `${JSON.stringify(environment, null, '\t')}\n`);
	} else {
		expect
			.soft(
				environment,
				'the snapshots come from another image, Chromium or WordPress; recapture them from 1.x before reading pixel diffs',
			)
			.toEqual(
				existsSync(ENVIRONMENT)
					? JSON.parse(readFileSync(ENVIRONMENT, 'utf8'))
					: null,
			);
	}
	await newPost(admin, 'screenshot harness');
	const ids = await publishFixtures(page, index);

	for (const [i, entry] of index.entries()) {
		expect(
			await visit(page, ids[i]),
			`${entry.slug} never rendered`,
		).not.toHaveLength(0);
		// A font that fails to load draws the fallback and fails nothing else.
		expect
			.soft(
				await page.evaluate(() =>
					[...document.fonts]
						.filter((font) => font.status !== 'loaded')
						.map((font) => `${font.family} ${font.status}`),
				),
				`${entry.slug}: a web font never loaded`,
			)
			.toEqual([]);
		const blocks = page.locator('.wp-block-kevinbatdorf-code-block-pro');
		const count = await blocks.count();
		for (let b = 0; b < count; b++) {
			const name = count > 1 ? `${entry.slug}-${b}` : entry.slug;
			await shootBlock(page, blocks.nth(b), [name]);
		}
	}
});
