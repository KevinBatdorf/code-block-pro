import { InspectorControls } from '@wordpress/block-editor';
import { PanelBody, BaseControl, SelectControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import defaultLanguages from '../../defaultLanguages.json';
import { AttributesPropsAndSetter } from '../../types';

// TODO:
// Language select (auto detect?)
// Theme select (show a modal?)
// Shades of purple?
// Add select to sidebar to select language

export const SidebarControls = ({
    attributes,
    setAttributes,
}: AttributesPropsAndSetter) => {
    return (
        <InspectorControls>
            <PanelBody title={__('Settings', 'code-block-pro')}>
                <div className="code-block-pro-editor">
                    <BaseControl id="code-block-pro-language-select">
                        <SelectControl
                            label={__('Language', 'code-block-pro')}
                            value={attributes?.language}
                            onChange={(language) => setAttributes({ language })}
                            options={[
                                {
                                    label: __('Not set', 'code-block-pro'),
                                    value: '',
                                },
                                ...defaultLanguages.map((value) => ({
                                    label: value,
                                    value,
                                })),
                            ]}
                        />
                    </BaseControl>
                    <BaseControl id="code-block-pro-free-subscription">
                        <div className="p-4 bg-gray-200 mb-4">
                            Here will go a notice regarding lifetime
                            subscriptions.
                        </div>
                    </BaseControl>
                </div>
            </PanelBody>
        </InspectorControls>
    );
};
