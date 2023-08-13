import { applyFilters } from '@wordpress/hooks';
import { colord, extend } from 'colord';
import namesPlugin from 'colord/plugins/names';
import defaultThemes from '../defaultThemes.json';
import { Attributes, ThemeOption } from '../types';

extend([namesPlugin]);

export const computeLineHighlightColor = (
    color: string,
    attributes: Pick<Attributes, 'theme'>,
) => {
    const themes = applyFilters(
        'blocks.codeBlockPro.themes',
        defaultThemes,
    ) as ThemeOption;
    // set in the theme, use that
    if (themes?.[attributes.theme]?.styles?.['line-background']) {
        return themes?.[attributes?.theme]?.styles?.['line-background'];
    }
    // If not set in the theme, but a variable, attempt to compute it
    // but fallback to a known default
    if (color.startsWith('var')) {
        const doc = document.documentElement;
        const maybeColor = getComputedStyle(doc)
            .getPropertyValue(
                // extract from inside var()
                color.replace(/^var\((--[\w-]+)\)$/, '$1'),
            )
            .trim();
        const computed =
            maybeColor || getComputedStyle(doc).getPropertyValue('--cbp-text');
        return colord(computed).saturate(0.5).alpha(0.2).toRgbString();
    }

    return colord(color).saturate(0.5).alpha(0.2).toRgbString();
};

export const findLineNumberColor = (attributes: Attributes) => {
    const themes = applyFilters(
        'blocks.codeBlockPro.themes',
        defaultThemes,
    ) as ThemeOption;
    // set in the theme, use that
    if (themes?.[attributes.theme]?.styles?.['line-number-color']) {
        return themes?.[attributes?.theme]?.styles?.['line-number-color'];
    }
    return attributes.textColor;
};

export const findBackgroundColor = (attributes: Partial<Attributes>) => {
    const themes = applyFilters(
        'blocks.codeBlockPro.themes',
        defaultThemes,
    ) as ThemeOption;
    // set in the theme, use that
    if (
        attributes?.theme &&
        themes?.[attributes?.theme]?.styles?.['color-background']
    ) {
        return themes?.[attributes?.theme]?.styles?.['color-background'];
    }
    return attributes.bgColor;
};

export const findTextColor = (attributes: Partial<Attributes>) => {
    const themes = applyFilters(
        'blocks.codeBlockPro.themes',
        defaultThemes,
    ) as ThemeOption;
    // set in the theme, use that
    if (
        attributes?.theme &&
        themes?.[attributes?.theme]?.styles?.['color-text']
    ) {
        return themes?.[attributes?.theme]?.styles?.['color-text'];
    }
    return attributes.textColor;
};
