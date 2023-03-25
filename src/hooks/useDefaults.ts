import { useEffect, useRef } from '@wordpress/element';
import { Theme } from 'shiki';
import { useGlobalStore } from '../state/global';
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
        headerType,
        footerType,
        clampFonts,
        disablePadding,
        lineNumbers,
    } = attributes;
    const { previousSettings } = useGlobalStore();
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
    } = useThemeStore();
    const ready = useThemeStoreReady();
    const once = useRef(false);

    useEffect(() => {
        if (once.current || !ready) return;
        if (copyButton !== undefined || !previousSettings.copyButton) return;
        setAttributes({ copyButton: previousSettings.copyButton });
    }, [ready, previousSettings, copyButton, setAttributes]);

    useEffect(() => {
        if (once.current || !ready) return;
        if (theme || !previousTheme) return;
        setAttributes({ theme: previousTheme as Theme });
    }, [ready, previousTheme, theme, setAttributes]);

    useEffect(() => {
        if (once.current || !ready) return;
        if (fontSize || !previousFontSize) return;
        setAttributes({ fontSize: previousFontSize });
    }, [ready, previousFontSize, fontSize, setAttributes]);

    useEffect(() => {
        if (once.current || !ready) return;
        if (fontFamily || fontFamily === '' || previousFontFamily === undefined)
            return;
        setAttributes({ fontFamily: previousFontFamily });
    }, [ready, previousFontFamily, fontFamily, setAttributes]);

    useEffect(() => {
        if (once.current || !ready) return;
        if (lineHeight || !previousLineHeight) return;
        setAttributes({ lineHeight: previousLineHeight });
    }, [ready, previousLineHeight, lineHeight, setAttributes]);

    useEffect(() => {
        if (once.current || !ready) return;
        if (headerType || !previousHeaderType) return;
        setAttributes({ headerType: previousHeaderType });
    }, [ready, previousHeaderType, headerType, setAttributes]);

    useEffect(() => {
        if (once.current || !ready) return;
        if (footerType !== undefined || previousFooterType === undefined)
            return;
        setAttributes({ footerType: previousFooterType });
    }, [ready, previousFooterType, footerType, setAttributes]);

    useEffect(() => {
        if (once.current || !ready) return;
        if (clampFonts !== undefined || previousClampFonts === undefined)
            return;
        setAttributes({ clampFonts: previousClampFonts });
    }, [ready, previousClampFonts, clampFonts, setAttributes]);

    useEffect(() => {
        if (once.current || !ready) return;
        if (
            disablePadding !== undefined ||
            previousDisablePadding === undefined
        )
            return;
        setAttributes({ disablePadding: previousDisablePadding });
    }, [ready, previousDisablePadding, disablePadding, setAttributes]);

    useEffect(() => {
        if (once.current || !ready) return;
        if (lineNumbers !== undefined || previousLineNumbers === undefined)
            return;
        setAttributes({ lineNumbers: previousLineNumbers });
    }, [ready, previousLineNumbers, lineNumbers, setAttributes]);

    useEffect(() => {
        requestAnimationFrame(() => {
            once.current = true;
        });
    }, [ready]);
};
