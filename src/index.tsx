import { RichText, useBlockProps as blockProps } from '@wordpress/block-editor';
import { registerBlockType } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';
import blockConfig from './block.json';
import { Edit } from './editor/Edit';
import { SidebarControls } from './editor/controls/Sidebar';
import { ToolbarControls } from './editor/controls/Toolbar';
import './editor/editor.css';
import { CopyButton } from './front/CopyButton';
import './front/style.css';
import { Attributes } from './types';

registerBlockType<Attributes>('kevinbatdorf/code-block-pro', {
    ...blockConfig,
    icon: (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            style={{ width: 24, height: 24 }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="#1e1e1e"
            strokeWidth="2">
            <path
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
        </svg>
    ),
    // Types seem to be mismatched if importing these from block.json
    attributes: {
        code: { type: 'string' },
        codeHTML: { type: 'string' },
        language: { type: 'string' },
        theme: { type: 'string' },
        align: { type: 'string', default: 'center' },
        bgColor: { type: 'string', default: '#282a37' },
        textColor: { type: 'string', default: '#f8f8f2' },
        lineNumbers: { type: 'boolean' },
        startingLineNumber: { type: 'number', default: 1 },
        frame: { type: 'boolean' },
        renderType: { type: 'string', default: 'code' },
        label: { type: 'string', default: '' },
        copyButton: { type: 'boolean' },
    },

    title: __('Code Pro', 'code-block-pro'),
    edit: ({ attributes, setAttributes }) => (
        <>
            <SidebarControls
                attributes={attributes}
                setAttributes={setAttributes}
            />
            <ToolbarControls attributes={attributes} />
            <pre {...blockProps({ className: 'code-block-pro-editor' })}>
                <Edit attributes={attributes} setAttributes={setAttributes} />
            </pre>
        </>
    ),
    save: ({ attributes }) => (
        <div {...blockProps.save()}>
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
