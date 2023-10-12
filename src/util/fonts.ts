export const fontFamilyLong = (family: string) => {
    if (!family) return;
    return [
        family.split('.')[0],
        'ui-monospace',
        'SFMono-Regular',
        'Menlo',
        'Monaco',
        'Consolas',
        'monospace',
    ].join(',');
};

export const maybeClamp = (size: string, clampFonts: boolean) => {
    if (!size) return;
    if (!clampFonts) return size;
    if (!parseFloat(size)) return size;
    return `clamp(${parseFloat(size) * 16}px, ${size}, ${
        parseFloat(size) * 24
    }px)`;
};

export const getTextWidth = (text: string, font?: string) => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return 0;
    context.font = font || getComputedStyle(document.body).font;
    return context.measureText(text).width;
};
