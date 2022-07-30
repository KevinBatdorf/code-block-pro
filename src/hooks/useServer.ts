import { useEffect, useState } from '@wordpress/element'
import init, { get_text } from '../../pkg/index.js'

interface Server {
    get_text: () => string
}

export const useServer = () => {
    const [server, setServer] = useState<Server | null>(null)
    useEffect(() => {
        const fetchWasmCode = async () => {
            await init()
            setServer({ get_text })
        }
        fetchWasmCode()
    }, [])
    return server
}
