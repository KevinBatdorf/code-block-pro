import { InspectorControls } from '@wordpress/block-editor'
import { PanelBody, BaseControl, Button } from '@wordpress/components'
import { useCallback, useEffect } from '@wordpress/element'
import { __ } from '@wordpress/i18n'
import type { Attributes } from '..'
import { useServer } from '../hooks/useServer'
import './editor.css'

interface ControlProps {
    attributes: Attributes
    setAttributes: (attributes: Attributes) => void
}

export const Controls = ({ attributes, setAttributes }: ControlProps) => {
    const server = useServer()
    const setQuote = useCallback(() => {
        if (server?.get_text) {
            setAttributes({ text: server.get_text() })
        }
    }, [server, setAttributes])

    useEffect(() => {
        if (attributes.text === 'Loading...') {
            setQuote()
        }
    }, [server, setQuote, attributes.text])

    return (
        <InspectorControls>
            <PanelBody title={__('Settings', 'rust-starter')}>
                <BaseControl id="get-text">
                    {/* To use TW just wrap the class with your namespace as
                    defined in tailwind.config.js file, but with -editor appended */}
                    <div className="rust-starter-editor">
                        <div className="p-4 bg-gray-200 mb-4">
                            This area is styled with Tailwind CSS. The button
                            below will use Rust to process the request.
                        </div>
                        <Button isPrimary onClick={setQuote}>
                            {__('Get new text', 'rust-starter')}
                        </Button>
                    </div>
                </BaseControl>
            </PanelBody>
        </InspectorControls>
    )
}
