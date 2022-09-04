import { InspectorControls } from '@wordpress/block-editor';
import {
    PanelBody,
    BaseControl,
    SelectControl,
    CheckboxControl,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Theme } from 'shiki';
import { useLanguage } from '../../hooks/useLanguage';
import { useGlobalStore } from '../../state/global';
import { AttributesPropsAndSetter } from '../../types';
import { languages } from '../../util/languages';
import { FontSizeSelect } from '../components/FontSelect';
import { Notice } from '../components/Notice';
import { ThemeSelect } from '../components/ThemeSelect';

export const SidebarControls = ({
    attributes,
    setAttributes,
}: AttributesPropsAndSetter) => {
    const [language, setLanguage] = useLanguage({ attributes, setAttributes });
    const { setPreviousSettings } = useGlobalStore();

    return (
        <InspectorControls>
            <PanelBody
                title={__('Settings', 'code-block-pro')}
                initialOpen={true}>
                <div className="code-block-pro-editor">
                    <BaseControl id="code-block-pro-language">
                        <SelectControl
                            label={__('Code Language', 'code-block-pro')}
                            data-cy-cbp="language-select"
                            value={language}
                            onChange={setLanguage}
                            options={Object.entries(languages).map(
                                ([value, label]) => ({
                                    label,
                                    value,
                                }),
                            )}
                        />
                    </BaseControl>
                    <BaseControl
                        id="code-block-pro-fonts"
                        label={__('Font Settings', 'code-block-pro')}>
                        <FontSizeSelect
                            value={attributes.fontSize}
                            onChange={(fontSize) => {
                                console.log({ fontSize });
                                // setAttributes({ fontSize });
                            }}
                        />
                    </BaseControl>
                    <BaseControl id="code-block-pro-extras">
                        <CheckboxControl
                            label={__('Copy Button', 'code-block-pro')}
                            help={__(
                                'If checked, users will be able to copy your code snippet to their clipboard.',
                                'code-block-pro',
                            )}
                            checked={attributes.copyButton}
                            onChange={(value) => {
                                setPreviousSettings({ copyButton: value });
                                setAttributes({ copyButton: value });
                            }}
                        />
                    </BaseControl>
                    <Notice />
                </div>
            </PanelBody>
            <PanelBody
                title={__('Themes', 'code-block-pro')}
                initialOpen={false}>
                <ThemeSelect
                    {...attributes}
                    onClick={(slug: Theme) => {
                        setAttributes({ theme: slug });
                    }}
                />
            </PanelBody>
        </InspectorControls>
    );
};
