import { BaseControl } from '@wordpress/components';
import { sprintf, __ } from '@wordpress/i18n';
import { Attributes } from '../../types';
import { Headlights } from './headers/Headlights';
import { HeadlightsMuted } from './headers/HeadlightsMuted';
import { HeadlightsMutedAlt } from './headers/HeadlightsMutedAlt';
import { PillString } from './headers/PillString';
import { SimpleString } from './headers/SimpleString';
import { StringSmall } from './headers/StringSmall';
import { UnsupportedTheme } from './misc/Unsupported';

type HeaderSelectProps = {
    attributes: Attributes;
    onClick: (slug: string) => void;
};

const unsupportedWithCssVars = ['headlightsMutedAlt'];

export const HeaderSelect = ({ attributes, onClick }: HeaderSelectProps) => {
    const { headerType, ...attributesWithoutHeaderType }: Attributes =
        attributes;
    const { bgColor } = attributes;
    const types = {
        none: __('None', 'code-block-pro'),
        headlights: __('Headlights', 'code-block-pro'),
        headlightsMuted: __('Headlights muted', 'code-block-pro'),
        headlightsMutedAlt: __('Headlights muted alt', 'code-block-pro'),
        simpleString: __('Simple string', 'code-block-pro'),
        stringSmall: __('String muted', 'code-block-pro'),
        pillString: __('Pill string', 'code-block-pro'),
    };
    const isUnsupported = bgColor?.startsWith('var(');

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
                        ['simpleString', 'pillString', 'stringSmall'].includes(
                            slug,
                        )
                            ? // Settings refers to the panel that can be expanded
                              __(
                                  'Set the text at the top of this panel.',
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
                    {isUnsupported && unsupportedWithCssVars.includes(slug) && (
                        <UnsupportedTheme />
                    )}
                </BaseControl>
            ))}
        </div>
    );
};

export const HeaderType = (attributes: Attributes) => {
    const { headerType, bgColor } = attributes;
    const isACustomTheme = bgColor?.startsWith('var(');
    if (isACustomTheme && unsupportedWithCssVars.includes(headerType ?? '')) {
        return null;
    }

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
    if (headerType === 'stringSmall') {
        return <StringSmall {...attributes} />;
    }
    if (headerType === 'pillString') {
        return <PillString {...attributes} />;
    }
    return null;
};
