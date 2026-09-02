import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Page } from '@playwright/test';
import type { Editor } from '@wordpress/e2e-test-utils-playwright';
import { test } from '@wordpress/e2e-test-utils-playwright';
import { newPost } from '../helpers';
import { readDigest } from './digest';
import { type FixtureBlock, fixtures } from './fixtures';
import { publishFixtures, readIndex } from './publish';

/**
 * Writes tests/fixtures/blocks and tests/fixtures/baseline.json from the 1.x
 * editor. Skipped unless GENERATE_FIXTURES is set — the output is committed,
 * and regenerating it against a rebuilt block would defeat the whole set.
 *
 *   GENERATE_FIXTURES=1 RUN_PROJECT=generate npx playwright test --project=generate
 */
test.skip(
	!process.env.GENERATE_FIXTURES,
	'Set GENERATE_FIXTURES=1 to rewrite the committed fixtures.',
);

const BLOCK = 'kevinbatdorf/code-block-pro';
const BLOCKS_DIR = join(__dirname, 'blocks');

/** The add-on pack's own theme, shared with the mu-plugin the fixtures run under. */
const CSS_VAR_THEME = JSON.parse(
	readFileSync(join(__dirname, 'css-var-theme.json'), 'utf8'),
);

const codeFor = (block: FixtureBlock) => {
	if (block.literal) return block.code;
	const raw = readFileSync(join(__dirname, 'code', block.code), 'utf8');
	const body = block.trailingNewline ? raw : raw.replace(/\n$/, '');
	return block.crlf ? body.replace(/\n/g, '\r\n') : body;
};

/** Mirrors the editor's own encode(): escaped HTML, or URI-encoded. */
const insertBlock = (
	page: Page,
	attributes: Record<string, unknown>,
	raw: string,
) =>
	page.evaluate(
		([name, attrs, code]) => {
			const stored = attrs.useDecodeURI
				? encodeURIComponent(code)
				: window.wp.escapeHtml.escapeHTML(code);
			const block = window.wp.blocks.createBlock(name, {
				...attrs,
				code: stored,
			});
			window.wp.data.dispatch('core/block-editor').insertBlock(block);
			return block.clientId as string;
		},
		[BLOCK, attributes, raw] as const,
	);

/** Highlighting lands through effects with no signal, so settling is the only cue. */
const settle = async (editor: Editor, expectCode: boolean) => {
	let last = '';
	for (let attempt = 0; attempt < 200; attempt++) {
		const current = await editor.getEditedPostContent();
		const ready = !expectCode || current.includes('"codeHTML"');
		if (ready && current !== '' && current === last) return current;
		last = current;
		await new Promise((resolve) => setTimeout(resolve, 250));
	}
	throw new Error('The editor never stopped changing the block.');
};

/** WP's own serializer, so a stripped attribute still round-trips byte for byte. */
const serialize = (page: Page, strip: (string[] | undefined)[]) =>
	page.evaluate((keys) => {
		const blocks = window.wp.data.select('core/block-editor').getBlocks();
		return window.wp.blocks.serialize(
			blocks.map(
				(block: { attributes: Record<string, unknown> }, i: number) => {
					const attributes = { ...block.attributes };
					for (const key of keys[i] ?? []) delete attributes[key];
					return { ...block, attributes };
				},
			),
		) as string;
	}, strip);

test('write the block markup', async ({
	admin,
	editor,
	page,
	requestUtils,
}) => {
	test.setTimeout(30 * 60 * 1000);
	await requestUtils.login();
	mkdirSync(BLOCKS_DIR, { recursive: true });

	const index: { slug: string; purpose: string; file: string }[] = [];
	const combined: string[] = [];

	for (const fixture of fixtures) {
		await newPost(admin, fixture.slug);
		if (fixture.blocks.some((block) => block.themeFilter === 'cssVars')) {
			await page.evaluate((theme) => {
				window.wp.hooks.addFilter(
					'blocks.codeBlockPro.themes',
					'cbp-fixtures',
					(themes: Record<string, unknown>) => ({
						...themes,
						'inherit-from-global': theme,
					}),
				);
			}, CSS_VAR_THEME);
		}

		const clientIds: string[] = [];
		for (const block of fixture.blocks) {
			clientIds.push(await insertBlock(page, block.attributes, codeFor(block)));
		}
		await settle(
			editor,
			fixture.blocks.every((block) => codeFor(block) !== ''),
		);

		for (const [i, block] of fixture.blocks.entries()) {
			if (!block.after && !block.unset) continue;
			await page.evaluate(
				([clientId, after, unset]) => {
					const attributes: Record<string, unknown> = { ...after };
					for (const key of unset) attributes[key] = undefined;
					window.wp.data
						.dispatch('core/block-editor')
						.updateBlockAttributes(clientId, attributes);
				},
				[clientIds[i], block.after ?? {}, block.unset ?? []] as const,
			);
		}

		await settle(
			editor,
			fixture.blocks.every((block) => codeFor(block) !== ''),
		);
		const content = await serialize(
			page,
			fixture.blocks.map((block) => block.strip),
		);
		const file = `${fixture.slug}.html`;
		writeFileSync(join(BLOCKS_DIR, file), `${content}\n`);
		index.push({ slug: fixture.slug, purpose: fixture.purpose, file });
		combined.push(`<!-- ${fixture.slug} -->`, content);
	}

	writeFileSync(
		join(__dirname, 'index.json'),
		`${JSON.stringify(index, null, '\t')}\n`,
	);
	writeFileSync(join(BLOCKS_DIR, 'all.html'), `${combined.join('\n\n')}\n`);
});

test('write the render baseline', async ({ admin, page, requestUtils }) => {
	test.setTimeout(30 * 60 * 1000);
	await requestUtils.login();
	const index = readIndex();

	await newPost(admin, 'fixture harness');
	const ids = await publishFixtures(page, index);

	const baseline: Record<string, unknown> = {};
	for (const [i, entry] of index.entries()) {
		// A playground 500 reads the same as a block the renderer dropped.
		for (let attempt = 0; attempt < 5; attempt++) {
			await page.goto(`/?p=${ids[i]}`);
			const digest = await readDigest(page);
			if (digest.length > 0) {
				baseline[entry.slug] = digest;
				break;
			}
		}
		if (!baseline[entry.slug]) throw new Error(`${entry.slug} never rendered.`);
	}
	writeFileSync(
		join(__dirname, 'baseline.json'),
		`${JSON.stringify(baseline, null, '\t')}\n`,
	);
});
