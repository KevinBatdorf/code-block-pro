import {
    useCallback,
    useEffect,
    useLayoutEffect,
    useRef,
} from '@wordpress/element';
import { escapeHTML } from '@wordpress/escape-html';
import { applyFilters } from '@wordpress/hooks';
import { decodeEntities } from '@wordpress/html-entities';
import { sprintf, __ } from '@wordpress/i18n';
import Editor from 'react-simple-code-editor';
import { useDefaults } from '../hooks/useDefaults';
import { useTheme } from '../hooks/useTheme';
import { useLanguageStore } from '../state/language';
import { AttributesPropsAndSetter, Lang } from '../types';
import { parseJSONArrayWithRanges } from '../util/arrayHelpers';
import { computeLineHighlightColor } from '../util/colors';
import { getEditorLanguage } from '../util/languages';
import { MissingPermissionsTip } from './components/misc/MissingPermissions';

export const Edit = ({
    attributes,
    setAttributes,
    canEdit,
}: AttributesPropsAndSetter & { canEdit: boolean }) => {
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
        seeMoreAfterLine,
        seeMoreTransition,
        enableMaxHeight,
        editorHeight,
    } = attributes;

    const textAreaRef = useRef<HTMLDivElement>(null);
    const handleChange = (code: string) =>
        setAttributes({ code: escapeHTML(code) });
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
        const l = (language ?? previousLanguage) as Lang | 'ansi';
        const lang = getEditorLanguage(l);
        const c = decodeEntities(code);
        const lineOptions = [
            ...getHighlights(),
            ...getBlurs(),
            enableMaxHeight && !Number.isNaN(seeMoreAfterLine)
                ? {
                      line: Number(seeMoreAfterLine),
                      classes: [
                          'cbp-see-more-line',
                          seeMoreTransition ? 'cbp-see-more-transition' : '',
                      ],
                  }
                : {},
        ];
        const rendered =
            l === 'ansi'
                ? highlighter.ansiToHtml(c, { lineOptions })
                : highlighter.codeToHtml(c, { lang, lineOptions });
        const codeHTML = applyFilters(
            'blocks.codeBlockPro.codeHTML',
            rendered,
            attributes,
        ) as string;
        const lineHighlightColor = computeLineHighlightColor(color, attributes);
        setAttributes({ codeHTML, lineHighlightColor });
    }, [
        highlighter,
        seeMoreAfterLine,
        seeMoreTransition,
        color,
        code,
        enableMaxHeight,
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

    if (!loading && !highlighter) {
        return (
            <div
                className="px-4 text-left flex items-center"
                style={{ backgroundColor, color, minHeight: 36 }}>
                {sprintf(
                    __(
                        'Theme %s not found. Please select a different theme.',
                        'code-block-pro',
                    ),
                    theme,
                )}
            </div>
        );
    }

    if ((loading && code) || error) {
        return (
            <div
                className="px-4 text-left flex items-center"
                style={{ backgroundColor, color, minHeight: 36 }}>
                {error?.message ?? ''}
            </div>
        );
    }

    return (
        <div
            ref={textAreaRef}
            style={{
                maxHeight: Number(editorHeight)
                    ? Number(editorHeight)
                    : undefined,
                overflow: Number(editorHeight) ? 'auto' : undefined,
            }}>
            {canEdit ? null : (
                <div className="absolute inset-0 z-10 bg-white bg-opacity-70">
                    <MissingPermissionsTip />
                </div>
            )}
            <Editor
                value={decodeEntities(code)}
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
                style={{
                    backgroundColor,
                    color,
                    minHeight: canEdit ? undefined : 200,
                }}
                // eslint-disable-next-line
                onKeyDown={(e: any) =>
                    e.key === 'Tab' &&
                    // Tab lock here. Pressing Escape will unlock.
                    textAreaRef.current?.querySelector('textarea')?.focus()
                }
                highlight={(code: string) =>
                    highlighter
                        ?.codeToHtml(decodeEntities(code), {
                            lang: getEditorLanguage(
                                language ?? previousLanguage,
                            ),
                            lineOptions: [...getHighlights(), ...getBlurs()],
                        })
                        ?.replace(/<\/?[pre|code][^>]*>/g, '')
                }
            />
        </div>
    );
};
