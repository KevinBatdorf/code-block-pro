/* eslint @typescript-eslint/no-require-imports: 0 */
const defaultConfig = require('@wordpress/scripts/config/webpack.config');
const CopyPlugin = require('copy-webpack-plugin');
const RtlCssPlugin = require('rtlcss-webpack-plugin');

module.exports = {
	...defaultConfig,
	devServer: { ...defaultConfig.devServer, host: 'wordpress.test' },
	plugins: [
		...defaultConfig.plugins.filter(
			(filter) =>
				// Remove the rtl plugin
				!(filter instanceof RtlCssPlugin) &&
				filter.constructor.name !== 'RtlCssPlugin',
		),
		new CopyPlugin({
			patterns: [
				{ from: 'node_modules/shiki', to: 'shiki' },
				{ from: 'src/fonts', to: 'fonts' },
			],
		}),
	],
	experiments: { asyncWebAssembly: true },
};
