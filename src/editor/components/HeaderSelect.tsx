import { BaseControl } from '@wordpress/components';
import { sprintf, __ } from '@wordpress/i18n';
import { Attributes } from '../../types';
import { HeaderType } from './HeaderType';

type HeaderSelectProps = {
    attributes: Attributes;
    onClick: (slug: string) => void;
};
export const HeaderSelect = ({ attributes, onClick }: HeaderSelectProps) => {
    const { headerType, bgColor } = attributes;
    const types = {
        '': __('None', 'code-block-pro'),
        headlights: __('Headlights', 'code-block-pro'),
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
                    key={slug}>
                    <button
                        id={`code-block-pro-header-${slug}`}
                        type="button"
                        onClick={() => onClick(slug)}
                        className="p-0 border flex items-start w-full text-left outline-none cursor-pointer no-underline ring-offset-2 ring-offset-white focus:shadow-none focus:ring-wp overflow-x-scroll">
                        <span className="pointer-events-none w-full">
                            <HeaderType headerType={slug} bgColor={bgColor} />
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
