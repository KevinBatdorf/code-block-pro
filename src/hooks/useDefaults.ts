import { useEffect } from '@wordpress/element';
import { Theme } from 'shiki';
import { useGlobalStore } from '../state/global';
import { useThemeStore } from '../state/theme';
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
        previousClampFonts,
        previousDisablePadding,
        previousLineNumbers,
    } = useThemeStore();

    useEffect(() => {
        if (copyButton !== undefined || !previousSettings.copyButton) return;
        setAttributes({ copyButton: previousSettings.copyButton });
    }, [previousSettings, copyButton, setAttributes]);

    useEffect(() => {
        if (theme || !previousTheme) return;
        setAttributes({ theme: previousTheme as Theme });
    }, [previousTheme, theme, setAttributes]);

    useEffect(() => {
        if (fontSize || !previousFontSize) return;
        setAttributes({ fontSize: previousFontSize });
    }, [previousFontSize, fontSize, setAttributes]);

    useEffect(() => {
        if (fontFamily || !previousFontFamily) return;
        setAttributes({ fontFamily: previousFontFamily });
    }, [previousFontFamily, fontFamily, setAttributes]);

    useEffect(() => {
        if (lineHeight || !previousLineHeight) return;
        setAttributes({ lineHeight: previousLineHeight });
    }, [previousLineHeight, lineHeight, setAttributes]);

    useEffect(() => {
        if (headerType || !previousHeaderType) return;
        setAttributes({ headerType: previousHeaderType });
    }, [previousHeaderType, headerType, setAttributes]);

    useEffect(() => {
        if (clampFonts !== undefined || !previousClampFonts) return;
        setAttributes({ clampFonts: previousClampFonts });
    }, [previousClampFonts, clampFonts, setAttributes]);

    useEffect(() => {
        if (disablePadding !== undefined || !previousDisablePadding) return;
        setAttributes({ disablePadding: previousDisablePadding });
    }, [previousDisablePadding, disablePadding, setAttributes]);

    useEffect(() => {
        if (lineNumbers !== undefined || !previousLineNumbers) return;
        setAttributes({ lineNumbers: previousLineNumbers });
    }, [previousLineNumbers, lineNumbers, setAttributes]);
};
