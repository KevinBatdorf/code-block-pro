import { BaseControl, ExternalLink } from '@wordpress/components';
import { applyFilters } from '@wordpress/hooks';
import { sprintf, __ } from '@wordpress/i18n';
import { Theme } from 'shiki';
import defaultThemes from '../../defaultThemes.json';
import { useSettingsStore } from '../../state/settings';
import { Lang } from '../../types';
import { getPriorityThemes } from '../../util/themes';
import { ThemePreview } from '../components/ThemePreview';

type ThemeSelectProps = {
    theme: Theme;
    language: Lang;
    code: string;
    fontSize: string;
    lineHeight: string;
    fontFamily: string;
    search: string;
    clampFonts: boolean;
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

    const priorityThemes = getPriorityThemes();

    return (
        <div className="code-block-pro-editor">
            {props.search?.length > 0 ? (
                <BaseControl id="add-on-themes">
                    {priorityThemes?.length > 0 ? null : (
                        <div className="font-semibold text-base">
                            <ExternalLink href="https://code-block-pro.com/?utm_campaign=notice&utm_source=search">
                                {__(
                                    'Get 25+ more themes here',
                                    'code-block-pro',
                                )}
                            </ExternalLink>
                        </div>
                    )}
                </BaseControl>
            ) : null}
            {themesSorted.slice(0, 9).map(({ name, slug }) => (
                <ThemeItem key={slug} slug={slug} name={name} {...props} />
            ))}
            {props.search?.length > 0 ? null : (
                <BaseControl id="add-on-themes">
                    {priorityThemes?.length > 0 ? null : (
                        <div className="font-semibold text-base">
                            <ExternalLink href="https://code-block-pro.com/themes?utm_campaign=notice&utm_source=mid-themes">
                                {__(
                                    'Get 25+ more themes here',
                                    'code-block-pro',
                                )}
                            </ExternalLink>
                        </div>
                    )}
                </BaseControl>
            )}
            {themesSorted.slice(9).map(({ name, slug }) => (
                <ThemeItem key={slug} slug={slug} name={name} {...props} />
            ))}
            {props.search?.length > 0 ? null : (
                <BaseControl id="add-on-themes">
                    {priorityThemes?.length > 0 ? null : (
                        <div className="font-semibold text-base">
                            <ExternalLink href="https://code-block-pro.com/themes?utm_campaign=notice&utm_source=below-themes">
                                {__(
                                    'Get 25+ more themes here',
                                    'code-block-pro',
                                )}
                            </ExternalLink>
                        </div>
                    )}
                </BaseControl>
            )}
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
    clampFonts,
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
            clampFonts={clampFonts}
            onClick={() => {
                onClick(slug as Theme);
            }}
            code={code}
        />
    </BaseControl>
);
