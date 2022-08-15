import { BlockControls } from '@wordpress/block-editor'
import { ToolbarGroup, ToolbarButton } from '@wordpress/components'
import { __ } from '@wordpress/i18n'
import { AttributesPropsAndSetter } from '../../types'

export const LanguageControls = ({
    attributes,
    setAttributes,
}: AttributesPropsAndSetter) => {
    return (
        <BlockControls>
            <ToolbarGroup>
                <ToolbarButton
                    // icon={blockIcon}
                    label={__('Select language', 'code-block-pro')}
                    onClick={() => {
                        //
                    }}>
                    {/* {language ?? __('Select language', 'code-block-pro')} */}
                </ToolbarButton>
            </ToolbarGroup>
        </BlockControls>
    )
}
