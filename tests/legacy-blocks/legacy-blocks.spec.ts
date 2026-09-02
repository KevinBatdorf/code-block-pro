import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@wordpress/e2e-test-utils-playwright';
import { type BlockDigest, readDigest } from '../fixtures/digest';
import { publishFixtures, readIndex, readMarkup } from '../fixtures/publish';
import { newPost } from '../helpers';

const index = readIndex();
const baseline: Record<string, BlockDigest[]> = JSON.parse(
	readFileSync(join(__dirname, '..', 'fixtures', 'baseline.json'), 'utf8'),
);

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
			expect
				.soft(block.isValid, `${entry.slug}: ${block.name} is invalid`)
				.toBe(true);
		}
		expect
			.soft(
				await editor.canvas.locator('.block-editor-warning').count(),
				`${entry.slug}: the editor showed a block warning`,
			)
			.toBe(0);
	}
});

test('every stored block renders the same on the front end', async ({
	admin,
	page,
}) => {
	test.setTimeout(15 * 60 * 1000);
	await newPost(admin, 'render harness');
	const ids = await publishFixtures(page, index);

	for (const [i, entry] of index.entries()) {
		const expected = baseline[entry.slug];
		let actual: BlockDigest[] = [];
		// A playground 500 reads the same as a block the renderer dropped.
		for (let attempt = 0; attempt < 5 && actual.length === 0; attempt++) {
			await page.goto(`/?p=${ids[i]}`);
			actual = await readDigest(page);
		}

		expect
			.soft(actual.length, `${entry.slug}: block count changed`)
			.toBe(expected.length);
		for (const [b, block] of expected.entries()) {
			const found = actual[b];
			if (!found) continue;
			const where = `${entry.slug}[${b}]`;
			expect.soft(found.text, `${where}: code text changed`).toBe(block.text);
			expect
				.soft(found.lines, `${where}: line count changed`)
				.toBe(block.lines);
			expect
				.soft(found.tokens, `${where}: a glyph changed colour`)
				.toEqual(block.tokens);
			expect
				.soft(found.background, `${where}: background changed`)
				.toBe(block.background);
			expect
				.soft(found.color, `${where}: text colour changed`)
				.toBe(block.color);
			expect
				.soft(found.wrapper, `${where}: wrapper classes changed`)
				.toBe(block.wrapper);
			expect
				.soft(found.chrome, `${where}: chrome changed`)
				.toEqual(block.chrome);
			expect
				.soft(found.copy, `${where}: the copy payload changed`)
				.toBe(block.copy);
		}
	}
});
