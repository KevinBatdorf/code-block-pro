export type Lang = string;

export type Attributes = {
	code: string;
	codeHTML: string;
	language: Lang;
	theme: string;
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
	seeMoreCollapse?: boolean;
	seeMoreCollapseString?: string;
	footerLinkTarget?: boolean;
	disablePadding: boolean;
	startingLineNumber: string;
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
	copyButtonUseTextarea: boolean;
	useDecodeURI: boolean;
	useEscapeShortCodes: boolean;
	tabSize: number;
	useTabs: boolean;
};

export type CustomStyles = {
	'color-text'?: string;
	'color-background'?: string;
	'token-constant'?: string;
	'token-string'?: string;
	'token-comment'?: string;
	'token-keyword'?: string;
	'token-parameter'?: string;
	'token-function'?: string;
	'token-string-expression'?: string;
	'token-punctuation'?: string;
	'token-link'?: string;
	'line-background'?: string;
	'line-number-color'?: string;
};

export type ThemeOption = Record<
	string,
	{
		name: string;
		priority?: boolean;
		custom?: boolean;
		styles?: CustomStyles;
		helpUrl?: { text: string; url: string };
	}
>;
