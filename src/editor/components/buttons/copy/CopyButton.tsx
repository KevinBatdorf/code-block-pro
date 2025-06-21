import { __ } from '@wordpress/i18n';
import stripAnsi from 'strip-ansi';
import { Attributes } from '../../../../types';
import { escapeShortcodes } from '../../../../util/code';
import { Clipboard } from './Clipboard';
import { TextSimple } from './TextSimple';
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
    textSimple: {
        label: __('Text Simple', 'code-block-pro'),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Component: (props: any) => <TextSimple {...props} />,
    },
};

export const CopyButton = ({ attributes }: { attributes: Attributes }) => {
    const {
        copyButtonType,
        copyButtonString,
        copyButtonStringCopied,
        copyButtonUseTextarea,
        useDecodeURI,
        code,
        textColor,
        bgColor: b,
        headerType,
        useEscapeShortCodes,
    } = attributes;
    const hasTextButton = copyButtonType === 'textSimple';
    const color = hasTextButton ? b : textColor;
    const bgColor = hasTextButton ? textColor : undefined;
    const { Component } =
        copyButtonTypes?.[copyButtonType as keyof typeof copyButtonTypes] ??
        copyButtonTypes.heroicons;
    const codeToCopy = stripAnsi(
        useDecodeURI ? encodeURIComponent(code ?? '') : (code ?? ''),
    );
    return (
        <span
            // Using a span to prevent aggressive button styling from themes
            role="button"
            tabIndex={0}
            data-encoded={useDecodeURI ? true : undefined}
            data-code={
                copyButtonUseTextarea
                    ? undefined
                    : useEscapeShortCodes
                      ? escapeShortcodes(codeToCopy)
                      : codeToCopy
            }
            style={{
                color: color ?? 'inherit',
                display: 'none',
                backgroundColor: bgColor,
            }}
            aria-label={copyButtonString ?? __('Copy', 'code-block-pro')}
            data-copied-text={
                hasTextButton
                    ? (copyButtonStringCopied ??
                      __('Copied!', 'code-block-pro'))
                    : undefined
            }
            data-has-text-button={hasTextButton ? copyButtonType : undefined}
            data-inside-header-type={hasTextButton ? headerType : undefined}
            aria-live={hasTextButton ? 'polite' : undefined}
            className="code-block-pro-copy-button">
            {copyButtonUseTextarea ? (
                <pre
                    className="code-block-pro-copy-button-pre"
                    aria-hidden="true">
                    <textarea
                        className="code-block-pro-copy-button-textarea"
                        tabIndex={-1}
                        aria-hidden="true"
                        readOnly
                        value={
                            useEscapeShortCodes
                                ? escapeShortcodes(codeToCopy)
                                : codeToCopy
                        }
                    />
                </pre>
            ) : null}
            <Component text={copyButtonString} />
        </span>
    );
};
