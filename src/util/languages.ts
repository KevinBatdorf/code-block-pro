import { Lang as LangShiki } from 'shiki';
import defaultLanguages from '../defaultLanguages.json';
import { Lang } from '../types';

export const codeAliases = {
    'actionscript-3': ['as3'],
    bat: ['batch'],
    berry: ['be'],
    cadence: ['cdc'],
    clojure: ['clj'],
    codeql: ['ql'],
    cpp: ['arduino'],
    csharp: ['c#', 'cs'],
    cypher: ['cql'],
    docker: ['dockerfile'],
    erlang: ['erl'],
    fsharp: ['f#', 'fs'],
    gjs: ['glimmer-js'],
    gts: ['glimmer-ts'],
    haskell: ['hs'],
    handlebars: ['hbs'],
    'html-ruby-erb': ['erb'],
    ini: ['properties'],
    java: ['javafx'],
    javascript: ['jscript', 'js'],
    jssm: ['fsl'],
    kusto: ['kql'],
    make: ['makefile'],
    markdown: ['md'],
    matlab: ['matlabkey'],
    narrat: ['nar'],
    nextflow: ['nf'],
    'objective-c': ['objc'],
    pascal: ['delphi'],
    powershell: ['ps', 'ps1'],
    pug: ['jade'],
    python: ['py'],
    raku: ['perl6'],
    ruby: ['rb'],
    rust: ['rs'],
    shaderlab: ['shader'],
    shellscript: ['shell', 'sh', 'git-commit', 'git-rebase'],
    sellsession: ['console'],
    stylus: ['styl'],
    typescript: ['ts'],
    vb: ['cmd'],
    viml: ['vim', 'vimscript'],
    vyper: ['vy'],
    wenyan: ['文言'],
    xml: ['coldfusion'],
    yaml: ['yml'],
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
    return Object.keys(langs).reduce(
        (acc, key) => {
            if (!aliasesToRemove.includes(key)) {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                acc[key as Lang] = langs[key as Lang];
            }
            return acc;
        },
        {} as Partial<typeof defaultLanguages>,
    );
};

export const languages = removeAliases(defaultLanguages);

/** Get the language shown in the editor, which could differ from the front */
export const getEditorLanguage = (language: string): LangShiki => {
    if (language === 'ansi') return 'shellscript';
    return language as LangShiki;
};
