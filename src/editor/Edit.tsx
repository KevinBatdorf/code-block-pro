import { RichText } from '@wordpress/block-editor'
import { useEffect, useRef, useState } from '@wordpress/element'
import { __ } from '@wordpress/i18n'
import { getHighlighter, Highlighter, setCDN } from 'shiki'
import type { Attributes } from '..'

interface EditProps {
    attributes: Attributes
    setAttributes: (attributes: Attributes) => void
}
export const Edit = ({ attributes, setAttributes }: EditProps) => {
    const [highlighter, setHighlighter] = useState<Highlighter>()
    const decoderDiv = useRef<HTMLDivElement>(document.createElement('div'))
    const { theme, language, code } = attributes
    const handleChange = (code: string) => {
        setAttributes({ ...attributes, code })
    }

    useEffect(() => {
        setCDN('https://unpkg.com/shiki/')
        getHighlighter({ theme }).then(setHighlighter)
    }, [theme])

    useEffect(() => {
        if (!highlighter) return
        if (!code) return
        decoderDiv.current.innerHTML = code
        const decoded =
            decoderDiv.current.childNodes?.[0]?.nodeValue?.toString()
        if (!decoded) return
        const html = highlighter.codeToHtml(decoded, {
            lang: language ?? 'js',
        })
        setAttributes({ ...attributes, codeHTML: html })
    }, [highlighter, code, attributes, language, setAttributes])

    return (
        <div>
            <RichText
                tagName="code"
                value={attributes.code}
                onChange={handleChange}
                placeholder={__('Write code…')}
                aria-label={__('Code')}
                // eslint-disable-next-line
                // @ts-ignore-next-line
                preserveWhiteSpace
                __unstablePastePlainText
            />
            <RichText.Content value={attributes.codeHTML} />
        </div>
    )
}
