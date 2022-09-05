export const fontFamilyLong = (family: string) => {
    if (!family) return;
    return [
        family,
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
