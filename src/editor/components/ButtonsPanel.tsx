import { PanelBody, BaseControl, CheckboxControl } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useThemeStore } from '../../state/theme';
import { AttributesPropsAndSetter } from '../../types';

export const ButtonsPanel = ({
    attributes,
    setAttributes,
}: AttributesPropsAndSetter & { bringAttentionToThemes?: boolean }) => {
    const { updateThemeHistory } = useThemeStore();
    const addOrRemoveButton = (button: string, value: boolean) => {
        const buttons = value
            ? attributes.buttons.filter((b) => b !== button)
            : [...new Set([...attributes.buttons, button])];
        updateThemeHistory({ ...attributes, buttons });
        setAttributes({ buttons });
    };
    return (
        <PanelBody title={__('Buttons', 'code-block-pro')} initialOpen={false}>
            <BaseControl id="code-block-pro-show-copy-button">
                <CheckboxControl
                    data-cy="copy-button"
                    label={__('Copy Button', 'code-block-pro')}
                    checked={attributes.buttons.includes('copy')}
                    onChange={(value) => addOrRemoveButton('copy', value)}
                />
            </BaseControl>
        </PanelBody>
    );
};
