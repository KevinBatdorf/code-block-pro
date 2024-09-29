import defaultConfig from '@wordpress/scripts/config/webpack.config';
import CopyPlugin from 'copy-webpack-plugin';

export default {
    ...defaultConfig,
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
