import { PanelBody } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Theme } from 'shiki';
import { useSettingsStoreReady } from '../../state/settings';
import { useThemeStore } from '../../state/theme';
import { AttributesPropsAndSetter } from '../../types';
import { ThemeFilter } from './ThemeFilter';
import { ThemeSelect } from './ThemeSelect';

export const ThemesPanel = ({
    bringAttentionToThemes,
    attributes,
    setAttributes,
}: AttributesPropsAndSetter & { bringAttentionToThemes?: boolean }) => {
    const { updateThemeHistory } = useThemeStore();
    const [search, setSearch] = useState<string>('');
    const ready = useSettingsStoreReady();
    return (
        <PanelBody
            title={__('Theme', 'code-block-pro')}
            initialOpen={bringAttentionToThemes ?? false}>
            {ready && <ThemeFilter search={search} setSearch={setSearch} />}
            {ready && (
                <ThemeSelect
                    {...attributes}
                    search={search}
                    onClick={(theme: Theme) => {
                        setAttributes({ theme });
                        updateThemeHistory({ theme });
                    }}
                />
            )}
        </PanelBody>
    );
};
