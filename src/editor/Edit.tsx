import {
    useCallback,
    useEffect,
    useLayoutEffect,
    useRef,
} from '@wordpress/element';
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
        enableBlurring,
        enableHighlighting,
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

    const getHighlights = useCallback(() => {
        if (!enableHighlighting) return [];
        return parseJSONArrayWithRanges(lineHighlights, startingLineNumber).map(
            (line: number) => ({
                line,
                classes: ['cbp-line-highlight'],
            }),
        );
    }, [enableHighlighting, lineHighlights, startingLineNumber]);
    const getBlurs = useCallback(() => {
        if (!enableBlurring) return [];
        return parseJSONArrayWithRanges(lineBlurs, startingLineNumber).map(
            (line: number) => ({
                line,
                classes: ['cbp-no-blur'],
            }),
        );
    }, [enableBlurring, lineBlurs, startingLineNumber]);

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
                    lineOptions: [...getHighlights(), ...getBlurs()],
                }),
                attributes,
            ) as string,
            lineHighlightColor: colord(color)
                .saturate(0.5)
                .alpha(0.2)
                .toRgbString(),
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
        getBlurs,
        getHighlights,
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
        // Add .cbp-line-number-disabled to disable the line number
        lastLine?.classList.add('cbp-line-number-disabled');
        // Re calculate the width of the last line
        const newWidth = lastLine?.getBoundingClientRect()?.width ?? 0;
        // Remove the classes
        lastLine?.classList.remove('cbp-line-number-disabled');
        lastLine?.classList?.remove('cbp-line-number-width-forced');
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
                    left: (() => {
                        if (!lineNumbers && disablePadding) return 0;
                        if (!lineNumbers) return 16;
                        if (disablePadding) return (lineNumbersWidth ?? 0) + 16;
                        return (lineNumbersWidth ?? 0) + 32;
                    })(),
                    right: 0,
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
                            lineOptions: [...getHighlights(), ...getBlurs()],
                        })
                        ?.replace(/<\/?[pre|code][^>]*>/g, '')
                }
            />
        </div>
    );
};
