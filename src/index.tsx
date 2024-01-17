import { registerBlockType } from '@wordpress/blocks';
import { addFilter } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';
import { Editor } from './Editor';
import blockConfig from './block.json';
import { BlockFilter } from './editor/components/BlockFilter';
import './editor/editor.css';
import { transformToCBP, transformFromCBP } from './editor/transforms';
import { BlockOutput } from './front/BlockOutput';
import { blockIcon } from './icons';
import { Attributes } from './types';

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
        editorHeight: { type: 'string' },
        lineNumbers: { type: 'boolean' },
        headerType: { type: 'string' },
        headerString: { type: 'string' },
        disablePadding: { type: 'boolean' },
        footerType: { type: 'string' },
        footerString: { type: 'string' },
        footerLink: { type: 'string' },
        footerLinkTarget: { type: 'boolean' },
        enableMaxHeight: { type: 'boolean' },
        seeMoreType: { type: 'string' },
        seeMoreString: { type: 'string' },
        seeMoreAfterLine: { type: 'string' },
        seeMoreTransition: { type: 'boolean' },
        startingLineNumber: { type: 'string' },
        lineNumbersWidth: { type: 'number' },
        highestLineNumber: { type: 'number' },
        enableHighlighting: { type: 'boolean' },
        highlightingHover: { type: 'boolean' },
        lineHighlights: { type: 'string' },
        lineHighlightColor: { type: 'string' },
        enableBlurring: { type: 'boolean' },
        lineBlurs: { type: 'string' },
        removeBlurOnHover: { type: 'boolean' },
        frame: { type: 'boolean' },
        renderType: { type: 'string', default: 'code' },
        label: { type: 'string', default: '' },
        copyButton: { type: 'boolean' },
        copyButtonType: { type: 'string' },
        copyButtonString: {
            type: 'string',
            default: __('Copy', 'code-block-pro'),
        },
        copyButtonStringCopied: {
            type: 'string',
            default: __('Copied!', 'code-block-pro'),
        },
        useDecodeURI: { type: 'boolean', default: false },
        tabSize: { type: 'number', default: 2 },
        useTabs: { type: 'boolean' },
    },
    // Need to add these here to avoid TS type errors
    supports: {
        html: false,
        align: ['wide', 'full'],
    },
    title: __('Code Pro', 'code-block-pro'),
    edit: ({ attributes, setAttributes }) => (
        <Editor attributes={attributes} setAttributes={setAttributes} />
    ),
    save: ({ attributes }) => <BlockOutput attributes={attributes} />,
    transforms: {
        from: [
            {
                type: 'block',
                blocks: ['core/code', 'syntaxhighlighter/code'],
                transform: transformToCBP,
            },
        ],
        to: [
            {
                type: 'block',
                blocks: ['core/code'],
                transform: transformFromCBP,
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
