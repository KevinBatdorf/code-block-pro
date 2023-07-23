import { BaseControl, ExternalLink } from '@wordpress/components';
import { applyFilters } from '@wordpress/hooks';
import { sprintf, __ } from '@wordpress/i18n';
import { Theme } from 'shiki';
import defaultThemes from '../../defaultThemes.json';
import { useSettingsStore } from '../../state/settings';
import { CustomStyles, HelpUrl, Lang, ThemeOption } from '../../types';
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
    tabSize: number;
    onClick: (slug: Theme) => void;
};
export const ThemeSelect = (props: ThemeSelectProps) => {
    const { hiddenThemes } = useSettingsStore();
    const themes = applyFilters(
        'blocks.codeBlockPro.themes',
        defaultThemes,
    ) as ThemeOption;
    const themesSorted = Object.entries(themes)
        .filter(([slug]) => !hiddenThemes.includes(slug))
        .filter(([slug]) => slug.includes(props.search.toLocaleLowerCase()))
        .map(([slug, data]) => ({ slug, ...data }))
        // Put priority themes at the top
        .sort((a, b) => (a.priority === b.priority ? 0 : a.priority ? -1 : 1))
        // then put custom themes above that
        .sort((a, b) => (a.custom === b.custom ? 0 : a.custom ? -1 : 1));

    const priorityThemes = getPriorityThemes();

    return (
        <div
            className="code-block-pro-editor"
            style={{ tabSize: props.tabSize }}>
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
            ) : priorityThemes?.length > 0 ? null : (
                <div className="text-sm mb-4">
                    <ExternalLink href="https://github.com/KevinBatdorf/code-block-pro/discussions/168">
                        {__('Need both light and dark mode?', 'code-block-pro')}
                    </ExternalLink>
                </div>
            )}
            {themesSorted.slice(0, 9).map((data) => (
                <ThemeItem key={data.slug} {...data} {...props} />
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
            {themesSorted.slice(9).map((data) => (
                <ThemeItem key={data.slug} {...data} {...props} />
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
    styles,
    helpUrl,
}: {
    slug: string;
    name: string;
    styles?: CustomStyles;
    helpUrl?: HelpUrl;
} & ThemeSelectProps) => (
    <BaseControl
        id={`code-block-pro-theme-${slug}`}
        label={
            theme === slug
                ? sprintf(__('%s (current)', 'code-block-pro'), name)
                : name
        }>
        <>
            <ThemePreview
                id={`code-block-pro-theme-${slug}`}
                theme={slug as Theme}
                lang={language}
                fontSize={fontSize}
                lineHeight={lineHeight}
                fontFamily={fontFamily}
                clampFonts={clampFonts}
                styles={styles}
                onClick={() => {
                    onClick(slug as Theme);
                }}
                code={code}
            />
            {helpUrl?.url ? (
                <div className="mt-2">
                    <ExternalLink href={helpUrl.url}>
                        {helpUrl?.text || __('Read more', 'code-block-pro')}
                    </ExternalLink>
                </div>
            ) : null}
        </>
    </BaseControl>
);
