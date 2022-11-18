import {
    BaseControl,
    CheckboxControl,
    TextControl,
} from '@wordpress/components';
import { useEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { AttributesPropsAndSetter } from '../../types';
import { parseStringArrayWithSingleNestedArray } from '../../util/arrayHelpers';

export const BlurControl = ({
    attributes,
    setAttributes,
}: AttributesPropsAndSetter) => {
    const inputRef = useRef<HTMLInputElement>(null);
    useEffect(() => {
        try {
            parseStringArrayWithSingleNestedArray(attributes.lineBlurs);
            inputRef.current
                ?.querySelector('input')
                ?.classList.remove('cbp-input-error');
        } catch (e) {
            console.error(e);
            inputRef.current
                ?.querySelector('input')
                ?.classList.add('cbp-input-error');
        }
    }, [attributes.lineBlurs]);

    return (
        <BaseControl id="code-block-pro-show-blurring">
            <CheckboxControl
                label={__('Enable blur emphesis', 'code-block-pro')}
                help={__(
                    'Blur surrounding code to focus on specific lines. Blur effect will not show in the editor.',
                    'code-block-pro',
                )}
                checked={attributes.enableBlurring ?? false}
                onChange={(enableBlurring) => {
                    setAttributes({ enableBlurring });
                }}
            />
            {attributes.enableBlurring && (
                <BaseControl id="code-block-pro-show-blurred-lines">
                    <div ref={inputRef}>
                        <TextControl
                            id="code-block-pro-show-blurred-lines"
                            spellCheck={false}
                            autoComplete="off"
                            label={__(
                                'Ignore blurring on the following',
                                'code-block-pro',
                            )}
                            help={__(
                                'Try "1,5" or "1,[3,5]" for a range.',
                                'code-block-pro',
                            )}
                            onChange={(lineBlurs) => {
                                setAttributes({ lineBlurs });
                            }}
                            value={attributes?.lineBlurs ?? ''}
                        />
                    </div>
                    <CheckboxControl
                        label={__('Remove blur on hover', 'code-block-pro')}
                        checked={attributes.removeBlurOnHover ?? false}
                        onChange={(removeBlurOnHover) => {
                            setAttributes({ removeBlurOnHover });
                        }}
                    />
                </BaseControl>
            )}
        </BaseControl>
    );
};
