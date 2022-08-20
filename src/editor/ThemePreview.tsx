import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Lang, Theme } from 'shiki';
import { useTheme } from '../hooks/useTheme';

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
    const { highlighter, error, loading } = useTheme({ theme, lang });
    const [codeRendered, setCode] = useState('');
    const [backgroundColor, setBg] = useState('#ffffff');
    useEffect(() => {
        if (!highlighter) return;
        setCode(highlighter.codeToHtml(code ?? "const foo = 'bar';", { lang }));
        setBg(highlighter.getBackgroundColor());
    }, [highlighter, lang, code]);

    if (loading || error) {
        return (
            <div
                style={{ minHeight: '250px' }}
                className="flex items-center justify-center p-6 bg-gray-50">
                {__('Loading...', 'code-block-pro')}
            </div>
        );
    }
    return (
        <button
            type="button"
            onClick={onClick}
            className="p-4 px-3 border flex items-start w-full text-left outline-none cursor-pointer no-underline ring-offset-2 ring-offset-white focus:shadow-none focus:ring-wp overflow-hidden"
            style={{ backgroundColor, minHeight: '250px' }}>
            <span
                className="pointer-events-none"
                dangerouslySetInnerHTML={{ __html: codeRendered }}
            />
        </button>
    );
};
