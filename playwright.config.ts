import { existsSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { defineConfig, devices } from '@playwright/test';
import fg from 'fast-glob';

const BASE_PORT = 9400;
const WP_VERSION = process.env.WP_VERSION || 'latest';
const RUN_PROJECT = process.env.RUN_PROJECT;

// Find the closest blueprint.json by walking up from the spec's directory
function findBlueprint(dir: string): string | null {
	let current = dir;
	while (current !== '.' && current !== '/') {
		const bp = join(current, 'blueprint.json');
		if (existsSync(bp)) return bp;
		current = dirname(current);
	}
	return null;
}

// Discover spec files that have a blueprint.json in their directory or any ancestor
const specs = fg
	.sync('**/*.spec.ts', { ignore: ['node_modules/**'] })
	.map((spec) => {
		const dir = dirname(spec);
		const blueprint = findBlueprint(dir);
		if (!blueprint) return null;
		return {
			name: basename(spec, '.spec.ts'),
			dir,
			spec: basename(spec),
			blueprint,
		};
	})
	.filter(
		(
			s,
		): s is {
			name: string;
			dir: string;
			spec: string;
			blueprint: string;
		} => s !== null,
	);

const active = RUN_PROJECT
	? specs.filter((p) => p.name === RUN_PROJECT)
	: specs;

// Dedupe blueprints and assign ports
const blueprints = [...new Set(active.map((s) => s.blueprint))];
const portMap = Object.fromEntries(
	blueprints.map((bp, i) => [bp, BASE_PORT + i]),
);

export default defineConfig({
	forbidOnly: !!process.env.CI,
	retries: 0,
	workers: 1,
	reporter: 'html',
	use: {
		trace: 'retain-on-failure',
		video: 'retain-on-failure',
		screenshot: 'only-on-failure',
	},
	webServer: blueprints.map((bp) => ({
		command: `wp-playground-cli server --auto-mount --blueprint=${bp} --wp=${WP_VERSION} --port=${portMap[bp]} --internal-cookie-store=true --login=false`,
		url: `http://127.0.0.1:${portMap[bp]}`,
		reuseExistingServer: false,
	})),
	projects: active.map((p) => ({
		name: p.name,
		testDir: p.dir,
		testMatch: p.spec,
		use: {
			...devices['Desktop Chrome'],
			baseURL: `http://127.0.0.1:${portMap[p.blueprint]}`,
		},
	})),
});
