import { Lang as LangShiki, Theme } from 'shiki';

export type Lang = LangShiki | 'ansi';

export type Attributes = {
    code: string;
    codeHTML: string;
    language: Lang;
    theme: Theme;
    align: 'wide' | 'full';
    bgColor: string;
    textColor: string;
    fontSize: string;
    fontFamily: string;
    lineHeight: string;
    lineNumbers: boolean;
    clampFonts: boolean;
    editorHeight: string;
    headerType: string;
    headerString?: string;
    footerType: string;
    footerString?: string;
    footerLink?: string;
    enableMaxHeight?: boolean;
    seeMoreType?: string;
    seeMoreString?: string;
    seeMoreAfterLine?: string;
    seeMoreTransition?: boolean;
    footerLinkTarget?: boolean;
    disablePadding: boolean;
    startingLineNumber: string;
    lineNumbersWidth: number;
    enableHighlighting: boolean;
    lineHighlights: string;
    lineHighlightColor: string;
    enableBlurring: boolean;
    lineBlurs: string;
    removeBlurOnHover: boolean;
    frame: boolean;
    renderType: string;
    label: string;
    copyButton: boolean;
};
export interface AttributesPropsAndSetter {
    attributes: Attributes;
    setAttributes: (attrs: Partial<Attributes>) => void;
}

declare global {
    interface Window {
        codeBlockPro: {
            pluginUrl: string;
        };
    }
}
