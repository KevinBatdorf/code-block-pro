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
import { useThemeStore } from '../../state/theme';
import { AttributesPropsAndSetter } from '../../types';
import { languages } from '../../util/languages';
import {
    FontSizeSelect,
    FontLineHeightSelect,
    FontFamilySelect,
} from '../components/FontSelect';
import { HeaderSelect } from '../components/HeaderSelect';
import { Notice } from '../components/Notice';
import { ThemeSelect } from '../components/ThemeSelect';

export const SidebarControls = ({
    attributes,
    setAttributes,
}: AttributesPropsAndSetter) => {
    const [language, setLanguage] = useLanguage({ attributes, setAttributes });
    const { updateThemeHistory } = useThemeStore();
    const { setPreviousSettings } = useGlobalStore();

    return (
        <InspectorControls>
            <PanelBody
                title={__('Settings', 'code-block-pro')}
                initialOpen={true}>
                <div className="code-block-pro-editor">
                    <BaseControl id="code-block-pro-language">
                        <SelectControl
                            id="code-block-pro-language"
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
                    <Notice />
                </div>
            </PanelBody>
            <PanelBody
                title={__('Styling', 'code-block-pro')}
                initialOpen={false}>
                <div className="code-block-pro-editor">
                    <h2 className="m-0">{__('Font Size', 'code-block-pro')}</h2>
                    <FontSizeSelect
                        value={attributes.fontSize}
                        onChange={(fontSize) => {
                            setAttributes({ fontSize });
                            updateThemeHistory({ ...attributes, fontSize });
                        }}
                    />
                    <h2 className="m-0">
                        {__('Line Height', 'code-block-pro')}
                    </h2>
                    <FontLineHeightSelect
                        value={attributes.lineHeight}
                        onChange={(lineHeight) => {
                            setAttributes({ lineHeight });
                            updateThemeHistory({
                                ...attributes,
                                lineHeight,
                            });
                        }}
                    />
                    <FontFamilySelect
                        value={attributes.fontFamily}
                        onChange={(fontFamily) => {
                            setAttributes({ fontFamily });
                            updateThemeHistory({
                                ...attributes,
                                fontFamily,
                            });
                        }}
                    />
                </div>
            </PanelBody>
            <PanelBody
                title={__('Header Type', 'code-block-pro')}
                initialOpen={false}>
                <HeaderSelect
                    attributes={attributes}
                    onClick={(headerType: string) => {
                        console.log({ headerType });
                        setAttributes({ headerType });
                        updateThemeHistory({ ...attributes, headerType });
                    }}
                />
            </PanelBody>
            <PanelBody
                title={__('Themes', 'code-block-pro')}
                initialOpen={false}>
                <ThemeSelect
                    {...attributes}
                    onClick={(slug: Theme) => {
                        setAttributes({ theme: slug });
                        updateThemeHistory({ ...attributes, theme: slug });
                    }}
                />
            </PanelBody>
            <PanelBody
                title={__('Extra Settings', 'code-block-pro')}
                initialOpen={false}>
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
            </PanelBody>
        </InspectorControls>
    );
};
