import { __ } from '@wordpress/i18n';
import { colord, AnyColor } from 'colord';
import { Attributes } from '../../../types';

export const SeeMoreLeft = ({
    bgColor,
    textColor,
    seeMoreString,
    disablePadding,
    context,
}: Partial<Attributes> & { context?: string }) => {
    const backgroundColor = colord(bgColor as AnyColor).toHex();
    const textC = colord(textColor as AnyColor);
    const color = textC.isDark()
        ? textC.lighten(0.05).toHex()
        : textC.darken(0.05).toHex();
    return (
        <div
            className="cbp-see-more-container"
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                width: '100%',
                backgroundColor: 'transparent',
                fontSize: '12px',
                lineHeight: '1',
                position: 'relative',
            }}>
            {/* span is used to avoid theme button styling */}
            <span
                role="button"
                className="cbp-see-more-simple-btn"
                tabIndex={0}
                style={{
                    color,
                    backgroundColor,
                    padding: disablePadding ? '10px 0 0' : '10px 16px',
                    cursor: 'default',
                    opacity: context === 'front' ? 0 : 1,
                }}>
                {seeMoreString || __('Expand', 'code-block-pro')}
            </span>
        </div>
    );
};
