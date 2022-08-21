import { useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Lang, Theme } from 'shiki';
import { useTheme } from '../../hooks/useTheme';

type ThemePreviewProps = {
    theme: Theme;
    lang: Lang;
    code: string;
    onClick: () => void;
};
export const ThemePreview = ({
    theme,
    lang,
    onClick,
    code,
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
        const hl = code
            ? highlighter.codeToHtml(code, { lang })
            : highlighter.codeToHtml(codeSnippet, { lang: 'c' });
        setCode(hl);
        setBg(highlighter.getBackgroundColor());
    }, [highlighter, lang, code, codeSnippet]);

    if (loading || error || !inView) {
        return (
            <div
                ref={(el) => {
                    if (!el) return;
                    observer.current.observe(el);
                }}
                style={{ minHeight: '200px' }}
                className="flex items-center justify-center p-6 bg-gray-50">
                {error?.message || __('Loading...', 'code-block-pro')}
            </div>
        );
    }
    return (
        <button
            type="button"
            onClick={onClick}
            className="p-4 px-3 border flex items-start w-full text-left outline-none cursor-pointer no-underline ring-offset-2 ring-offset-white focus:shadow-none focus:ring-wp overflow-x-scroll"
            style={{ backgroundColor, minHeight: '50px' }}>
            <span
                className="pointer-events-none"
                dangerouslySetInnerHTML={{ __html: codeRendered }}
            />
        </button>
    );
};
