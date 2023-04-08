import { applyFilters } from '@wordpress/hooks';
import { colord, extend } from 'colord';
import namesPlugin from 'colord/plugins/names';
import defaultThemes from '../defaultThemes.json';
import { Attributes, ThemeOption } from '../types';

extend([namesPlugin]);

export const computeLineHighlightColor = (
    color: string,
    attributes: Attributes,
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
        console.log({ maybeColor, computed });
        return colord(computed).saturate(0.5).alpha(0.2).toRgbString();
    }

    return colord(color).saturate(0.5).alpha(0.2).toRgbString();
};

export const computeLineNumbersColor = (attributes: Attributes) => {
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
