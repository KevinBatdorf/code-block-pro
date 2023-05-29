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
        buttonTheme,
        headerType,
        footerType,
        clampFonts,
        disablePadding,
        lineNumbers,
        highlightingHover,
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
        previousButtonTheme,
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
        if (buttonTheme || !previousButtonTheme) return;
        setAttributes({ buttonTheme: previousButtonTheme });
    }, [previousButtonTheme, buttonTheme, setAttributes]);

    useEffect(() => {
        if (once.current) return;
        if (theme || !previousTheme) return;
        setAttributes({ theme: previousTheme as Theme });
    }, [previousTheme, theme, setAttributes]);

    useEffect(() => {
        if (once.current) return;
        if (fontSize || !previousFontSize) return;
        setAttributes({ fontSize: previousFontSize });
    }, [previousFontSize, fontSize, setAttributes]);

    useEffect(() => {
        if (once.current) return;
        if (fontFamily || fontFamily === '' || previousFontFamily === undefined)
            return;
        setAttributes({ fontFamily: previousFontFamily });
    }, [previousFontFamily, fontFamily, setAttributes]);

    useEffect(() => {
        if (once.current) return;
        if (lineHeight || !previousLineHeight) return;
        setAttributes({ lineHeight: previousLineHeight });
    }, [previousLineHeight, lineHeight, setAttributes]);

    useEffect(() => {
        if (once.current) return;
        if (headerType || !previousHeaderType) return;
        setAttributes({ headerType: previousHeaderType });
    }, [previousHeaderType, headerType, setAttributes]);

    useEffect(() => {
        if (once.current) return;
        if (footerType !== undefined || previousFooterType === undefined)
            return;
        setAttributes({ footerType: previousFooterType });
    }, [previousFooterType, footerType, setAttributes]);

    useEffect(() => {
        if (once.current) return;
        if (clampFonts !== undefined || previousClampFonts === undefined)
            return;
        setAttributes({ clampFonts: previousClampFonts });
    }, [previousClampFonts, clampFonts, setAttributes]);

    useEffect(() => {
        if (once.current) return;
        if (
            disablePadding !== undefined ||
            previousDisablePadding === undefined
        )
            return;
        setAttributes({ disablePadding: previousDisablePadding });
    }, [previousDisablePadding, disablePadding, setAttributes]);

    useEffect(() => {
        if (once.current) return;
        if (lineNumbers !== undefined || previousLineNumbers === undefined)
            return;
        setAttributes({ lineNumbers: previousLineNumbers });
    }, [previousLineNumbers, lineNumbers, setAttributes]);

    useEffect(() => {
        if (once.current) return;
        if (
            highlightingHover !== undefined ||
            previousHighlightingHover === undefined
        )
            return;
        setAttributes({ highlightingHover: previousHighlightingHover });
    }, [previousHighlightingHover, highlightingHover, setAttributes]);

    useEffect(() => {
        requestAnimationFrame(() => {
            once.current = true;
        });
    }, [ready]);
};
