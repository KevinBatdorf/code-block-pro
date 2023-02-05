import { BaseControl } from '@wordpress/components';
import { sprintf, __ } from '@wordpress/i18n';
import { Attributes } from '../../types';
import { Headlights } from './headers/Headlights';
import { HeadlightsMuted } from './headers/HeadlightsMuted';
import { HeadlightsMutedAlt } from './headers/HeadlightsMutedAlt';
import { SimpleString } from './headers/SimpleString';

type HeaderSelectProps = {
    attributes: Attributes;
    onClick: (slug: string) => void;
};
export const HeaderSelect = ({ attributes, onClick }: HeaderSelectProps) => {
    const { headerType, ...attributesWithoutHeaderType }: Partial<Attributes> =
        attributes;
    const { bgColor } = attributes;
    const types = {
        none: __('None', 'code-block-pro'),
        headlights: __('Headlights', 'code-block-pro'),
        headlightsMuted: __('Headlights muted', 'code-block-pro'),
        headlightsMutedAlt: __('Headlights muted alt', 'code-block-pro'),
        simpleString: __('Simple string', 'code-block-pro'),
    };

    return (
        <div className="code-block-pro-editor">
            {Object.entries(types).map(([slug, type]) => (
                <BaseControl
                    id={`code-block-pro-header-${slug}`}
                    label={
                        headerType === slug
                            ? sprintf(
                                  __('%s (current)', 'code-block-pro'),
                                  type,
                              )
                            : type
                    }
                    help={
                        ['simpleString'].includes(slug)
                            ? // Settings refers to the panel that can be expanded
                              __(
                                  'Update extras in the Settings panel',
                                  'code-block-pro',
                              )
                            : undefined
                    }
                    key={slug}>
                    <button
                        id={`code-block-pro-header-${slug}`}
                        type="button"
                        onClick={() => onClick(slug)}
                        className="p-0 border flex items-start w-full text-left outline-none cursor-pointer no-underline ring-offset-2 ring-offset-white focus:shadow-none focus:ring-wp overflow-x-auto">
                        <span className="pointer-events-none w-full">
                            <HeaderType
                                headerType={slug}
                                {...attributesWithoutHeaderType}
                            />
                            <span
                                className="block w-full h-8"
                                style={{ backgroundColor: bgColor }}
                            />
                        </span>
                    </button>
                </BaseControl>
            ))}
        </div>
    );
};

export const HeaderType = (attributes: Partial<Attributes>) => {
    const { headerType } = attributes;
    if (headerType === 'headlights') {
        return <Headlights {...attributes} />;
    }
    if (headerType === 'headlightsMuted') {
        return <HeadlightsMuted {...attributes} />;
    }
    if (headerType === 'headlightsMutedAlt') {
        return <HeadlightsMutedAlt {...attributes} />;
    }
    if (headerType === 'simpleString') {
        return <SimpleString {...attributes} />;
    }
    return null;
};
