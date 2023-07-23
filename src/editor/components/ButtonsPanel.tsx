import { PanelBody } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { AttributesPropsAndSetter } from '../../types';
import { CopyBtnSettings } from './buttons/sidebar/CopyBtnSettings';

export const ButtonsPanel = ({
    attributes,
    setAttributes,
}: AttributesPropsAndSetter & { bringAttentionToThemes?: boolean }) => {
    return (
        <div className="code-block-pro-editor">
            <PanelBody
                title={__('Buttons', 'code-block-pro')}
                initialOpen={false}>
                <CopyBtnSettings
                    attributes={attributes}
                    setAttributes={setAttributes}
                />
            </PanelBody>
        </div>
    );
};
