import { useEffect, useRef } from '@wordpress/element';
import { Theme } from 'shiki';
import { useThemeStore, useThemeStoreReady } from '../state/theme';
import { AttributesPropsAndSetter } from '../types';

export const useDefaults = ({
    attributes,
    setAttributes,
}: AttributesPropsAndSetter) => {
    const {
        theme,
        fontSize,
        fontFamily,
        lineHeight,
        copyButton,
        copyButtonType,
        copyButtonString,
        copyButtonStringCopied,
        headerType,
        footerType,
        clampFonts,
        disablePadding,
        lineNumbers,
        highlightingHover,
        tabSize,
        useTabs,
        seeMoreType,
        seeMoreString,
        seeMoreTransition,
    } = attributes;
    const {
        previousTheme,
        previousFontSize,
        previousFontFamily,
        previousLineHeight,
        previousHeaderType,
        previousFooterType,
        previousClampFonts,
        previousDisablePadding,
        previousLineNumbers,
        previousHighlightingHover,
        previousCopyButton,
        previousCopyButtonType,
        previousCopyButtonString,
        previousCopyButtonStringCopied,
        previousTabSize,
        previousUseTabs,
        previousSeeMoreType,
        previousSeeMoreString,
        previousSeeMoreTransition,
    } = useThemeStore();
    const ready = useThemeStoreReady();
    const once = useRef(false);

    useEffect(() => {
        if (once.current) return;
        if (copyButton !== undefined || !previousCopyButton) return;
        setAttributes({ copyButton: previousCopyButton });
    }, [previousCopyButton, copyButton, setAttributes]);

    useEffect(() => {
        if (once.current) return;
        if (copyButtonType) return;
        setAttributes({ copyButtonType: previousCopyButtonType });
    }, [previousCopyButtonType, copyButtonType, setAttributes]);

    useEffect(() => {
        if (once.current) return;
        // Checks undefined to avoid invalidating old blocks
        if (copyButtonString || copyButtonString === undefined) return;
        setAttributes({ copyButtonString: previousCopyButtonString });
    }, [previousCopyButtonString, copyButtonString, setAttributes]);

    useEffect(() => {
        if (once.current) return;
        // Checks undefined to avoid invalidating old blocks
        if (copyButtonStringCopied || copyButtonStringCopied === undefined) {
            return;
        }
        const cpyP = previousCopyButtonStringCopied;
        setAttributes({ copyButtonStringCopied: cpyP });
    }, [previousCopyButtonStringCopied, copyButtonStringCopied, setAttributes]);

    useEffect(() => {
        if (once.current) return;
        if (theme) return;
        setAttributes({ theme: previousTheme as Theme });
    }, [previousTheme, theme, setAttributes]);

    useEffect(() => {
        if (once.current) return;
        if (fontSize) return;
        setAttributes({ fontSize: previousFontSize });
    }, [previousFontSize, fontSize, setAttributes]);

    useEffect(() => {
        if (once.current) return;
        if (fontFamily || fontFamily === '') return;
        setAttributes({ fontFamily: previousFontFamily });
    }, [previousFontFamily, fontFamily, setAttributes]);

    useEffect(() => {
        if (once.current) return;
        if (lineHeight) return;
        setAttributes({ lineHeight: previousLineHeight });
    }, [previousLineHeight, lineHeight, setAttributes]);

    useEffect(() => {
        if (once.current) return;
        if (headerType) return;
        setAttributes({ headerType: previousHeaderType });
    }, [previousHeaderType, headerType, setAttributes]);

    useEffect(() => {
        if (once.current) return;
        if (footerType !== undefined) return;
        setAttributes({ footerType: previousFooterType });
    }, [previousFooterType, footerType, setAttributes]);

    useEffect(() => {
        if (once.current) return;
        if (clampFonts !== undefined) return;
        setAttributes({ clampFonts: previousClampFonts });
    }, [previousClampFonts, clampFonts, setAttributes]);

    useEffect(() => {
        if (once.current) return;
        if (disablePadding !== undefined) return;
        setAttributes({ disablePadding: previousDisablePadding });
    }, [previousDisablePadding, disablePadding, setAttributes]);

    useEffect(() => {
        if (once.current) return;
        if (lineNumbers !== undefined) return;
        setAttributes({ lineNumbers: previousLineNumbers });
    }, [previousLineNumbers, lineNumbers, setAttributes]);

    useEffect(() => {
        if (once.current) return;
        if (tabSize !== undefined) return;
        setAttributes({ tabSize: previousTabSize });
    }, [previousTabSize, tabSize, setAttributes]);

    useEffect(() => {
        if (once.current) return;
        if (useTabs !== undefined) return;
        setAttributes({ useTabs: previousUseTabs });
    }, [previousUseTabs, useTabs, setAttributes]);

    useEffect(() => {
        if (once.current) return;
        if (seeMoreType !== undefined) return;
        setAttributes({ seeMoreType: previousSeeMoreType });
    }, [previousSeeMoreType, seeMoreType, setAttributes]);

    useEffect(() => {
        if (once.current) return;
        if (seeMoreString !== undefined) return;
        setAttributes({ seeMoreString: previousSeeMoreString });
    }, [previousSeeMoreString, seeMoreString, setAttributes]);

    useEffect(() => {
        if (once.current) return;
        if (seeMoreTransition !== undefined) return;
        setAttributes({ seeMoreTransition: previousSeeMoreTransition });
    }, [previousSeeMoreTransition, seeMoreTransition, setAttributes]);

    useEffect(() => {
        if (once.current) return;
        if (highlightingHover !== undefined) return;
        setAttributes({ highlightingHover: previousHighlightingHover });
    }, [previousHighlightingHover, highlightingHover, setAttributes]);

    useEffect(() => {
        requestAnimationFrame(() => {
            once.current = true;
        });
    }, [ready]);
};
