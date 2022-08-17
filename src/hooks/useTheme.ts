import { getHighlighter, setCDN } from 'shiki'
import useSWRImmutable from 'swr/immutable'

setCDN('https://unpkg.com/shiki/')
const hl = getHighlighter({})
const fetcher = async (theme: string) => {
    console.log('running')
    const highlighter = await hl
    highlighter.loadTheme(theme)
    return highlighter
}
export const useTheme = (themeName: string) => {
    const { data: highlighter, error } = useSWRImmutable(themeName, fetcher)
    return { highlighter, error, loading: !highlighter && !error }
}
