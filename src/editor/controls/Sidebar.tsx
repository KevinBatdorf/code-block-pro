import { InspectorControls } from '@wordpress/block-editor';
import {
    PanelBody,
    BaseControl,
    SelectControl,
    CheckboxControl,
} from '@wordpress/components';
import { sprintf, __ } from '@wordpress/i18n';
import { Theme } from 'shiki';
import defaultThemes from '../../defaultThemes.json';
import { useLanguage } from '../../hooks/useLanguage';
import { useGlobalStore } from '../../state/global';
import { useThemeStore } from '../../state/theme';
import { AttributesPropsAndSetter } from '../../types';
import { languages } from '../../util/languages';
import { Notice } from '../components/Notice';
import { ThemePreview } from '../components/ThemePreview';

export const SidebarControls = ({
    attributes,
    setAttributes,
}: AttributesPropsAndSetter) => {
    const [language, setLanguage] = useLanguage({ attributes, setAttributes });
    const { setPreviousTheme } = useThemeStore();
    const { setPreviousSettings } = useGlobalStore();

    return (
        <InspectorControls>
            <PanelBody
                title={__('Settings', 'code-block-pro')}
                initialOpen={true}>
                <div className="code-block-pro-editor">
                    <BaseControl id="code-block-pro-settings">
                        <SelectControl
                            label={__('Language', 'code-block-pro')}
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
                                id={`code-block-pro-theme-${slug}`}
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
