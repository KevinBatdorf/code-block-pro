import { __ } from '@wordpress/i18n';

export const UnsupportedTheme = () => (
    <div className="block w-full h-8 pt-2">
        {__('Not supported with this theme', 'code-block-pro')}
    </div>
);
