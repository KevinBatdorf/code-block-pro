const tailwind = require('./tailwind.config');

module.exports = ({ mode, file }) => ({
    ident: 'postcss',
    sourceMap: mode !== 'production',
    plugins: [
        require('postcss-import'),
        require('tailwindcss/nesting'),
        require('tailwindcss')({
            ...tailwind,
            // Scope the editor css separately from the frontend css.
            content: file.endsWith('editor.css')
                ? ['./src/editor/**/*.{ts,tsx}']
                : ['./src/front/**/*.{ts,tsx}'],
            important:
                tailwind.important +
                (file.endsWith('editor.css') ? '-editor' : ''),
        }),
        (css) =>
            css.walkRules((rule) => {
                // Removes top level TW styles like *::before {}
                rule.selector.startsWith('*') && rule.remove();
            }),
        // See: https://github.com/WordPress/gutenberg/blob/trunk/packages/postcss-plugins-preset/lib/index.js
        require('autoprefixer')({ grid: true }),
        !file.endsWith('editor.css') && require('postcss-safe-important'),
        mode === 'production' &&
            // See: https://github.com/WordPress/gutenberg/blob/trunk/packages/scripts/config/webpack.config.js#L68
            require('cssnano')({
                preset: [
                    'default',
                    {
                        discardComments: {
                            removeAll: true,
                        },
                    },
                ],
            }),
    ],
});
