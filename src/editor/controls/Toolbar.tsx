import { BlockControls } from '@wordpress/block-editor';
import {
    ToolbarGroup,
    ToolbarButton,
    Dropdown,
    Button,
    NavigableMenu,
    MenuItem,
    MenuGroup,
} from '@wordpress/components';
import { applyFilters } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';
import defaultThemes from '../../defaultThemes.json';
import { useLanguage } from '../../hooks/useLanguage';
import { useGlobalStore } from '../../state/global';
import { AttributesPropsAndSetter, Lang, ThemeOption } from '../../types';
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
type LanguageSetterAndGetter = {
    language: Lang;
    setLanguage: (language: Lang) => void;
};
const DropdownLanguageSelect = ({
    language,
    setLanguage,
}: LanguageSetterAndGetter) => (
    <NavigableMenu
        orientation="vertical"
        role="menu"
        style={{
            minWidth: '200px',
        }}>
        <MenuGroup label={__('Select language', 'code-block-pro')}>
            {Object.entries(languages).map(([value, label]) => (
                <MenuItem
                    key={value}
                    role="menuitem"
                    style={{ width: '100%' }}
                    isSelected={language === value}
                    variant={language === value ? 'primary' : undefined}
                    onClick={() => {
                        setLanguage(value as Lang);
                    }}>
                    {label}
                </MenuItem>
            ))}
        </MenuGroup>
    </NavigableMenu>
);
