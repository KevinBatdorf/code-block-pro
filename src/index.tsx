import { RichText, useBlockProps as blockProps } from '@wordpress/block-editor'
import { registerBlockType } from '@wordpress/blocks'
import { __ } from '@wordpress/i18n'
import blockConfig from './block.json'
import { Controls } from './editor/Controls'
import { Edit } from './editor/Edit'
import './front/style.css'

export type Attributes = {
    code: string
    codeHTML: string
    language: string
    theme: string
    align: 'wide' | 'full'
}

registerBlockType<Attributes>('kevinbatdorf/code-block-pro', {
    ...blockConfig,
    icon: undefined,
    // Types seem to be mismatched if importing these from block.json
    attributes: {
        code: { type: 'string' },
        codeHTML: { type: 'string' },
        language: { type: 'string' },
        theme: { type: 'string', default: 'nord' },
        align: { type: 'string', default: 'center' },
    },

    title: __('Code Block Pro', 'code-block-pro'),
    edit: ({ attributes, setAttributes }) => (
        <>
            <Controls attributes={attributes} setAttributes={setAttributes} />
            <pre {...blockProps()}>
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
