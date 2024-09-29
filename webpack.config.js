/* eslint @typescript-eslint/no-require-imports: 0 */
// eslint-disable-next-line no-undef
const defaultConfig = require('@wordpress/scripts/config/webpack.config');
// eslint-disable-next-line no-undef
const CopyPlugin = require('copy-webpack-plugin');

// eslint-disable-next-line no-undef
module.exports = {
    ...defaultConfig,
    devServer: {
        ...defaultConfig.devServer,
        host: 'wordpress.test',
    },
    plugins: [
        ...defaultConfig.plugins,
        new CopyPlugin({
            patterns: [
                { from: 'node_modules/shiki', to: 'shiki' },
                { from: 'src/fonts', to: 'fonts' },
            ],
        }),
    ],
    experiments: {
        asyncWebAssembly: true,
    },
};
