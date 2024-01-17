import {
    BaseControl,
    CheckboxControl,
    TextControl,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import classNames from 'classnames';
import { useThemeStore } from '../../../../state/theme';
import { AttributesPropsAndSetter } from '../../../../types';
import { copyButtonTypes } from '../copy/CopyButton';

export const CopyBtnSettings = ({
    attributes,
    setAttributes,
}: AttributesPropsAndSetter) => {
    const { updateThemeHistory } = useThemeStore();
    return (
        <BaseControl id="code-block-pro-show-copy-button">
            <CheckboxControl
                data-cy="copy-button"
                label={__('Copy Button', 'code-block-pro')}
                help={__('Adds a button to copy the code', 'code-block-pro')}
                checked={attributes.copyButton}
                onChange={(copyButton) => {
                    setAttributes({ copyButton });
                    updateThemeHistory({ copyButton });
                }}
            />
            {attributes.copyButton && (
                <div className="flex gap-2 -mt-3">
                    {Object.entries(copyButtonTypes).map(([slug, data]) => {
                        const { Component } = data;
                        const {
                            copyButtonType,
                            bgColor: backgroundColor,
                            textColor: color,
                        } = attributes;
                        const current = copyButtonType === slug;
                        return (
                            <div key={slug} style={{ backgroundColor }}>
                                <button
                                    id={`code-block-pro-copy-button-${slug}`}
                                    type="button"
                                    onClick={() => {
                                        setAttributes({ copyButtonType: slug });
                                        updateThemeHistory({
                                            copyButtonType: slug,
                                        });
                                    }}
                                    style={{ color }}
                                    aria-current={current}
                                    className={classNames(
                                        'sidebar-copy-button relative border-0 flex items-start w-full text-left outline-none cursor-pointer no-underline ring-offset-2 ring-offset-white focus:shadow-none ring-wp-theme-500 focus:ring-wp overflow-x-auto top-0 right-0 left-auto bg-transparent border-none transition-opacity duration-200 ease-in-out leading-none z-10 p-1 opacity-90',
                                        {
                                            'ring-wp': current,
                                        },
                                    )}>
                                    <span className="sr-only">
                                        {data.label}
                                    </span>
                                    <span className="pointer-events-none w-full">
                                        <Component color={color} />
                                    </span>
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
            {attributes.copyButton && (
                <div style={{ marginTop: '1rem' }}>
                    <TextControl
                        id="code-block-pro-copy-button-text"
                        autoComplete="off"
                        label={__('Button label', 'code-block-pro')}
                        placeholder={__('Copy', 'code-block-pro')}
                        onChange={(copyButtonString) => {
                            setAttributes({ copyButtonString });
                        }}
                        value={attributes.copyButtonString ?? ''}
                    />
                    {attributes.copyButtonType === 'textSimple' && (
                        <TextControl
                            id="code-block-pro-copy-button-text-copied"
                            autoComplete="off"
                            label={__('Copied Text', 'code-block-pro')}
                            placeholder={__('Copied!', 'code-block-pro')}
                            onChange={(copyButtonStringCopied) => {
                                setAttributes({ copyButtonStringCopied });
                            }}
                            value={attributes.copyButtonStringCopied ?? ''}
                            help={__(
                                'Text briefly shown after the code is copied',
                            )}
                        />
                    )}
                </div>
            )}
        </BaseControl>
    );
};
