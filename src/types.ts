export type Attributes = {
    code: string
    codeHTML: string
    language: string
    theme: string
    align: 'wide' | 'full'
    bgColor: string
    textColor: string
    lineNumbers: boolean
}
export interface AttributesPropsAndSetter {
    attributes: Attributes
    setAttributes: (attrs: Partial<Attributes>) => void
}
