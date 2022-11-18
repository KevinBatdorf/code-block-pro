import { useEffect, useLayoutEffect, useRef } from '@wordpress/element';
import { applyFilters } from '@wordpress/hooks';
import { colord } from 'colord';
import Editor from 'react-simple-code-editor';
import { useDefaults } from '../hooks/useDefaults';
import { useTheme } from '../hooks/useTheme';
import { useLanguageStore } from '../state/language';
import { AttributesPropsAndSetter } from '../types';
import { parseJSONArrayWithRanges } from '../util/arrayHelpers';

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
        lineNumbersWidth,
        lineNumbers,
        startingLineNumber,
        footerType,
        fontSize,
        fontFamily,
        lineHeight,
        lineBlurs,
        lineHighlights,
    } = attributes;
    const textAreaRef = useRef<HTMLDivElement>(null);
    const handleChange = (code: string) => setAttributes({ code });
    const { previousLanguage } = useLanguageStore();
    const { highlighter, error, loading } = useTheme({
        theme,
        lang: language ?? previousLanguage,
    });
    const hasFooter = footerType && footerType !== 'none';
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
        setAttributes({
            codeHTML: applyFilters(
                'blocks.codeBlockPro.codeHTML',
                highlighter.codeToHtml(code, {
                    lang: language ?? previousLanguage,
                    lineOptions: [
                        ...parseJSONArrayWithRanges(lineHighlights).map(
                            (line: number) => ({
                                line,
                                classes: ['cbp-line-highlight'],
                            }),
                        ),
                        ...parseJSONArrayWithRanges(lineBlurs).map(
                            (line: number) => ({
                                line,
                                classes: ['cbp-no-blur'],
                            }),
                        ),
                    ],
                }),
                attributes,
            ) as string,
            lineHighlightColor: colord(color).alpha(0.2).toRgbString(),
        });
    }, [
        highlighter,
        color,
        code,
        language,
        setAttributes,
        previousLanguage,
        attributes,
        lineHighlights,
        lineBlurs,
    ]);

    useLayoutEffect(() => {
        if (!textAreaRef.current) return;
        if (!lineNumbers) {
            setAttributes({ lineNumbersWidth: undefined });
            return;
        }
        // Get the last line (assumingly the widest)
        const lastLine = Array.from(
            textAreaRef?.current?.querySelectorAll('.line') ?? [],
        )?.at(-1) as HTMLElement;
        // Make sure there are no width constraints
        lastLine?.classList?.add('cbp-line-number-width-forced');
        const lastLineWidth = lastLine?.getBoundingClientRect()?.width ?? 0;
        // Remove the width constraints
        lastLine?.classList?.remove('cbp-line-number-width-forced');
        // Add .cbp-line-number-disabled to disable th eline number
        lastLine?.classList.add('cbp-line-number-disabled');
        // Re calculate the width of the last line
        const newWidth = lastLine?.getBoundingClientRect()?.width ?? 0;
        // Remove the class
        lastLine?.classList.remove('cbp-line-number-disabled');
        // Calculate the difference
        if (lastLineWidth - newWidth > 0) {
            setAttributes({ lineNumbersWidth: lastLineWidth - newWidth - 12 });
        }
    }, [
        lineNumbers,
        startingLineNumber,
        code,
        loading,
        error,
        textAreaRef,
        setAttributes,
        fontSize,
        fontFamily,
        lineHeight,
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
                padding={{
                    top: disablePadding ? 0 : 16,
                    bottom: disablePadding || hasFooter ? 0 : 16,
                    left:
                        (disablePadding ? 0 : 16) +
                        // If line numbers are disabled, just offset the 12px padding
                        (lineNumbersWidth ?? -12) +
                        12,
                    right: disablePadding ? 0 : 16,
                }}
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
