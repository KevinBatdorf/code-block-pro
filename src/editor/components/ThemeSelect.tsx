import { BaseControl } from '@wordpress/components';
import { sprintf, __ } from '@wordpress/i18n';
import { Lang, Theme } from 'shiki';
import defaultThemes from '../../defaultThemes.json';
import { useThemeStore } from '../../state/theme';
import { ThemePreview } from '../components/ThemePreview';

type ThemeSelectProps = {
    theme: Theme;
    language: Lang;
    code: string;
    onClick: (slug: Theme) => void;
};
export const ThemeSelect = ({
    theme,
    language,
    code,
    onClick,
}: ThemeSelectProps) => {
    const setPreviousTheme = (theme: Theme) =>
        useThemeStore.setState({ previousTheme: theme });
    return (
        <div className="code-block-pro-editor">
            {Object.entries(defaultThemes).map(([slug, name]) => (
                <BaseControl
                    id={`code-block-pro-theme-${slug}`}
                    label={
                        theme === slug
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
                            onClick(slug as Theme);
                            setPreviousTheme(theme);
                        }}
                        code={code}
                    />
                </BaseControl>
            ))}
        </div>
    );
};
