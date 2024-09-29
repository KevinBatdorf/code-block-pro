import { colors } from 'tailwindcss/colors';

delete colors['lightBlue'];
delete colors['warmGray'];
delete colors['trueGray'];
delete colors['coolGray'];
delete colors['blueGray'];

// See postcss.config.js for more parsing options.
export default {
    // Tnis should match the namespace you use in your css styles.
    important: '.code-block-pro',
    theme: {
        screens: {
            xxs: '280px',
            xs: '480px',
            sm: '600px',
            md: '782px',
            md2: '960px', // admin sidebar auto folds
            lg: '1080px', // adminbar goes big
            xl: '1280px',
            '2xl': '1440px',
            '3xl': '1600px',
            '4xl': '1920px',
        },
        colors: {
            ...colors,
            'wp-theme': {
                500: 'var(--wp-admin-theme-color)',
                600: 'var(--wp-admin-theme-color-darker-10)',
                700: 'var(--wp-admin-theme-color-darker-20)',
            },
            wp: {
                alert: {
                    yellow: '#f0b849',
                    red: '#cc1818',
                    green: '#4ab866',
                },
            },
            website: {
                main: '#272335',
                'main-dark': '#1E1A2B',
                accent: '#FF7EDB',
                'accent-yellow': '#FEDE5D',
            },
            // https://github.com/WordPress/gutenberg/blob/trunk/packages/base-styles/_colors.scss
            gray: {
                50: '#fbfbfb',
                100: '#f0f0f0',
                150: '#eaeaea',
                200: '#e0e0e0',
                300: '#dddddd',
                400: '#cccccc',
                500: '#cccccc',
                600: '#949494',
                700: '#757575',
                900: '#1e1e1e',
            },
        },
        extend: {
            zIndex: {
                high: '99999',
                max: '2147483647',
            },
            ringWidth: {
                wp: 'var(--wp-admin-border-width-focus)',
            },
        },
    },
    plugins: [],
    corePlugins: {
        preflight: false,
        animation: false,
        container: false,
    },
};
