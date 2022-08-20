import { getHighlighter, Lang, setCDN, Theme } from 'shiki'
import useSWRImmutable from 'swr/immutable'

type Params = { theme: Theme; lang: Lang }

const fetcher = ({ theme, lang }: Params) =>
    getHighlighter({ langs: [lang], theme })
let once = false
export const useTheme = ({ theme, lang }: Params) => {
    const { data: highlighter, error } = useSWRImmutable(
        { theme, lang },
        fetcher,
    )
    if (!once) {
        once = true
        setCDN(window.codeBlockPro?.pluginUrl + '/build/shiki/')
    }
    return { highlighter, error, loading: !highlighter && !error }
}
