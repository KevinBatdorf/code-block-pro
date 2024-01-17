import { SelectControl, FontSizePicker } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

// This file ignores types as they are outdated from the source

export const FontSizeSelect = ({
    value,
    onChange,
}: {
    value: string;
    onChange: (v: string | undefined) => void;
}) => {
    return (
        <FontSizePicker
            onChange={(size) => {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore-next-line
                onChange(size ?? '.875rem');
            }}
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore-next-line
            value={value}
            fontSizes={[
                {
                    name: 'Tiny',
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore-next-line
                    size: '.75rem',
                    slug: 'tiny',
                },
                {
                    name: 'Small',
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore-next-line
                    size: '.875rem',
                    slug: 'small',
                },
                {
                    name: 'Normal',
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore-next-line
                    size: '1rem',
                    slug: 'normal',
                },
                {
                    name: 'Big',
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore-next-line
                    size: '1.125rem',
                    slug: 'big',
                },
            ]}
        />
    );
};

export const FontLineHeightSelect = ({
    value,
    onChange,
}: {
    value: string;
    onChange: (v: string | undefined) => void;
}) => {
    return (
        <FontSizePicker
            onChange={(size) => {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore-next-line
                onChange(size ?? '.875rem');
            }}
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore-next-line
            value={value}
            fontSizes={[
                {
                    name: 'None',
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore-next-line
                    size: '1rem',
                    slug: 'none',
                },
                {
                    name: 'Tight',
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore-next-line
                    size: '1.25rem',
                    slug: 'tight',
                },
                {
                    name: 'Normal',
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore-next-line
                    size: '1.5rem',
                    slug: 'normal',
                },
                {
                    name: 'Relaxed',
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore-next-line
                    size: '1.625rem',
                    slug: 'relaxed',
                },
            ]}
        />
    );
};
export const FontFamilySelect = ({
    value,
    onChange,
}: {
    value: string;
    onChange: (v: string) => void;
}) => {
    const fonts = {
        '': __('System Default', 'code-block-pro'),
        'Code-Pro-Comic-Mono.ttf': 'Comic Mono',
        'Code-Pro-Cozette': 'Cozette',
        'Code-Pro-Deja-Vu-Mono.ttf': 'DejaVu Mono',
        'Code-Pro-Fantasque-Sans-Mono': 'Fantasque Sans Mono',
        'Code-Pro-Fira-Code': 'Fira Code',
        'Code-Pro-Geist-Mono': 'Geist Mono',
        'Code-Pro-Hack': 'Hack',
        'Code-Pro-JetBrains-Mono': 'JetBrains Mono',
        'Code-Pro-JetBrains-Mono-NL.ttf': 'JetBrains Mono (No Ligatures)',
        'Code-Pro-Monaspace-Argon.woff': 'Monaspace Argon',
        'Code-Pro-Monaspace-Krypton.woff': 'Monaspace Krypton',
        'Code-Pro-Monaspace-Neon.woff': 'Monaspace Neon',
        'Code-Pro-Monaspace-Radon.woff': 'Monaspace Radon',
        'Code-Pro-Monaspace-Xenon.woff': 'Monaspace Xenon',
        'Code-Pro-Roboto-Mono.ttf': 'Roboto Mono',
    };
    return (
        <SelectControl
            id="code-block-pro-font-family"
            label={__('Font Family', 'code-block-pro')}
            value={value}
            onChange={onChange}
            options={Object.entries(fonts).map(([value, label]) => ({
                label,
                value,
            }))}
        />
    );
};
