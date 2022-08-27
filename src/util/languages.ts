export const convertLanguageId = (
    languageAltName: string | undefined,
): string | undefined => {
    if (!languageAltName) return;
    const possibleMatches = {
        'actionscript-3': ['as3'],
        cpp: ['arduino'],
        shellscript: ['bash'],
        xml: ['coldfusion'],
        pascal: ['delphi'],
        java: ['javafx'],
        javascript: ['jscript'],
        matlab: ['matlabkey'],
        'objective-c': ['objc'],
    };
    return Object.keys(possibleMatches).find((key) =>
        possibleMatches[key as keyof typeof possibleMatches].includes(
            languageAltName,
        ),
    );
};
