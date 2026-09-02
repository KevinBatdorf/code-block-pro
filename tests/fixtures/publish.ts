import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Page } from '@playwright/test';

export type FixtureEntry = { slug: string; purpose?: string; file: string };

export const readIndex = (): FixtureEntry[] =>
	JSON.parse(readFileSync(join(__dirname, 'index.json'), 'utf8'));

export const readMarkup = (entry: FixtureEntry) =>
	readFileSync(join(__dirname, 'blocks', entry.file), 'utf8');

/**
 * Call from a wp-admin page: apiFetch carries the session, where requestUtils
 * reads a REST base URL that ignores the port this run is on.
 */
export const publishFixtures = (page: Page, entries: FixtureEntry[]) =>
	page.evaluate(
		async (payloads) => {
			const created: number[] = [];
			for (const [i, payload] of payloads.entries()) {
				let error: { message?: string } = {};
				// Playground answers the odd request with a 500.
				for (let attempt = 0; attempt < 3 && created.length === i; attempt++) {
					const post = await window.wp
						.apiFetch({
							path: '/wp/v2/posts',
							method: 'POST',
							data: { ...payload, status: 'publish' },
						})
						.catch((failure: { message?: string }) => {
							error = failure;
							return null;
						});
					if (post) created.push(post.id as number);
				}
				if (created.length === i) {
					throw new Error(`${payload.title}: ${error?.message ?? 'unknown'}`);
				}
			}
			return created;
		},
		entries.map((entry) => ({ title: entry.slug, content: readMarkup(entry) })),
	);
