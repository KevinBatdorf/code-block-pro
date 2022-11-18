import { Lang, Theme } from 'shiki';

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
    headerType: string;
    headerString?: string;
    footerType: string;
    footerString?: string;
    footerLink?: string;
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
