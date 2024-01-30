import { useEffect, useState } from '@wordpress/element';
import { applyFilters } from '@wordpress/hooks';
import { getHighlighter, setCDN, Theme, setWasm } from 'shiki';
import useSWRImmutable from 'swr/immutable';
import defaultThemes from '../defaultThemes.json';
import { Lang, ThemeOption } from '../types';
import { getEditorLanguage } from '../util/languages';

type Params = {
    theme: Theme;
    lang: Lang | 'ansi';
    ready?: boolean;
};

const fetcher = ({ theme, lang, ready }: Params) => {
    if (!ready) throw new Error();
    const themeFiltered = applyFilters(
        'blocks.codeBlockPro.theme',
        theme,
    ) as Theme;
    // If the theme has an alias, use that instead
    // i.e. it was renamed upstream
    const themeAlias = (
        defaultThemes as Record<
            string,
            { name: string; priority?: boolean; alias?: string }
        >
    )?.[themeFiltered]?.['alias'] as Theme;

    return getHighlighter({
        langs: lang === 'plaintext' ? [] : [getEditorLanguage(lang)],
        theme: themeAlias ?? themeFiltered,
    });
};
let once = false;

export const useTheme = ({ theme, lang, ready = true }: Params) => {
    const [wasmLoaded, setWasmFileLoaded] = useState(false);
    const themes = applyFilters(
        'blocks.codeBlockPro.themes',
        defaultThemes,
    ) as ThemeOption;
    if (!once) {
        once = true;
        const assetDir = window.codeBlockPro?.pluginUrl + 'build/shiki/';
        setCDN(
            applyFilters('blocks.codeBlockPro.assetDir', assetDir) as string,
        );
    }
    if (themes[theme]?.custom) theme = 'css-variables';
    const { data: highlighter, error } = useSWRImmutable(
        { theme, lang, ready: ready && wasmLoaded },
        fetcher,
    );
    useEffect(() => {
        const assetDir = window.codeBlockPro?.pluginUrl + 'build/shiki/';
        fetch(assetDir + 'dist/onig.wasm')
            .then((res) => res.arrayBuffer())
            .then((wasmBuffer) => {
                setWasm(wasmBuffer);
                setWasmFileLoaded(true);
            });
    }, []);

    return {
        highlighter,
        error,
        loading: (!highlighter && !error) || !wasmLoaded,
    };
};
