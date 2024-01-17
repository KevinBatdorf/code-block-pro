import { BaseControl } from '@wordpress/components';
import { sprintf, __ } from '@wordpress/i18n';
import { Attributes } from '../../types';
import { SimpleStringEnd } from './footers/SimpleStringEnd';
import { SimpleStringStart } from './footers/SimpleStringStart';

type FooterSelectProps = {
    attributes: Attributes;
    onClick: (slug: string) => void;
};
export const FooterSelect = ({ attributes, onClick }: FooterSelectProps) => {
    const { footerType, ...attributesWithoutFooterType } = attributes;
    const { bgColor } = attributes;
    const types = {
        none: __('None', 'code-block-pro'),
        simpleStringEnd: __('Simple string end', 'code-block-pro'),
        simpleStringStart: __('Simple string start', 'code-block-pro'),
    };

    return (
        <div className="code-block-pro-editor">
            {Object.entries(types).map(([slug, type]) => (
                <BaseControl
                    id={`code-block-pro-footer-${slug}`}
                    label={
                        footerType === slug
                            ? sprintf(
                                  __('%s (current)', 'code-block-pro'),
                                  type,
                              )
                            : type
                    }
                    help={
                        ['simpleStringEnd', 'simpleStringStart'].includes(slug)
                            ? // Settings refers to the panel that can be expanded
                              __(
                                  'Set the text at the top of this panel.',
                                  'code-block-pro',
                              )
                            : undefined
                    }
                    key={slug}>
                    <button
                        id={`code-block-pro-footer-${slug}`}
                        type="button"
                        onClick={() => onClick(slug)}
                        className="p-0 border flex items-start w-full text-left outline-none cursor-pointer no-underline ring-offset-2 ring-offset-white focus:shadow-none focus:ring-wp overflow-x-auto">
                        <span className="pointer-events-none w-full">
                            <span
                                className="block w-full h-8"
                                style={{ backgroundColor: bgColor }}
                            />
                            <FooterType
                                footerType={slug}
                                {...attributesWithoutFooterType}
                            />
                        </span>
                    </button>
                </BaseControl>
            ))}
        </div>
    );
};

export const FooterType = (props: Attributes) => {
    const { footerType } = props;
    if (footerType === 'simpleStringEnd') {
        return <SimpleStringEnd {...props} />;
    }
    if (footerType === 'simpleStringStart') {
        return <SimpleStringStart {...props} />;
    }

    return null;
};
