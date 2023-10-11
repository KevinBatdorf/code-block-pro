import { BlockControls } from '@wordpress/block-editor';
import { ToolbarGroup, ToolbarButton } from '@wordpress/components';
import { applyFilters } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';
import defaultThemes from '../../defaultThemes.json';
import { useCanEditHTML } from '../../hooks/useCanEditHTML';
import { useLanguage } from '../../hooks/useLanguage';
import { useGlobalStore } from '../../state/global';
import { AttributesPropsAndSetter, ThemeOption } from '../../types';
import { languages } from '../../util/languages';

export const ToolbarControls = ({
    attributes,
    setAttributes,
}: AttributesPropsAndSetter) => {
    const [language] = useLanguage({ attributes, setAttributes });
    const { theme, bgColor, textColor } = attributes;
    const themes = applyFilters(
        'blocks.codeBlockPro.themes',
        defaultThemes,
    ) as ThemeOption;
    const { setBringAttentionToPanel } = useGlobalStore();
    const canEdit = useCanEditHTML();

    if (canEdit === undefined) return null;

    return (
        <BlockControls>
            <ToolbarGroup className="code-block-pro-editor">
                <ToolbarButton
                    icon={() =>
                        (languages[language] ?? language)?.replace(
                            'ANSI',
                            'ANSI (experimental)',
                        )
                    }
                    onClick={() => setBringAttentionToPanel('language-select')}
                    label={__('Press to open sidebar panel', 'code-block-pro')}
                />
            </ToolbarGroup>
            {themes[theme]?.name && (
                <ToolbarGroup className="code-block-pro-editor">
                    <ToolbarButton
                        icon={() => themes[theme]?.name}
                        onClick={() => setBringAttentionToPanel('theme-select')}
                        label={__(
                            'Press to open sidebar panel',
                            'code-block-pro',
                        )}>
                        <span className="flex mx-2">
                            <span
                                style={{
                                    backgroundColor:
                                        themes[theme]?.styles?.[
                                            'color-background'
                                        ] ?? bgColor,
                                }}
                                className="w-3 h-3 border border-gray-400 border-solid border-1 rounded-full inline-block"
                            />
                            <span
                                style={{
                                    backgroundColor:
                                        themes[theme]?.styles?.['color-text'] ??
                                        textColor,
                                }}
                                className="w-3 h-3 border border-gray-400 border-solid border-1 rounded-full inline-block transform -translate-x-1"
                            />
                        </span>
                    </ToolbarButton>
                </ToolbarGroup>
            )}
        </BlockControls>
    );
};
