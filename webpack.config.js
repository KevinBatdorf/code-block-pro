const path = require('path')
const WasmPackPlugin = require('@wasm-tool/wasm-pack-plugin')
const defaultConfig = require('@wordpress/scripts/config/webpack.config')

module.exports = {
    ...defaultConfig,
    plugins: [
        ...defaultConfig.plugins,
        new WasmPackPlugin({
            crateDirectory: path.resolve(__dirname, '.'),
            extraArgs: '--no-typescript --target web',
            watchDirectories: [path.resolve(__dirname, 'server')],
        }),
    ],
    experiments: {
        asyncWebAssembly: true,
    },
}
