import { PanelBody, BaseControl, CheckboxControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useThemeStore } from '../../state/theme';
import { AttributesPropsAndSetter } from '../../types';

export const ButtonsPanel = ({
    attributes,
    setAttributes,
}: AttributesPropsAndSetter & { bringAttentionToThemes?: boolean }) => {
    const { updateThemeHistory } = useThemeStore();
    const addOrRemoveButton = (button: string, value: boolean) => {
        // [] attributes cause dirty posts (i guess) so this uses something like
        // copy:download:etc instead of an array
        const currentButtons = attributes.buttons.split(':');
        const newButtons = value
            ? [...new Set([...currentButtons, button])]
            : currentButtons.filter((b) => b !== button);
        const buttons = newButtons?.filter(Boolean).join(':');

        updateThemeHistory({
            ...attributes,
            buttons,
        });
        setAttributes({ buttons });
    };
    return (
        <PanelBody title={__('Buttons', 'code-block-pro')} initialOpen={false}>
            <BaseControl id="code-block-pro-show-copy-button">
                <CheckboxControl
                    data-cy="copy-button"
                    label={__('Copy Button', 'code-block-pro')}
                    help={__(
                        'Adds a button to copy the code',
                        'code-block-pro',
                    )}
                    checked={attributes.buttons?.split(':')?.includes('copy')}
                    onChange={(value) => addOrRemoveButton('copy', value)}
                />
            </BaseControl>
        </PanelBody>
    );
};
