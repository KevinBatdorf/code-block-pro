import { InspectorControls } from '@wordpress/block-editor'
import { PanelBody, BaseControl } from '@wordpress/components'
import { __ } from '@wordpress/i18n'

// TODO:
// Language select (auto detect?)
// Theme select (show a modal?)
// Shades of purple?
// Add select to sidebar to select language

export const SidebarControls = () => (
    <InspectorControls>
        <PanelBody title={__('Settings', 'code-block-pro')}>
            <BaseControl id="free-subscription">
                <div className="code-block-pro-editor">
                    <div className="p-4 bg-gray-200 mb-4">
                        Here will go a notice regarding lifetime subscriptions.
                    </div>
                </div>
            </BaseControl>
        </PanelBody>
    </InspectorControls>
)
