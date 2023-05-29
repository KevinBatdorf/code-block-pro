import { PanelBody, BaseControl, CheckboxControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useThemeStore } from '../../state/theme';
import { AttributesPropsAndSetter } from '../../types';

export const ButtonsPanel = ({
    attributes,
    setAttributes,
}: AttributesPropsAndSetter & { bringAttentionToThemes?: boolean }) => {
    const { updateThemeHistory } = useThemeStore();
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
                    checked={attributes.copyButton}
                    onChange={(value) => {
                        setAttributes({ copyButton: value });
                        updateThemeHistory({
                            ...attributes,
                            copyButton: value,
                        });
                    }}
                />
            </BaseControl>
        </PanelBody>
    );
};
