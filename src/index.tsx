import { RichText, useBlockProps as blockProps } from '@wordpress/block-editor'
import { registerBlockType } from '@wordpress/blocks'
import { __ } from '@wordpress/i18n'
import blockConfig from './block.json'
import { Edit } from './editor/Edit'
import { LanguageControls } from './editor/controls/Language'
import { SidebarControls } from './editor/controls/Sidebar'
import './editor/editor.css'
import './front/style.css'
import { Attributes } from './types'

registerBlockType<Attributes>('kevinbatdorf/code-block-pro', {
    ...blockConfig,
    icon: undefined,
    // Types seem to be mismatched if importing these from block.json
    attributes: {
        code: { type: 'string' },
        codeHTML: { type: 'string' },
        language: { type: 'string' },
        theme: { type: 'string', default: 'dracula' },
        align: { type: 'string', default: 'center' },
        bgColor: { type: 'string', default: '#282a37' },
        textColor: { type: 'string', default: '#f8f8f2' },
        lineNumbers: { type: 'boolean', default: false },
    },

    title: __('Code Block Pro', 'code-block-pro'),
    edit: ({ attributes, setAttributes }) => (
        <>
            <SidebarControls />
            <LanguageControls
                attributes={attributes}
                setAttributes={setAttributes}
            />
            <pre
                {...blockProps({
                    className: 'code-block-pro-editor',
                })}>
                <Edit attributes={attributes} setAttributes={setAttributes} />
            </pre>
        </>
    ),
    save: ({ attributes }) => {
        return (
            <div {...blockProps.save()}>
                <RichText.Content value={attributes.codeHTML} />
            </div>
        )
    },
})
