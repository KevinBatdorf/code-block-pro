const fs = require('node:fs');
const path = require('node:path');

// Must name colors exactly as code_block_pro_color_class() in php/highlight.php does.
const colorClass = (color) =>
	`cbp-${color.toLowerCase().replace(/[^0-9a-z]/g, '')}`;

// shiki 0.14's rule, so plain text keeps the color 1.x gave it.
const defaultColors = (theme) => {
	const global = theme.tokenColors.find((rule) => !rule.name && !rule.scope);
	const light = theme.type === 'light';
	return {
		fg:
			global?.settings?.foreground ||
			theme.colors?.['editor.foreground'] ||
			(light ? '#333333' : '#bbbbbb'),
		bg:
			global?.settings?.background ||
			theme.colors?.['editor.background'] ||
			(light ? '#fffffe' : '#1e1e1e'),
	};
};

const FONT_STYLES = [
	'.cbp-italic{font-style:italic}',
	'.cbp-bold{font-weight:bold}',
	'.cbp-underline{text-decoration:underline}',
	'.cbp-strike{text-decoration:line-through}',
	'.cbp-underline.cbp-strike{text-decoration:underline line-through}',
];

const themeCss = (slug, theme) => {
	const { fg, bg } = defaultColors(theme);
	const colors = new Set(
		theme.tokenColors
			.map((rule) => rule.settings?.foreground?.toLowerCase())
			.filter(Boolean),
	);
	return [
		`.cbp-theme-${slug}{color:${fg.toLowerCase()};background-color:${bg.toLowerCase()}}`,
		// Tokens with no color of their own inherit through <code>, which site themes often color.
		`.cbp-theme-${slug} code{color:${fg.toLowerCase()}}`,
		...[...colors].map((color) => `.${colorClass(color)}{color:${color}}`),
		...FONT_STYLES,
	].join('\n');
};

const themeCssPlugin = (dir) => ({
	apply: (compiler) => {
		const { Compilation, sources } = compiler.webpack;
		compiler.hooks.thisCompilation.tap('ThemeCss', (compilation) => {
			compilation.hooks.processAssets.tap(
				{
					name: 'ThemeCss',
					stage: Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL,
				},
				() => {
					const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json'));
					for (const file of files) {
						const full = path.join(dir, file);
						const slug = path.basename(file, '.json');
						const css = themeCss(
							slug,
							JSON.parse(fs.readFileSync(full, 'utf8')),
						);
						compilation.fileDependencies.add(full);
						compilation.emitAsset(
							`themes/${slug}.css`,
							new sources.RawSource(`${css}\n`),
							{ minimized: true },
						);
					}
				},
			);
		});
	},
});

module.exports = { themeCssPlugin };
