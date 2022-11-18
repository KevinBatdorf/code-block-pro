import {
    BaseControl,
    CheckboxControl,
    TextControl,
} from '@wordpress/components';
import { useEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { AttributesPropsAndSetter } from '../../types';
import { parseStringArrayWithSingleNestedArray } from '../../util/arrayHelpers';

export const HighlightingControl = ({
    attributes,
    setAttributes,
}: AttributesPropsAndSetter) => {
    const inputRef = useRef<HTMLInputElement>(null);
    useEffect(() => {
        try {
            parseStringArrayWithSingleNestedArray(attributes.lineHighlights);
            inputRef.current
                ?.querySelector('input')
                ?.classList.remove('cbp-input-error');
        } catch (e) {
            console.error(e);
            inputRef.current
                ?.querySelector('input')
                ?.classList.add('cbp-input-error');
        }
    }, [attributes.lineHighlights]);
    return (
        <BaseControl id="code-block-pro-show-highlighting">
            <CheckboxControl
                label={__('Enable line highlighting', 'code-block-pro')}
                help={__(
                    'Highlight individual lines. Highlights will not show in the editor.',
                    'code-block-pro',
                )}
                checked={attributes.enableHighlighting ?? false}
                onChange={(enableHighlighting) => {
                    setAttributes({ enableHighlighting });
                }}
            />
            {attributes.enableHighlighting && (
                <BaseControl id="code-block-pro-show-highlighted-lines">
                    <div ref={inputRef}>
                        <TextControl
                            id="code-block-pro-show-highlighted-lines"
                            spellCheck={false}
                            autoComplete="off"
                            label={__(
                                'Highlight the following',
                                'code-block-pro',
                            )}
                            help={__(
                                'Try "1,3,4" or "1,[3,5]" for a range. ',
                                'code-block-pro',
                            )}
                            onChange={(lineHighlights) => {
                                setAttributes({ lineHighlights });
                            }}
                            value={attributes?.lineHighlights ?? ''}
                        />
                    </div>
                </BaseControl>
            )}
        </BaseControl>
    );
};
