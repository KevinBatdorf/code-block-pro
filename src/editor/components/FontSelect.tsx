import { FontSizePicker } from '@wordpress/components';

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