import { useEffect, useRef } from '@wordpress/element'
import { __ } from '@wordpress/i18n'
import Editor from 'react-simple-code-editor'
import { useTheme } from '../hooks/useTheme'
import { AttributesPropsAndSetter } from '../types'

export const Edit = ({
    attributes,
    setAttributes,
}: AttributesPropsAndSetter) => {
    const {
        theme = 'nord',
        language: lang = 'javascript',
        code = '',
        bgColor: backgroundColor,
        textColor: color,
    } = attributes
    const textAreaRef = useRef<HTMLDivElement>(null)
    const handleChange = (code: string) => setAttributes({ code })
    const { highlighter, error, loading } = useTheme({ theme, lang })

    useEffect(() => {
        if (!highlighter) return
        setAttributes({
            bgColor: highlighter.getBackgroundColor(),
            textColor: highlighter.getForegroundColor(),
        })
    }, [theme, highlighter, setAttributes])

    useEffect(() => {
        if (!highlighter) return
        setAttributes({ codeHTML: highlighter.codeToHtml(code, { lang }) })
    }, [highlighter, code, lang, setAttributes])

    if (loading || error) {
        return (
            <div
                className="p-8 px-6 text-center"
                style={{ backgroundColor, color }}>
                {error?.message ?? __('Loading...', 'code-block-pro')}
            </div>
        )
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
                        ?.codeToHtml(code, { lang })
                        ?.replace(/<\/?[pre|code][^>]*>/g, '')
                }
            />
        </div>
    )
}
