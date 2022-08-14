import {
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
} from '@wordpress/element'
import { __ } from '@wordpress/i18n'
import Editor from 'react-simple-code-editor'
import { getHighlighter, Highlighter, setCDN } from 'shiki'
import type { Attributes } from '..'

interface EditProps {
    attributes: Attributes
    setAttributes: (attributes: Attributes) => void
}
export const Edit = ({ attributes, setAttributes }: EditProps) => {
    const [highlighter, setHighlighter] = useState<Highlighter>()
    const [editorBg, setEditorBg] = useState<string>()
    const [cursorColor, setCursorColor] = useState<string>()
    const { theme, language, code = '' } = attributes
    const textAreaRef = useRef<HTMLDivElement>(null)
    const handleChange = (code: string) => {
        setAttributes({ ...attributes, code })
    }

    useLayoutEffect(() => {
        setCDN('https://unpkg.com/shiki/')
        getHighlighter({ theme: 'vitesse-light' }).then(setHighlighter)
    }, [theme])

    useEffect(() => {
        if (!highlighter) return
        setEditorBg(highlighter.getBackgroundColor())
        setCursorColor(highlighter.getForegroundColor())
    }, [theme, highlighter, attributes.codeHTML])

    useEffect(() => {
        if (!highlighter) return
        const html = highlighter.codeToHtml(code, {
            lang: language ?? 'js',
        })
        setAttributes({ ...attributes, codeHTML: html })
    }, [highlighter, code, attributes, language, setAttributes])

    return (
        <div className="code-block-pro-editor" ref={textAreaRef}>
            <Editor
                value={code}
                onValueChange={handleChange}
                padding={24}
                style={{
                    backgroundColor: editorBg,
                    color: cursorColor,
                }}
                onKeyDown={(e: KeyboardEvent) => {
                    if (!textAreaRef.current) return
                    if (e.key === 'Tab') {
                        // Tab lock here. Pressing Escape will unlock.
                        textAreaRef.current.querySelector('textarea')?.focus()
                    }
                }}
                highlight={(code: string) => {
                    if (!highlighter) return __('Loading...', 'code-block-pro')
                    return highlighter
                        .codeToHtml(code, {
                            lang: language ?? 'js',
                        })
                        ?.replace(/<\/?[pre|code][^>]*>/g, '')
                }}
            />
        </div>
    )
}
