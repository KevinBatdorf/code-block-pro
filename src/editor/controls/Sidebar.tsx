import { InspectorControls } from '@wordpress/block-editor';
import {
    PanelBody,
    BaseControl,
    SelectControl,
    CheckboxControl,
} from '@wordpress/components';
import { sprintf, __ } from '@wordpress/i18n';
import { Theme } from 'shiki';
import defaultLanguages from '../../defaultLanguages.json';
import defaultThemes from '../../defaultThemes.json';
import { useLanguage } from '../../hooks/useLanguage';
import { useThemeStore } from '../../state/theme';
import { AttributesPropsAndSetter } from '../../types';
import { Notice } from '../components/Notice';
import { ThemePreview } from '../components/ThemePreview';

export const SidebarControls = ({
    attributes,
    setAttributes,
}: AttributesPropsAndSetter) => {
    const [language, setLanguage] = useLanguage({ attributes, setAttributes });
    const { setPreviousTheme } = useThemeStore();
    return (
        <InspectorControls>
            <PanelBody
                title={__('Language', 'code-block-pro')}
                initialOpen={true}>
                <div className="code-block-pro-editor">
                    <BaseControl id="code-block-pro-settings">
                        <SelectControl
                            value={language}
                            onChange={setLanguage}
                            options={defaultLanguages.map((value) => ({
                                label: value,
                                value,
                            }))}
                        />
                    </BaseControl>
                    <Notice />
                </div>
            </PanelBody>
            <PanelBody
                title={__('Themes', 'code-block-pro')}
                initialOpen={true}>
                <div className="code-block-pro-editor">
                    {Object.entries(defaultThemes).map(([slug, name]) => (
                        <BaseControl
                            id={`code-block-pro-theme-${slug}`}
                            label={
                                attributes.theme === slug
                                    ? sprintf(
                                          __('%s (current)', 'code-block-pro'),
                                          name,
                                      )
                                    : name
                            }
                            key={slug}>
                            <ThemePreview
                                theme={slug as Theme}
                                lang={language}
                                onClick={() => {
                                    setAttributes({ theme: slug as Theme });
                                    setPreviousTheme(slug as Theme);
                                }}
                                code={attributes.code}
                            />
                        </BaseControl>
                    ))}
                </div>
            </PanelBody>
        </InspectorControls>
    );
};
