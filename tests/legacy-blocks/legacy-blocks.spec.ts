import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { release } from 'node:os';
import { dirname, join } from 'node:path';
import type { Page } from '@playwright/test';
import { expect, test } from '@wordpress/e2e-test-utils-playwright';
import {
	type BlockDigest,
	expectSameBlocks,
	readDigest,
} from '../fixtures/digest';
import { publishFixtures, readIndex, readMarkup } from '../fixtures/publish';
import { shootBlock } from '../fixtures/shoot';
import { newPost } from '../helpers';

const index = readIndex();
const BASELINE = join(__dirname, '..', 'fixtures', 'baseline.json');
const baseline: Record<string, BlockDigest[]> = JSON.parse(
	readFileSync(BASELINE, 'utf8'),
);

/** Capture from a 1.x build only, or a newer renderer's regressions become the baseline. */
const CAPTURE = !!process.env.CAPTURE_BASELINE;

const ENVIRONMENT = join(
	__dirname,
	'legacy-blocks.spec.ts-snapshots',
	'environment.json',
);

/** A playground 500 reads the same as a block the renderer dropped. */
const visit = async (page: Page, id: number) => {
	for (let attempt = 0; attempt < 5; attempt++) {
		try {
			await page.goto(`/?p=${id}`, { timeout: 60_000 });
			const digest = await readDigest(page);
			if (digest.length > 0) return digest;
		} catch {}
	}
	return [];
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
		// Asserts what 1.x does, so accepting these blocks takes a deliberate change.
		const valid = !entry.opensInvalid;
		for (const block of blocks) {
			// An unregistered block parses as core/missing, which always counts as valid.
			expect
				.soft(block.name, `${entry.slug}: the block never registered`)
				.toBe('kevinbatdorf/code-block-pro');
			expect
				.soft(
					block.isValid,
					`${entry.slug}: ${block.name} ${valid ? 'is invalid' : 'now validates, where 1.x flagged it'}`,
				)
				.toBe(valid);
		}
		expect
			.soft(
				await editor.canvas.locator('.block-editor-warning').count(),
				`${entry.slug}: the editor's block warnings changed`,
			)
			.toBe(valid ? 0 : blocks.length);
	}
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
				Object.keys(baseline).sort(),
				'baseline and index list different fixtures',
			)
			.toEqual(index.map(({ slug }) => slug).sort());
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
		process.platform !== 'darwin',
		'Font rasterising differs by platform, and the snapshots are the Mac set.',
	);
	// Rasterising also moves with macOS point releases and Chromium updates.
	const environment = {
		darwin: release(),
		chromium: browser.version(),
		playwright: test.info().config.version,
	};
	if (CAPTURE) {
		mkdirSync(dirname(ENVIRONMENT), { recursive: true });
		writeFileSync(ENVIRONMENT, `${JSON.stringify(environment, null, '\t')}\n`);
	} else {
		expect
			.soft(
				environment,
				'the snapshots come from another macOS or Chromium; recapture them from 1.x before reading pixel diffs',
			)
			.toEqual(
				existsSync(ENVIRONMENT)
					? JSON.parse(readFileSync(ENVIRONMENT, 'utf8'))
					: null,
			);
	}
	test.setTimeout(20 * 60 * 1000);
	await newPost(admin, 'screenshot harness');
	const ids = await publishFixtures(page, index);

	for (const [i, entry] of index.entries()) {
		expect(
			await visit(page, ids[i]),
			`${entry.slug} never rendered`,
		).not.toHaveLength(0);
		const blocks = page.locator('.wp-block-kevinbatdorf-code-block-pro');
		const count = await blocks.count();
		for (let b = 0; b < count; b++) {
			const name = count > 1 ? `${entry.slug}-${b}` : entry.slug;
			await shootBlock(page, blocks.nth(b), [name]);
		}
	}
});
