import { existsSync, globSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { defineConfig, devices } from '@playwright/test';

const BASE_PORT = 9400;
const WP_VERSION = process.env.WP_VERSION || 'latest';
const RUN_PROJECT = process.env.RUN_PROJECT;

// Discover spec files that have a blueprint.json in the same directory
const specs = globSync('**/*.spec.ts', { ignore: ['node_modules/**'] })
	.map((spec) => {
		const dir = dirname(spec);
		const blueprint = join(dir, 'blueprint.json');
		if (!existsSync(blueprint)) return null;
		return {
			name: basename(spec, '.spec.ts'),
			dir,
			spec: basename(spec),
			blueprint,
		};
	})
	.filter(Boolean);

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
