import { getHighlighter, setCDN } from 'shiki'
import useSWRImmutable from 'swr/immutable'

setCDN('https://unpkg.com/shiki/')
const fetcher = (theme: string) => getHighlighter({ theme })
export const useTheme = (themeName: string) => {
    const { data: highlighter, error } = useSWRImmutable(themeName, fetcher)
    return { highlighter, error, loading: !highlighter && !error }
}
