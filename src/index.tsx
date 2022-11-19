import { useBlockProps as blockProps } from '@wordpress/block-editor';
import { createBlock, registerBlockType } from '@wordpress/blocks';
import { addFilter } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';
import classnames from 'classnames';
import { Lang } from 'shiki';
import blockConfig from './block.json';
import { Edit } from './editor/Edit';
import { BlockFilter } from './editor/components/BlockFilter';
import { FooterType } from './editor/components/FooterSelect';
import { HeaderType } from './editor/components/HeaderSelect';
import { SidebarControls } from './editor/controls/Sidebar';
import { ToolbarControls } from './editor/controls/Toolbar';
import './editor/editor.css';
import { BlockOutput } from './front/BlockOutput';
import { CopyButton } from './front/CopyButton';
import { blockIcon } from './icons';
import { Attributes } from './types';
import { fontFamilyLong, maybeClamp } from './util/fonts';
import { getMainAlias } from './util/languages';

registerBlockType<Attributes>(blockConfig.name, {
    ...blockConfig,
    icon: blockIcon,
    // Types seem to be mismatched if importing these from block.json
    attributes: {
        code: { type: 'string' },
        codeHTML: { type: 'string' },
        language: { type: 'string' },
        theme: { type: 'string' },
        align: { type: 'string' },
        bgColor: { type: 'string', default: '#282a37' },
        textColor: { type: 'string', default: '#f8f8f2' },
        fontSize: { type: 'string' },
        fontFamily: { type: 'string' },
        lineHeight: { type: 'string' },
        clampFonts: { type: 'boolean' },
        lineNumbers: { type: 'boolean' },
        headerType: { type: 'string' },
        headerString: { type: 'string' },
        disablePadding: { type: 'boolean' },
        footerType: { type: 'string' },
        footerString: { type: 'string' },
        footerLink: { type: 'string' },
        footerLinkTarget: { type: 'boolean' },
        startingLineNumber: { type: 'string' },
        lineNumbersWidth: { type: 'number' },
        enableHighlighting: { type: 'boolean' },
        lineHighlights: { type: 'string' },
        lineHighlightColor: { type: 'string' },
        enableBlurring: { type: 'boolean' },
        lineBlurs: { type: 'string' },
        removeBlurOnHover: { type: 'boolean' },
        frame: { type: 'boolean' },
        renderType: { type: 'string', default: 'code' },
        label: { type: 'string', default: '' },
        copyButton: { type: 'boolean' },
    },
    // Need to add these here to avoid TS type errors
    supports: {
        html: false,
        align: ['wide', 'full'],
    },
    title: __('Code Pro', 'code-block-pro'),
    edit: ({ attributes, setAttributes }) => (
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
                    }),
                    style: {
                        fontSize: maybeClamp(
                            attributes.fontSize,
                            attributes.clampFonts,
                        ),
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
                        '--cbp-line-highlight-color':
                            attributes?.enableHighlighting
                                ? attributes.lineHighlightColor
                                : undefined,
                        '--cbp-line-height': attributes.lineHeight,
                        fontFamily: fontFamilyLong(attributes.fontFamily),
                        lineHeight: maybeClamp(
                            attributes.lineHeight,
                            attributes.clampFonts,
                        ),
                    },
                })}>
                <HeaderType {...attributes} />
                {attributes.copyButton && (
                    <CopyButton attributes={attributes} />
                )}
                <Edit attributes={attributes} setAttributes={setAttributes} />
                <FooterType {...attributes} />
            </div>
        </>
    ),
    save: ({ attributes }) => <BlockOutput attributes={attributes} />,
    transforms: {
        from: [
            {
                type: 'block',
                blocks: ['core/code', 'syntaxhighlighter/code'],
                transform: (attrs) => {
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore-next-line - Why is this reading the block generic?
                    const { content, language } = attrs;
                    const decode = (value: string) => {
                        const txt = document.createElement('textarea');
                        txt.innerHTML = value;
                        return txt.value;
                    };
                    return createBlock(blockConfig.name, {
                        code: content ? decode(content) : undefined,
                        language: getMainAlias(language) as Lang,
                    });
                },
            },
        ],
    },
});

addFilter(
    'editor.BlockEdit',
    blockConfig.name,
    (CurrentMenuItems) =>
        // Not sure how to type these incoming props
        // eslint-disable-next-line
        (props: any) =>
            BlockFilter(CurrentMenuItems, props),
);
