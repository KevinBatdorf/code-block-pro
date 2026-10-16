import { defineConfig } from 'oxlint';
import { RECOMMENDED_RULES } from 'oxlint-plugin-react-doctor';

export default defineConfig({
	plugins: ['eslint', 'typescript', 'unicorn', 'oxc'],
	jsPlugins: [
		{ name: 'react-doctor', specifier: 'oxlint-plugin-react-doctor' },
	],
	categories: { correctness: 'error', suspicious: 'warn' },
	options: { typeAware: true, typeCheck: true },
	env: { browser: true, node: true, builtin: true },
	settings: {
		'react-doctor': {
			portedRuleMode: 'curated',
			capabilities: ['react', 'react:18', 'typescript', 'unknown'],
		},
	},
	rules: {
		...RECOMMENDED_RULES,
		'typescript/no-unsafe-type-assertion': 'off',
		'eslint/no-shadow': 'off',
	},
	overrides: [
		{
			// Frozen 1.x save code: any change, even a fix, invalidates stored blocks.
			files: ['src/legacy/**'],
			rules: {
				'react-doctor/prefer-tag-over-role': 'off',
				'react-doctor/no-high-complexity-react-function': 'off',
				'react-doctor/html-no-nested-interactive': 'off',
				'react-doctor/no-spread-accumulator-in-reduce': 'off',
				'typescript/unbound-method': 'off',
				'typescript/consistent-return': 'off',
				'typescript/no-unnecessary-type-assertion': 'off',
				'unicorn/consistent-function-scoping': 'off',
			},
		},
		{
			files: ['src/index.tsx'],
			rules: { 'unicorn/no-empty-file': 'off' },
		},
	],
	// Type checking covers only linted files, so this list must match tsconfig's exclude.
	ignorePatterns: [
		'build',
		'vendor',
		'src_old',
		'src/legacy/assets',
		'tests_old',
		'tests/fixtures/code',
		'tests/fixtures/blocks',
	],
});
