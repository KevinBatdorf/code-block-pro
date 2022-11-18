import { RichText, useBlockProps as blockProps } from '@wordpress/block-editor';
import classNames from 'classnames';
import { FooterType } from '../editor/components/FooterSelect';
import { HeaderType } from '../editor/components/HeaderSelect';
import { Attributes } from '../types';
import { fontFamilyLong, maybeClamp } from '../util/fonts';
import { CopyButton } from './CopyButton';
import './style.css';

export const BlockOutput = ({ attributes }: { attributes: Attributes }) => (
    <div
        {...blockProps.save({
            className: classNames({
                'padding-disabled': attributes.disablePadding,
                'padding-bottom-disabled':
                    attributes?.footerType && attributes?.footerType !== 'none',
                'cbp-has-line-numbers': attributes.lineNumbers,
                'cbp-blur-enabled': attributes.enableBlurring,
                'cbp-unblur-on-hover': attributes.removeBlurOnHover,
            }),
        })}
        data-code-block-pro-font-family={attributes.fontFamily}
        style={
            {
                fontSize: maybeClamp(
                    attributes.fontSize,
                    attributes.clampFonts,
                ),
                // Tiny check to avoid block invalidation error
                fontFamily: fontFamilyLong(attributes.fontFamily),
                '--cbp-line-number-color': attributes?.lineNumbers
                    ? attributes.textColor
                    : undefined,
                '--cbp-line-number-start':
                    Number(attributes?.startingLineNumber) > 1
                        ? attributes.startingLineNumber
                        : undefined,
                '--cbp-line-number-width': attributes.lineNumbersWidth
                    ? `${attributes.lineNumbersWidth}px`
                    : undefined,
                '--cbp-line-highlight-color': attributes?.enableHighlighting
                    ? attributes.lineHighlightColor
                    : undefined,
                lineHeight: maybeClamp(
                    attributes.lineHeight,
                    attributes.clampFonts,
                ),
            } as React.CSSProperties
        }>
        {attributes.code?.length > 0 ? (
            <>
                <HeaderType {...attributes} />
                {attributes.copyButton && (
                    <CopyButton attributes={attributes} />
                )}
                <RichText.Content value={attributes.codeHTML} />
                <FooterType {...attributes} />
            </>
        ) : null}
    </div>
);
