import { RichText, useBlockProps as blockProps } from '@wordpress/block-editor';
import { applyFilters } from '@wordpress/hooks';
import classNames from 'classnames';
import defaultThemes from '../defaultThemes.json';
import { FooterType } from '../editor/components/FooterSelect';
import { HeaderType } from '../editor/components/HeaderSelect';
import { SeeMoreType } from '../editor/components/SeeMoreSelect';
import { Attributes, ThemeOption } from '../types';
import { findLineNumberColor } from '../util/colors';
import { fontFamilyLong, maybeClamp } from '../util/fonts';
import { CopyButton } from './CopyButton';
import './style.css';

export const BlockOutput = ({ attributes }: { attributes: Attributes }) => {
    // To add custom styles
    const themes = applyFilters(
        'blocks.codeBlockPro.themes',
        defaultThemes,
    ) as ThemeOption;
    const styles = themes[attributes.theme]?.styles;
    return (
        <div
            {...blockProps.save({
                className: classNames({
                    'padding-disabled': attributes.disablePadding,
                    'padding-bottom-disabled':
                        attributes?.footerType &&
                        attributes?.footerType !== 'none',
                    'cbp-has-line-numbers': attributes.lineNumbers,
                    'cbp-blur-enabled': attributes.enableBlurring,
                    'cbp-unblur-on-hover': attributes.removeBlurOnHover,
                    'cbp-highlight-hover': attributes.highlightingHover,
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
                        ? findLineNumberColor(attributes)
                        : undefined,
                    '--cbp-line-number-start':
                        Number(attributes?.startingLineNumber) > 1
                            ? attributes.startingLineNumber
                            : undefined,
                    '--cbp-line-number-width': attributes.lineNumbersWidth
                        ? `${attributes.lineNumbersWidth}px`
                        : undefined,
                    '--cbp-line-highlight-color':
                        attributes?.enableHighlighting ||
                        attributes?.highlightingHover
                            ? attributes.lineHighlightColor
                            : undefined,
                    lineHeight: maybeClamp(
                        attributes.lineHeight,
                        attributes.clampFonts,
                    ),
                    ...Object.entries(styles ?? {}).reduce(
                        (acc, [key, value]) => ({
                            ...acc,
                            [`--shiki-${key}`]: value,
                        }),
                        {},
                    ),
                    ...(applyFilters(
                        'blocks.codeBlockPro.additionalOutputAttributes',
                        {},
                        attributes,
                    ) as object),
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
                    <SeeMoreType {...attributes} />
                </>
            ) : null}
        </div>
    );
};
