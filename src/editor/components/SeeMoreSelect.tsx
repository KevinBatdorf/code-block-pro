import { BaseControl } from '@wordpress/components';
import { sprintf, __ } from '@wordpress/i18n';
import { Attributes } from '../../types';
import { BlockLeft } from './seemore/BlockLeft';
import { BlockRight } from './seemore/BlockRight';
import { RoundCenter } from './seemore/RoundCenter';

type SeeMoreSelectProps = {
    attributes: Attributes;
    onClick: (slug: string) => void;
};
export const SeeMoreSelect = ({ attributes, onClick }: SeeMoreSelectProps) => {
    const {
        seeMoreType,
        ...attributesWithoutSeeMoreType
    }: Partial<Attributes> = attributes;
    const { bgColor } = attributes;
    const types = {
        none: __('None', 'code-block-pro'),
        roundCenter: __('See more center', 'code-block-pro'),
        blockLeft: __('See more left', 'code-block-pro'),
        blockRight: __('See more right', 'code-block-pro'),
    };

    return (
        <div className="code-block-pro-editor">
            {Object.entries(types).map(([slug, type]) => (
                <BaseControl
                    id={`code-block-pro-see-more-${slug}`}
                    label={
                        seeMoreType === slug ||
                        (!seeMoreType && slug === 'none')
                            ? sprintf(
                                  __('%s (current)', 'code-block-pro'),
                                  type,
                              )
                            : type
                    }
                    key={slug}>
                    <button
                        id={`code-block-pro-see-more-${slug}`}
                        type="button"
                        onClick={() => onClick(slug)}
                        className="p-0 border flex items-start w-full text-left outline-none cursor-pointer no-underline ring-offset-2 ring-offset-white focus:shadow-none focus:ring-wp overflow-x-auto">
                        <span className="pointer-events-none w-full">
                            <span
                                className="block w-full h-8"
                                style={{ backgroundColor: bgColor }}
                            />
                            <SeeMoreType
                                seeMoreType={slug}
                                context="editor"
                                {...attributesWithoutSeeMoreType}
                            />
                        </span>
                    </button>
                </BaseControl>
            ))}
        </div>
    );
};

export const SeeMoreType = (
    props: Partial<Attributes> & { context?: string },
) => {
    const { seeMoreType, enableMaxHeight, context } = props;
    if (!enableMaxHeight) return null;
    if (seeMoreType === 'roundCenter') {
        return <RoundCenter {...props} context={context} />;
    }
    if (seeMoreType === 'blockLeft') {
        return <BlockLeft {...props} context={context} />;
    }
    if (seeMoreType === 'blockRight') {
        return <BlockRight {...props} context={context} />;
    }

    return null;
};
