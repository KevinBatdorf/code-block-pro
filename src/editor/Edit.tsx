import { useEffect, useRef } from '@wordpress/element';
import { applyFilters } from '@wordpress/hooks';
import Editor from 'react-simple-code-editor';
import { useDefaults } from '../hooks/useDefaults';
import { useTheme } from '../hooks/useTheme';
import { useGlobalStore } from '../state/global';
import { useLanguageStore } from '../state/language';
import { useThemeStore } from '../state/theme';
import { AttributesPropsAndSetter } from '../types';

export const Edit = ({
    attributes,
    setAttributes,
}: AttributesPropsAndSetter) => {
    const {
        language,
        theme,
        code = '',
        bgColor: backgroundColor,
        textColor: color,
        disablePadding,
    } = attributes;
    const textAreaRef = useRef<HTMLDivElement>(null);
    const handleChange = (code: string) => setAttributes({ code });
    const { previousLanguage } = useLanguageStore();
    const { highlighter, error, loading } = useTheme({
        theme,
        lang: language ?? previousLanguage,
    });
    useDefaults({ attributes, setAttributes });

    useEffect(() => {
        if (!highlighter) return;
        setAttributes({
            bgColor: highlighter.getBackgroundColor(),
            textColor: highlighter.getForegroundColor(),
        });
    }, [theme, highlighter, setAttributes]);

    useEffect(() => {
        if (!highlighter) return;
        // applyFilters()
        setAttributes({
            codeHTML: applyFilters(
                'blocks.codeBlockPro.codeHTML',
                highlighter.codeToHtml(code, {
                    lang: language ?? previousLanguage,
                }),
                attributes,
            ) as string,
        });
    }, [
        highlighter,
        code,
        language,
        setAttributes,
        previousLanguage,
        attributes,
    ]);

    if ((loading && code) || error) {
        return (
            <div
                className="p-8 px-4 text-left"
                style={{ backgroundColor, color }}>
                {error?.message ?? ''}
            </div>
        );
    }

    return (
        <div ref={textAreaRef}>
            <Editor
                value={code}
                onValueChange={handleChange}
                padding={disablePadding ? 0 : 16}
                style={{ backgroundColor, color }}
                // eslint-disable-next-line
                onKeyDown={(e: any) =>
                    e.key === 'Tab' &&
                    // Tab lock here. Pressing Escape will unlock.
                    textAreaRef.current?.querySelector('textarea')?.focus()
                }
                highlight={(code: string) =>
                    highlighter
                        ?.codeToHtml(code, {
                            lang: language ?? previousLanguage,
                        })
                        ?.replace(/<\/?[pre|code][^>]*>/g, '')
                }
            />
        </div>
    );
};
