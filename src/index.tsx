import { RichText, useBlockProps as blockProps } from '@wordpress/block-editor';
import { registerBlockType } from '@wordpress/blocks';
import { addFilter } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';
import blockConfig from './block.json';
import { Edit } from './editor/Edit';
import { BlockFilter } from './editor/components/BlockFilter';
import { SidebarControls } from './editor/controls/Sidebar';
import { ToolbarControls } from './editor/controls/Toolbar';
import './editor/editor.css';
import { CopyButton } from './front/CopyButton';
import './front/style.css';
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
        lineNumbers: { type: 'boolean' },
        startingLineNumber: { type: 'number', default: 1 },
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
                    className: 'code-block-pro-editor',
                    style: { fontSize: attributes.fontSize },
                })}>
                <Edit attributes={attributes} setAttributes={setAttributes} />
            </div>
        </>
    ),
    save: ({ attributes }) => (
        <div
            {...blockProps.save()}
            style={{
                fontSize: attributes.fontSize,
            }}>
            {attributes.code?.length > 0 ? (
                <>
                    {attributes.copyButton && (
                        <CopyButton attributes={attributes} />
                    )}
                    <RichText.Content value={attributes.codeHTML} />
                </>
            ) : null}
        </div>
    ),
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
