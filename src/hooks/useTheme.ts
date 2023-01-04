import { useEffect, useState } from '@wordpress/element';
import { applyFilters } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';
import { getHighlighter, Lang, setCDN, Theme, setWasm } from 'shiki';
import useSWRImmutable from 'swr/immutable';

type Params = { theme: Theme; lang: Lang; ready?: boolean };

const fetcher = ({ theme, lang, ready }: Params) => {
    if (!ready) throw new Error();
    const themeFiltered = applyFilters(
        'blocks.codeBlockPro.theme',
        theme,
    ) as Theme;
    return getHighlighter({ langs: [lang], theme: themeFiltered });
};
let once = false;

export const useTheme = ({ theme, lang, ready = true }: Params) => {
    const [wasmLoaded, setWasmFileLoaded] = useState(false);
    if (!once) {
        once = true;
        const assetDir = window.codeBlockPro?.pluginUrl + 'build/shiki/';
        setCDN(
            applyFilters('blocks.codeBlockPro.assetDir', assetDir) as string,
        );
    }
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
