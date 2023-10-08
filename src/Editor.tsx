import { useBlockProps as blockProps } from '@wordpress/block-editor';
import { applyFilters } from '@wordpress/hooks';
import classnames from 'classnames';
import { Edit } from './editor/Edit';
import { FooterType } from './editor/components/FooterSelect';
import { HeaderType } from './editor/components/HeaderSelect';
import { SeeMoreType } from './editor/components/SeeMoreSelect';
import { ButtonList } from './editor/components/buttons/ButtonList';
import { SidebarControls } from './editor/controls/Sidebar';
import { ToolbarControls } from './editor/controls/Toolbar';
import { findLineNumberColor } from './util/colors';
import { fontFamilyLong, maybeClamp } from './util/fonts';
import { AttributesPropsAndSetter } from './types';
import defaultThemes from './defaultThemes.json';
import { ThemeOption } from './types';

export const Editor = ({
    attributes,
    setAttributes,
}: AttributesPropsAndSetter) => {
    // To add custom styles
    const themes = applyFilters(
        'blocks.codeBlockPro.themes',
        defaultThemes,
    ) as ThemeOption;
    const styles = themes[attributes.theme]?.styles;

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
                        'padding-disabled': attributes.disablePadding,
                        'padding-bottom-disabled':
                            attributes?.footerType &&
                            attributes?.footerType !== 'none',
                        'cbp-has-line-numbers': attributes.lineNumbers,
                        'cbp-blur-enabled': attributes.enableBlurring,
                        'cbp-unblur-on-hover': attributes.removeBlurOnHover,
                        'cbp-highlight-hover': attributes.highlightingHover,
                    }),
                    style: {
                        fontSize: maybeClamp(
                            attributes.fontSize,
                            attributes.clampFonts,
                        ),
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
                        '--cbp-line-height': attributes.lineHeight,
                        tabSize:
                            attributes.useTabs === undefined
                                ? undefined // bw compatability
                                : attributes.tabSize,
                        // Disabled as ligatures will break the editor line widths
                        // fontFamily: fontFamilyLong(attributes.fontFamily),
                        fontFamily: fontFamilyLong(''),
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
