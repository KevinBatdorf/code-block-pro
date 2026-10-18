const defaultConfig = require('@wordpress/scripts/config/webpack.config');
const RtlCssPlugin = require('@wordpress/scripts/plugins/rtlcss-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const { themeCssPlugin, fontCssPlugin } = require('./scripts/theme-css');

module.exports = {
	...defaultConfig,
	entry: () => ({
		...defaultConfig.entry(),
		view: './src/front/view.ts',
	}),
	devServer: { ...defaultConfig.devServer, host: 'wordpress.test' },
	plugins: [
		...defaultConfig.plugins.filter(
			(plugin) => !(plugin instanceof RtlCssPlugin),
		),
		new CopyPlugin({
			patterns: [
				// 1.28.0's built files at their 1.x paths, which pages cached under 1.x request.
				// Marked minimized, or Terser rewrites them.
				{
					from: 'src/legacy/assets/front.js',
					to: 'front/front.js',
					info: { minimized: true },
				},
				{
					from: 'src/legacy/assets/style-index.css',
					to: 'style-index.css',
					info: { minimized: true },
				},
				// The 1.x front script fetches fonts from build/fonts/.
				{ from: 'src/legacy/fonts', to: 'fonts' },
				{ from: 'src/themes', to: 'themes' },
				{ from: 'src/languages.json', to: 'languages.json' },
				// Plain CSS with no build step, so its font URLs stay relative to build/.
				{
					from: 'src/front/front.css',
					to: 'front.css',
					info: { minimized: true },
				},
			],
		}),
		themeCssPlugin('src/themes'),
		fontCssPlugin('src/legacy/fonts'),
	],
};
