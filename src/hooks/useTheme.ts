import { getHighlighter, Lang, setCDN, Theme } from 'shiki'
import useSWRImmutable from 'swr/immutable'

setCDN('https://unpkg.com/shiki/')
type Params = { theme: Theme; lang: Lang }
const fetcher = ({ theme, lang }: Params) =>
    getHighlighter({ langs: [lang], theme })
export const useTheme = ({ theme, lang }: Params) => {
    const { data: highlighter, error } = useSWRImmutable(
        { theme, lang },
        fetcher,
    )
    return { highlighter, error, loading: !highlighter && !error }
}
