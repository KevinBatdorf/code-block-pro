import { FontSizePicker } from '@wordpress/components';
import { useThemeStore } from '../../state/theme';

// This file ignores types as they are outdated from the source

export const FontSizeSelect = ({
    value,
    onChange,
}: {
    value: string;
    onChange: (v: string | undefined) => void;
}) => {
    const setPreviousFontSize = (fontSize: string) =>
        useThemeStore.setState({ previousFontSize: fontSize });
    return (
        <FontSizePicker
            onChange={(size) => {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore-next-line
                onChange(size);
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore-next-line
                // setPreviousFontSize(size);
            }}
            fallbackFontSize={1}
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
