import { __ } from '@wordpress/i18n';
import { Icon, textColor } from '@wordpress/icons';

export const TextSimple = ({
    text,
    color,
}: {
    text?: string;
    color?: string;
}) => {
    if (text === undefined) {
        return (
            <Icon
                icon={textColor}
                fill={color}
                className="border border-solid border-gray-900"
            />
        );
    }
    return (
        <span className="cbp-btn-text">
            {text || __('Copy', 'code-block-pro')}
        </span>
    );
};
