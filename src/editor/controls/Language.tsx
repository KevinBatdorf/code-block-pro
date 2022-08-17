import { BlockControls } from '@wordpress/block-editor'
import { ToolbarGroup } from '@wordpress/components'
import { __ } from '@wordpress/i18n'
import { Attributes } from '../../types'

type LanguageProps = { attributes: Attributes }
export const LanguageControls = ({ attributes }: LanguageProps) => {
    return (
        <BlockControls>
            <ToolbarGroup className="code-block-pro-editor">
                <div
                    className="flex justify-center items-center p-1"
                    title={__('Update in sidebar', 'code-block-pro')}>
                    {attributes?.language ?? __('Plain text', 'code-block-pro')}
                </div>
            </ToolbarGroup>
        </BlockControls>
    )
}
