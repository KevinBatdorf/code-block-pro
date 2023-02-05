import { __ } from '@wordpress/i18n';
import { colord, AnyColor } from 'colord';
import { Attributes } from '../../../types';

export const SeeMoreSimple = ({
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
            {/* Footer padding is normally disabled, but since this button is opacity: 0 on start, if the JS fails it will look bad with the padding at 0 */}
            <span
                aria-hidden={true}
                style={{
                    width: '100%',
                    height: 10,
                    backgroundColor,
                }}
            />
            {/* span is used to avoid theme button styling */}
            <span
                role="button"
                className="cbp-see-more-simple-btn"
                tabIndex={0}
                style={{
                    color,
                    backgroundColor,
                    padding: disablePadding ? 0 : '10px 16px',
                    cursor: 'default',
                    opacity: context === 'front' ? 0 : 1,
                }}>
                {seeMoreString || __('Expand', 'code-block-pro')}
            </span>
        </div>
    );
};
