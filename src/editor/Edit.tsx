import {
    useCallback,
    useState,
    useEffect,
    useLayoutEffect,
    useRef,
} from '@wordpress/element';
import { applyFilters } from '@wordpress/hooks';
import { sprintf, __ } from '@wordpress/i18n';
import Editor from 'react-simple-code-editor';
import { useCanEditHTML } from '../hooks/useCanEditHTML';
import { useDefaults } from '../hooks/useDefaults';
import { useTheme } from '../hooks/useTheme';
import { useLanguageStore } from '../state/language';
import { AttributesPropsAndSetter, Lang } from '../types';
import { parseJSONArrayWithRanges } from '../util/arrayHelpers';
import { decode, encode } from '../util/code';
import { computeLineHighlightColor } from '../util/colors';
import { getTextWidth } from '../util/fonts';
import { getEditorLanguage } from '../util/languages';
import { MissingPermissionsTip } from './components/misc/MissingPermissions';

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
        lineNumbers,
        startingLineNumber,
        footerType,
        fontSize,
        lineBlurs,
        lineHighlights,
        enableBlurring,
        enableHighlighting,
        seeMoreAfterLine,
        seeMoreTransition,
        enableMaxHeight,
        editorHeight,
        useDecodeURI,
        tabSize,
        useTabs,
    } = attributes;

    const textAreaRef = useRef<HTMLDivElement>(null);
    const canEdit = useCanEditHTML();
    const [editorLeftPadding, setEditorLeftPadding] = useState(0);
    const codeAreaRef = useRef<HTMLDivElement>(null);
    const handleChange = (code: string) =>
        setAttributes({ code: encode(code, attributes) });
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
    }, [theme, highlighter, setAttributes, canEdit]);

    useEffect(() => {
        if (!highlighter) return;
        const l = (language ?? previousLanguage) as Lang | 'ansi';
        const lang = getEditorLanguage(l);
        const c = decode(code, { useDecodeURI });
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
        canEdit,
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
        useDecodeURI,
    ]);

    useLayoutEffect(() => {
        if (!codeAreaRef.current) return;
        if (!lineNumbers) {
            setAttributes({ lineNumbersWidth: undefined });
            return;
        }

        // Calulate the line numbers width
        const codeLines = codeAreaRef?.current?.querySelectorAll('.line');
        const highestLineNumber =
            Number(startingLineNumber ?? 0) + (codeLines?.length ?? 0);
        if (!codeLines?.[0]) return;
        setAttributes({ highestLineNumber });

        // Used for the editor, which requires px values
        const { font } = getComputedStyle(codeLines?.[0]);
        setEditorLeftPadding(getTextWidth(String(highestLineNumber), font));
    }, [
        lineNumbers,
        startingLineNumber,
        code,
        loading,
        canEdit,
        error,
        textAreaRef,
        codeAreaRef,
        setAttributes,
        fontSize,
        loading,
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

    if (canEdit === undefined) return null;

    return (
        <div
            ref={codeAreaRef}
            style={{
                maxHeight: Number(editorHeight)
                    ? Number(editorHeight)
                    : undefined,
                overflow: Number(editorHeight) ? 'auto' : undefined,
            }}>
            {canEdit ? null : (
                <div className="absolute inset-0 z-10">
                    <MissingPermissionsTip />
                </div>
            )}
            <Editor
                value={decode(code, { useDecodeURI })}
                onValueChange={handleChange}
                // eslint-disable-next-line jsx-a11y/no-autofocus -- Only autofocus in the unintended case that there is no code (e.g. on initial insert)
                autoFocus={!code}
                tabSize={useTabs ? 1 : tabSize || 2}
                insertSpaces={!useTabs}
                padding={{
                    top: disablePadding ? 0 : 16,
                    bottom: disablePadding || hasFooter ? 0 : 16,
                    left: (() => {
                        if (!lineNumbers && disablePadding) return 0;
                        if (!lineNumbers) return 16;
                        if (disablePadding)
                            return (editorLeftPadding ?? 0) + 16;
                        return (editorLeftPadding ?? 0) + 32;
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
                    codeAreaRef.current?.querySelector('textarea')?.focus()
                }
                highlight={(code: string) =>
                    highlighter
                        ?.codeToHtml(decode(code, { useDecodeURI }), {
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
