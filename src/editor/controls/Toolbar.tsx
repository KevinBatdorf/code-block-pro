import { BlockControls } from '@wordpress/block-editor';
import {
    ToolbarGroup,
    Dropdown,
    Button,
    NavigableMenu,
    MenuItem,
    MenuGroup,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Lang } from 'shiki';
import { useLanguage } from '../../hooks/useLanguage';
import { AttributesPropsAndSetter } from '../../types';
import { languages } from '../../util/languages';

export const ToolbarControls = ({
    attributes,
    setAttributes,
}: AttributesPropsAndSetter) => {
    const [language, setLanguage] = useLanguage({ attributes, setAttributes });
    return (
        <BlockControls>
            <ToolbarGroup className="code-block-pro-editor">
                <Dropdown
                    renderContent={() => (
                        <DropdownLanguageSelect
                            language={language}
                            setLanguage={setLanguage}
                        />
                    )}
                    renderToggle={({ isOpen, onToggle }) => (
                        <Button
                            onClick={onToggle}
                            aria-expanded={isOpen}
                            aria-haspopup="true">
                            {languages[language] ?? language}
                        </Button>
                    )}
                />
            </ToolbarGroup>
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
