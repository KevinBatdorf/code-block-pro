import { useEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import Editor from 'react-simple-code-editor';
import { useTheme } from '../hooks/useTheme';
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
    } = attributes;
    const textAreaRef = useRef<HTMLDivElement>(null);
    const handleChange = (code: string) => setAttributes({ code });
    const { previousLanguage } = useLanguageStore();
    const { previousTheme } = useThemeStore();
    const { highlighter, error, loading } = useTheme({
        theme,
        lang: language ?? previousLanguage,
    });

    useEffect(() => {
        if (theme) return;
        setAttributes({ theme: previousTheme });
    }, [previousTheme, theme, setAttributes]);

    useEffect(() => {
        if (!highlighter) return;
        setAttributes({
            bgColor: highlighter.getBackgroundColor(),
            textColor: highlighter.getForegroundColor(),
        });
    }, [theme, highlighter, setAttributes]);

    useEffect(() => {
        if (!highlighter) return;
        setAttributes({
            codeHTML: highlighter.codeToHtml(code, {
                lang: language ?? previousLanguage,
            }),
        });
    }, [highlighter, code, language, setAttributes, previousLanguage]);

    if ((loading && code) || error) {
        return (
            <div
                className="p-8 px-6 text-center"
                style={{ backgroundColor, color }}>
                {error?.message ?? __('Loading...', 'code-block-pro')}
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
