import { useBlockProps as blockProps } from '@wordpress/block-editor';
import { applyFilters } from '@wordpress/hooks';
import classnames from 'classnames';
import defaultThemes from './defaultThemes.json';
import { Edit } from './editor/Edit';
import { FooterType } from './editor/components/FooterSelect';
import { HeaderType } from './editor/components/HeaderSelect';
import { SeeMoreType } from './editor/components/SeeMoreSelect';
import { ButtonList } from './editor/components/buttons/ButtonList';
import { SidebarControls } from './editor/controls/Sidebar';
import { ToolbarControls } from './editor/controls/Toolbar';
import { AttributesPropsAndSetter } from './types';
import { ThemeOption } from './types';
import { findLineNumberColor } from './util/colors';
import { fontFamilyLong, maybeClamp } from './util/fonts';

export const Editor = ({
    attributes,
    setAttributes,
}: AttributesPropsAndSetter) => {
    const {
        clampFonts,
        disablePadding,
        enableBlurring,
        enableHighlighting,
        footerType,
        fontSize,
        fontFamily,
        highestLineNumber,
        highlightingHover,
        lineHeight,
        lineHighlightColor,
        lineNumbers,
        lineNumbersWidth,
        removeBlurOnHover,
        startingLineNumber,
        tabSize,
        theme,
        useTabs,
    } = attributes;
    // To add custom styles
    const themes = applyFilters(
        'blocks.codeBlockPro.themes',
        defaultThemes,
    ) as ThemeOption;
    const styles = themes[theme]?.styles;

    return (
        <>
            <SidebarControls
                attributes={attributes}
                setAttributes={setAttributes}
            />
            <ToolbarControls
                attributes={attributes}
                setAttributes={setAttributes}
            />
            <div
                {...blockProps({
                    className: classnames('code-block-pro-editor', {
                        'padding-disabled': disablePadding,
                        'padding-bottom-disabled':
                            footerType && footerType !== 'none',
                        'cbp-has-line-numbers': lineNumbers,
                        'cbp-blur-enabled': enableBlurring,
                        'cbp-unblur-on-hover': removeBlurOnHover,
                        'cbp-highlight-hover': highlightingHover,
                    }),
                    style: {
                        fontSize: maybeClamp(fontSize, clampFonts),
                        '--cbp-line-number-color': lineNumbers
                            ? findLineNumberColor(attributes)
                            : undefined,
                        '--cbp-line-number-start':
                            Number(startingLineNumber) > 1
                                ? startingLineNumber
                                : undefined,
                        '--cbp-line-number-width': highestLineNumber
                            ? `calc(${
                                  String(highestLineNumber).length
                              } * ${fontSize})`
                            : lineNumbersWidth // bw compatability
                            ? `${lineNumbersWidth}px`
                            : undefined,
                        '--cbp-line-highlight-color':
                            enableHighlighting || highlightingHover
                                ? lineHighlightColor
                                : undefined,
                        '--cbp-line-height': lineHeight,
                        tabSize:
                            useTabs === undefined
                                ? undefined // bw compatability
                                : tabSize,
                        fontFamily: fontFamilyLong(fontFamily),
                        lineHeight: maybeClamp(lineHeight, clampFonts),
                        ...Object.entries(styles ?? {}).reduce(
                            (acc, [key, value]) => ({
                                ...acc,
                                [`--shiki-${key}`]: value,
                            }),
                            {},
                        ),
                        ...(applyFilters(
                            'blocks.codeBlockPro.additionalEditorAttributes',
                            {},
                            attributes,
                        ) as object),
                    },
                })}>
                <HeaderType {...attributes} />
                <ButtonList {...attributes} />
                <Edit attributes={attributes} setAttributes={setAttributes} />
                <FooterType {...attributes} />
                <SeeMoreType {...attributes} />
            </div>
        </>
    );
};
