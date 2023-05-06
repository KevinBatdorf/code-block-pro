import {
    BaseControl,
    CheckboxControl,
    TextControl,
} from '@wordpress/components';
import { useEffect, useRef } from '@wordpress/element';
import { sprintf, __ } from '@wordpress/i18n';
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
                data-cy="enable-blur"
                label={__('Line blurring', 'code-block-pro')}
                help={__(
                    'Blur surrounding code to focus on specific lines.',
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
                                'Focus on the following',
                                'code-block-pro',
                            )}
                            help={sprintf(
                                __(
                                    'Try %1$s or %2$s for a range.',
                                    'code-block-pro',
                                ),
                                '1,5',
                                '1,[3,5]',
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
