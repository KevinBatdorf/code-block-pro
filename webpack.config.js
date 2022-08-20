const defaultConfig = require('@wordpress/scripts/config/webpack.config');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
    ...defaultConfig,
    plugins: [
        ...defaultConfig.plugins,
        new CopyPlugin({
            patterns: [{ from: 'node_modules/shiki', to: 'shiki' }],
        }),
    ],
    experiments: {
        asyncWebAssembly: true,
    },
};
