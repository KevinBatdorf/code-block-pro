import { Lang } from 'shiki';
import defaultLanguages from '../defaultLanguages.json';

export const codeAliases = {
    'actionscript-3': ['as3'],
    cpp: ['arduino'],
    xml: ['coldfusion'],
    pascal: ['delphi'],
    java: ['javafx'],
    javascript: ['jscript', 'js'],
    matlab: ['matlabkey'],
    'objective-c': ['objc'],
    bat: ['batch'],
    berry: ['be'],
    cadence: ['cdc'],
    clojure: ['clj'],
    csharp: ['c#'],
    erlang: ['erl'],
    fsharp: ['f#'],
    haskell: ['hs'],
    handlebars: ['hbs'],
    jssm: ['fsl'],
    make: ['makefile'],
    markdown: ['md'],
    powershell: ['ps', 'ps1'],
    pug: ['jade'],
    python: ['py'],
    raku: ['perl6'],
    ruby: ['rb'],
    rust: ['rs'],
    'html-ruby-erb': ['erb'],
    shaderlab: ['shader'],
    shellscript: ['shell', 'bash', 'sh', 'zsh'],
    stylus: ['styl'],
    typescript: ['ts'],
    vb: ['cmd'],
    viml: ['vim', 'vimscript'],
    wenyan: ['文言'],
    codeql: ['ql'],
};

export const getMainAlias = (
    languageAltName: string | undefined,
): string | undefined => {
    if (!languageAltName) return;
    return Object.keys(codeAliases).find((key) =>
        codeAliases[key as keyof typeof codeAliases].includes(languageAltName),
    );
};

export const removeAliases = (
    langs: typeof defaultLanguages,
): Partial<typeof defaultLanguages> => {
    const aliasesToRemove = Object.values(codeAliases).flat();
    return Object.keys(langs).reduce((acc, key) => {
        if (!aliasesToRemove.includes(key)) {
            acc[key as Lang] = langs[key as Lang];
        }
        return acc;
    }, {} as Partial<typeof defaultLanguages>);
};

export const languages = removeAliases(defaultLanguages);
