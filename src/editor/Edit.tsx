import { useEffect, useRef } from '@wordpress/element';
import { applyFilters } from '@wordpress/hooks';
import Editor from 'react-simple-code-editor';
import { Theme } from 'shiki';
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
        fontSize,
        lineHeight,
    } = attributes;
    const textAreaRef = useRef<HTMLDivElement>(null);
    const handleChange = (code: string) => setAttributes({ code });
    const { previousLanguage } = useLanguageStore();
    const { previousSettings } = useGlobalStore();
    const { previousTheme, previousFontSize, previousLineHeight } =
        useThemeStore();
    const { highlighter, error, loading } = useTheme({
        theme,
        lang: language ?? previousLanguage,
    });

    useEffect(() => {
        if (!attributes.copyButton) {
            setAttributes({ copyButton: previousSettings.copyButton });
        }
    }, [previousSettings, attributes, setAttributes]);

    useEffect(() => {
        if (theme || !previousTheme) return;
        setAttributes({ theme: previousTheme as Theme });
    }, [previousTheme, theme, setAttributes]);

    useEffect(() => {
        if (fontSize || !previousFontSize) return;
        setAttributes({ fontSize: previousFontSize });
    }, [previousFontSize, fontSize, setAttributes]);

    useEffect(() => {
        if (lineHeight || !previousLineHeight) return;
        setAttributes({ lineHeight: previousLineHeight });
    }, [previousLineHeight, lineHeight, setAttributes]);

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
                className="p-8 px-6 text-left"
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
                padding={24}
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
