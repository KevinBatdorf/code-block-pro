import { Lang as LangShiki, Theme } from 'shiki';

export type Lang = LangShiki | 'ansi' | 'plaintext';

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
    footerType?: string;
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
    // Defunct - Removing it would require n attribute migration
    // so it's easier to just leave it unused for new blocks.
    lineNumbersWidth: number;
    highestLineNumber: number;
    enableHighlighting: boolean;
    highlightingHover: boolean;
    lineHighlights: string;
    lineHighlightColor: string;
    enableBlurring: boolean;
    lineBlurs: string;
    removeBlurOnHover: boolean;
    frame: boolean;
    renderType: string;
    label: string;
    copyButton: boolean;
    copyButtonType: string;
    copyButtonString: string;
    copyButtonStringCopied: string;
    useDecodeURI: boolean;
    tabSize: number;
    useTabs: boolean;
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

export type CustomStyles = {
    'color-text'?: string; // --shiki-color-text
    'color-background'?: string; // --shiki-color-background
    'token-constant'?: string; // --shiki-token-constant
    'token-string'?: string; // --shiki-token-string
    'token-comment'?: string; // --shiki-token-comment
    'token-keyword'?: string; // --shiki-token-keyword
    'token-parameter'?: string; // --shiki-token-parameter
    'token-function'?: string; // --shiki-token-function
    'token-string-expression'?: string; // --shiki-token-string-expression
    'token-punctuation'?: string; // --shiki-token-punctuation
    'token-link'?: string; // --shiki-token-link
    'line-background'?: string; // custom for this app
    'line-number-color'?: string; // custom for this app
};
export type HelpUrl = {
    text: string;
    url: string;
};

export type ThemeOption = Record<
    string,
    {
        name: string;
        priority?: boolean;
        custom?: boolean;
        styles?: CustomStyles;
        helpUrl?: HelpUrl;
    }
>;
