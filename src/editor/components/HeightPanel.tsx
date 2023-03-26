import {
    BaseControl,
    CheckboxControl,
    TextControl,
    PanelBody,
} from '@wordpress/components';
import { useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { AttributesPropsAndSetter } from '../../types';
import { SeeMoreSelect } from './SeeMoreSelect';

export const HeightPanel = ({
    attributes,
    setAttributes,
}: AttributesPropsAndSetter) => {
    const [editorHeight, setEditorHeight] = useState(attributes?.editorHeight);
    const [enableMaxHeight, setEnableMaxHeight] = useState(
        attributes?.enableMaxHeight,
    );
    const [seeMoreString, setSeeMoreString] = useState(
        attributes?.seeMoreString ?? '',
    );
    const [seeMoreAfterLine, setSeeMoreAfterLine] = useState(
        attributes?.seeMoreAfterLine ?? '',
    );
    const [seeMoreTransition, setSeeMoreTransition] = useState(
        attributes?.seeMoreTransition ?? false,
    );
    const open = useRef(Number(attributes?.editorHeight) > 0);

    useEffect(() => {
        setAttributes({
            editorHeight,
            seeMoreString,
            seeMoreAfterLine,
            seeMoreTransition,
            enableMaxHeight,
        });
    }, [
        editorHeight,
        seeMoreString,
        seeMoreAfterLine,
        seeMoreTransition,
        setAttributes,
        enableMaxHeight,
    ]);

    return (
        <PanelBody
            title={__('Max Height', 'code-block-pro')}
            initialOpen={open.current}>
            <BaseControl id="code-block-pro-editor-height">
                <TextControl
                    spellCheck={false}
                    autoComplete="off"
                    data-cy-cbp="editor-height"
                    type="number"
                    label={__(
                        'Max editor height (admin only)',
                        'code-block-pro',
                    )}
                    help={__('Set to 0 to disable.', 'code-block-pro')}
                    placeholder={'0'}
                    onChange={setEditorHeight}
                    value={editorHeight}
                />
            </BaseControl>
            <BaseControl id="code-block-pro-see-more-enabled">
                <CheckboxControl
                    label={__('Enable frontend max height', 'code-block-pro')}
                    help={__(
                        'Enable this, then select a specific line number below.',
                        'code-block-pro',
                    )}
                    data-cy="enable-max-height"
                    checked={enableMaxHeight}
                    onChange={setEnableMaxHeight}
                />
            </BaseControl>
            {enableMaxHeight && (
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
                            label={__(
                                'Animate height transition',
                                'code-block-pro',
                            )}
                            checked={seeMoreTransition}
                            onChange={setSeeMoreTransition}
                        />
                    </BaseControl>
                    <SeeMoreSelect
                        attributes={attributes}
                        onClick={(seeMoreType) => {
                            setAttributes({ seeMoreType });
                        }}
                    />
                </>
            )}
        </PanelBody>
    );
};
