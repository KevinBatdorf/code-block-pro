import { useEffect } from '@wordpress/element';
import { Theme } from 'shiki';
import { useGlobalStore } from '../state/global';
import { useThemeStore } from '../state/theme';
import { AttributesPropsAndSetter } from '../types';

export const useDefaults = ({
    attributes,
    setAttributes,
}: AttributesPropsAndSetter) => {
    const { theme, fontSize, fontFamily, lineHeight, copyButton, headerType } =
        attributes;
    const { previousSettings } = useGlobalStore();
    const {
        previousTheme,
        previousFontSize,
        previousFontFamily,
        previousLineHeight,
        previousHeaderType,
    } = useThemeStore();

    useEffect(() => {
        if (copyButton || !previousSettings.copyButton) return;
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
};
