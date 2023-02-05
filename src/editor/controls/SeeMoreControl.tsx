import {
    BaseControl,
    CheckboxControl,
    TextControl,
} from '@wordpress/components';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { AttributesPropsAndSetter } from '../../types';

export const SeeMoreControl = ({
    attributes,
    setAttributes,
}: AttributesPropsAndSetter) => {
    const [seeMoreString, setSeeMoreString] = useState(
        attributes?.seeMoreString ?? '',
    );
    const [seeMoreAfterLine, setSeeMoreAfterLine] = useState(
        attributes?.seeMoreAfterLine ?? '',
    );
    const [seeMoreTransition, setSeeMoreTransition] = useState(
        attributes?.seeMoreTransition ?? false,
    );

    useEffect(() => {
        setAttributes({ seeMoreString, seeMoreAfterLine, seeMoreTransition });
    }, [seeMoreString, seeMoreAfterLine, seeMoreTransition, setAttributes]);

    return (
        <>
            <BaseControl id="code-block-pro-see-more-text">
                <TextControl
                    data-cy="see-more-text"
                    spellCheck={false}
                    autoComplete="off"
                    label={__('See more text', 'code-block-pro')}
                    placeholder={__('Expand', 'code-block-pro')}
                    onChange={setSeeMoreString}
                    value={seeMoreString ?? ''}
                />
            </BaseControl>
            <BaseControl id="code-block-pro-see-more-line">
                <TextControl
                    data-cy="see-more-line"
                    spellCheck={false}
                    autoComplete="off"
                    label={__('Hide after line', 'code-block-pro')}
                    help={__(
                        'Enter the last visible line number.',
                        'code-block-pro',
                    )}
                    onChange={setSeeMoreAfterLine}
                    value={seeMoreAfterLine}
                />
            </BaseControl>
            <BaseControl id="code-block-pro-see-more-transition">
                <CheckboxControl
                    label={__('Animate height transition', 'code-block-pro')}
                    checked={seeMoreTransition}
                    onChange={setSeeMoreTransition}
                />
            </BaseControl>
        </>
    );
};
