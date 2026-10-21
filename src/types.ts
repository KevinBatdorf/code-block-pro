export type Pane = {
	language?: string;
	code?: string;
	label?: string;
	startLine?: number | string;
	highlightLines?: string;
	focusLines?: string;
	sharpLines?: string;
	addedLines?: string;
	removedLines?: string;
	seeMoreAfter?: number | string;
};

export type Attributes = {
	version?: number;
	profile?: string;
	panes?: Pane[];
	legacyContent?: string;
	fontFamily?: string;
	lineAnchors?: boolean;
	overrides?: { lineNumbers?: boolean };
	removeBlurOnHover?: boolean;
	headerString?: string;
	footerString?: string;
	footerLink?: string;
	footerLinkTarget?: boolean;
};

declare global {
	interface Window {
		codeBlockPro?: { pluginUrl: string; canUpgrade: boolean };
	}
}
