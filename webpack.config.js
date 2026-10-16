const defaultConfig = require('@wordpress/scripts/config/webpack.config');
const RtlCssPlugin = require('@wordpress/scripts/plugins/rtlcss-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
	...defaultConfig,
	devServer: { ...defaultConfig.devServer, host: 'wordpress.test' },
	plugins: [
		...defaultConfig.plugins.filter(
			(plugin) => !(plugin instanceof RtlCssPlugin),
		),
		new CopyPlugin({
			patterns: [
				// 1.28.0's built files, so a stored block renders exactly as 1.x did.
				// Marked minimized, or Terser rewrites front.js.
				{ from: 'src/legacy/assets', to: 'legacy', info: { minimized: true } },
				// The 1.x front script fetches fonts from build/fonts/.
				{ from: 'src/legacy/fonts', to: 'fonts' },
			],
		}),
	],
};
