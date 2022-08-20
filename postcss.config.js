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

                // This will allow users to override something like
                // padding within the block styles
                if (file.endsWith('style.css')) {
                    // This appends the :not() exception to padding and margins
                    if (new RegExp('[:]?[^a-z]-?p[a-z]?-.+').test(rule)) {
                        rule.selector += ':not([style*="padding"])';
                    }
                    if (new RegExp('[:]?[^a-z]-?m[a-z]?-.+').test(rule)) {
                        rule.selector += ':not([style*="margin"])';
                    }
                }
            }),
        // See: https://github.com/WordPress/gutenberg/blob/trunk/packages/postcss-plugins-preset/lib/index.js
        require('autoprefixer')({ grid: true }),
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
