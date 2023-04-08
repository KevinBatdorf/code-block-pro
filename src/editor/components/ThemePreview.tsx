import { useEffect, useRef, useState } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';
import { Theme } from 'shiki';
import { useTheme } from '../../hooks/useTheme';
import { CustomStyles, Lang } from '../../types';
import { fontFamilyLong, maybeClamp } from '../../util/fonts';

type ThemePreviewProps = {
    id: string;
    theme: Theme;
    lang: Lang;
    code: string;
    fontSize: string;
    lineHeight: string;
    fontFamily: string;
    clampFonts: boolean;
    styles?: CustomStyles;
    onClick: () => void;
};
export const ThemePreview = ({
    id,
    theme,
    lang,
    onClick,
    code,
    fontSize,
    lineHeight,
    fontFamily,
    clampFonts,
    styles,
}: ThemePreviewProps) => {
    const [inView, setInView] = useState(false);
    const { highlighter, error, loading } = useTheme({
        theme,
        // If no code is written yet, show a classic Carmack snippet
        lang: code ? lang : 'c',
        ready: inView,
    });
    const [codeRendered, setCode] = useState('');
    const [backgroundColor, setBg] = useState('#ffffff');
    const observer = useRef<IntersectionObserver>(
        new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setInView(true);
                observer.current.disconnect();
            }
        }),
    );
    const codeSnippet = `
float Q_rsqrt( float number )
{
    long i;
    float x2, y;
    const float threehalfs = 1.5F;

    x2 = number * 0.5F;
    y  = number;
    i  = * ( long * ) &y;                       // evil floating point bit level hacking
    i  = 0x5f3759df - ( i >> 1 );               // what the frack?
    y  = * ( float * ) &i;
    y  = y * ( threehalfs - ( x2 * y * y ) );   // 1st iteration
//  y  = y * ( threehalfs - ( x2 * y * y ) );   // 2nd iteration, this can be removed

    return y;
}`.trim();

    useEffect(() => {
        if (!highlighter) return;
        if ((lang as string) === 'ansi' && code) {
            setCode(highlighter.ansiToHtml(code));
            setBg(highlighter.getBackgroundColor());
            return;
        }
        const hl = code
            ? highlighter.codeToHtml(decodeEntities(code), { lang })
            : highlighter.codeToHtml(decodeEntities(codeSnippet), {
                  lang: 'c',
              });
        setCode(hl);
        setBg(highlighter.getBackgroundColor());
    }, [highlighter, lang, code, codeSnippet]);
    return (
        <button
            id={id}
            type="button"
            onClick={onClick}
            className="cbp-theme-preview p-4 px-3 border flex items-start w-full text-left outline-none cursor-pointer no-underline ring-offset-2 ring-offset-white focus:shadow-none focus:ring-wp overflow-x-auto max-h-80 overflow-y-hidden"
            style={{
                backgroundColor,
                minHeight: '50px',
                ...Object.entries(styles ?? {}).reduce(
                    (acc, [key, value]) => ({
                        ...acc,
                        [`--shiki-${key}`]: value,
                    }),
                    {},
                ),
            }}>
            {loading || error || !inView ? (
                <span
                    id={id}
                    ref={(el) => {
                        if (!el) return;
                        observer.current.observe(el);
                    }}
                    style={{ minHeight: '200px' }}
                    className="flex items-center justify-center p-6 w-full">
                    {error?.message || __('Loading...', 'code-block-pro')}
                </span>
            ) : (
                <span
                    className="pointer-events-none"
                    style={{
                        fontSize: maybeClamp(fontSize, clampFonts),
                        fontFamily: fontFamilyLong(fontFamily),
                        lineHeight: maybeClamp(lineHeight, clampFonts),
                    }}
                    dangerouslySetInnerHTML={{ __html: codeRendered }}
                />
            )}
        </button>
    );
};
