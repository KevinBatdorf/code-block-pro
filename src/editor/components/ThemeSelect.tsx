import { BaseControl } from '@wordpress/components';
import { applyFilters } from '@wordpress/hooks';
import { sprintf, __ } from '@wordpress/i18n';
import { Lang, Theme } from 'shiki';
import defaultThemes from '../../defaultThemes.json';
import { useSettingsStore } from '../../state/settings';
import { ThemePreview } from '../components/ThemePreview';
import { Notice } from './Notice';

type ThemeSelectProps = {
    theme: Theme;
    language: Lang;
    code: string;
    fontSize: string;
    lineHeight: string;
    fontFamily: string;
    search: string;
    onClick: (slug: Theme) => void;
};
export const ThemeSelect = (props: ThemeSelectProps) => {
    const { hiddenThemes } = useSettingsStore();
    const themes = applyFilters(
        'blocks.codeBlockPro.themes',
        defaultThemes,
    ) as Record<string, { name: string; priority?: boolean }>;
    const themesSorted = Object.entries(themes)
        .filter(([slug]) => !hiddenThemes.includes(slug))
        .filter(([slug]) => slug.includes(props.search.toLocaleLowerCase()))
        .map(([slug, { name, priority }]) => ({ name, slug, priority }))
        .sort((a, b) => (a.priority === b.priority ? 0 : a.priority ? -1 : 1));

    return (
        <div className="code-block-pro-editor">
            {themesSorted.map(({ name, slug }) => (
                <ThemeItem key={slug} slug={slug} name={name} {...props} />
            ))}
            <BaseControl id="add-on-themes">
                <Notice
                    seenKey={'add-on-themes'}
                    href="https://code-block-pro.com"
                    callback={console.log}
                    message={'Click here for more themes'}
                />
            </BaseControl>
        </div>
    );
};

const ThemeItem = ({
    slug,
    name,
    theme,
    language,
    code,
    fontSize,
    lineHeight,
    fontFamily,
    onClick,
}: { slug: string; name: string } & ThemeSelectProps) => (
    <BaseControl
        id={`code-block-pro-theme-${slug}`}
        label={
            theme === slug
                ? sprintf(__('%s (current)', 'code-block-pro'), name)
                : name
        }>
        <ThemePreview
            id={`code-block-pro-theme-${slug}`}
            theme={slug as Theme}
            lang={language}
            fontSize={fontSize}
            lineHeight={lineHeight}
            fontFamily={fontFamily}
            onClick={() => {
                onClick(slug as Theme);
            }}
            code={code}
        />
    </BaseControl>
);
