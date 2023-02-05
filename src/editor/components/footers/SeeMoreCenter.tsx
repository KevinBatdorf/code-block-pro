import { __ } from '@wordpress/i18n';
import { colord, AnyColor } from 'colord';
import { Attributes } from '../../../types';

export const SeeMoreCenter = ({
    bgColor,
    textColor,
    seeMoreString,
    disablePadding,
    context,
}: Partial<Attributes> & { context?: string }) => {
    const bgC = colord(bgColor as AnyColor);
    const textC = colord(textColor as AnyColor);
    const color = bgC.isDark()
        ? textC.lighten(0.15).toHex()
        : textC.darken(0.15).toHex();
    const bg = bgC.isDark() ? bgC.lighten(0.1) : bgC.darken(0.1);
    return (
        <div
            className="cbp-see-more-container"
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                width: '100%',
                fontSize: '12px',
                lineHeight: '1',
                position: 'relative',
                paddingTop: '16px',
                height: '50px',
            }}>
            {/* bg 50% height at top */}
            <div
                style={{
                    backgroundColor: bgC.toHex(),
                    height: '50%',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                }}
                aria-hidden="true"
            />
            {/* span is used to avoid theme button styling */}
            <span
                role="button"
                className="cbp-see-more-simple-btn"
                tabIndex={0}
                style={{
                    color,
                    backgroundColor: bg.toHex(),
                    padding: '6px 14px',
                    cursor: 'default',
                    opacity: context === 'front' ? 0 : 1,
                    position: 'relative',
                    borderRadius: '6px',
                }}>
                {seeMoreString || __('Expand', 'code-block-pro')}
            </span>
        </div>
    );
};
