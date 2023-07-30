import { __ } from '@wordpress/i18n';
import stripAnsi from 'strip-ansi';
import { Attributes } from '../../../../types';
import { Clipboard } from './Clipboard';
import { TwoSquares } from './TwoSquares';

export const copyButtonTypes = {
    // Poorly named key here, but it's already there so it stays
    heroicons: {
        label: __('Clipboard', 'code-block-pro'),
        Component: Clipboard,
    },
    twoSquares: {
        label: __('Two Squares', 'code-block-pro'),
        Component: TwoSquares,
    },
};

export const CopyButton = ({ attributes }: { attributes: Attributes }) => {
    const { Component } =
        copyButtonTypes?.[
            attributes.copyButtonType as keyof typeof copyButtonTypes
        ] ?? copyButtonTypes.heroicons;
    return (
        <span
            // Using a span to prevent aggressive button styling from themes
            role="button"
            tabIndex={0}
            data-encoded={attributes.useDecodeURI ? true : undefined}
            data-code={stripAnsi(
                attributes.useDecodeURI
                    ? encodeURIComponent(attributes.code ?? '')
                    : attributes.code ?? '',
            )}
            style={{
                color: attributes?.textColor ?? 'inherit',
                display: 'none',
            }}
            aria-label={__('Copy', 'code-block-pro')}
            className="code-block-pro-copy-button">
            <Component />
        </span>
    );
};
