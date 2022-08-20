import { Lang, Theme } from 'shiki'

export type Attributes = {
    code: string
    codeHTML: string
    language: Lang
    theme: Theme
    align: 'wide' | 'full'
    bgColor: string
    textColor: string
    lineNumbers: boolean
}
export interface AttributesPropsAndSetter {
    attributes: Attributes
    setAttributes: (attrs: Partial<Attributes>) => void
}

declare global {
    interface Window {
        codeBlockPro: {
            pluginUrl: string
        }
    }
}
