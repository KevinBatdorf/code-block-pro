import { __ } from '@wordpress/i18n';
import { colord, AnyColor } from 'colord';
import { Attributes } from '../../../types';

export const RoundCenter = ({
    bgColor,
    textColor,
    seeMoreString,
    context,
    footerType,
}: Partial<Attributes> & { context?: string }) => {
    const bgC = colord(bgColor as AnyColor);
    const textC = colord(textColor as AnyColor);
    const color = bgC.isDark()
        ? textC.lighten(0.15).toHex()
        : textC.darken(0.15).toHex();
    const bg = bgC.isDark() ? bgC.lighten(0.1) : bgC.darken(0.1);
    const hasFooter = footerType !== 'none';
    const inEditor = context === 'editor';
    return (
        <div
            className="cbp-see-more-container"
            style={{
                display: context === 'front' ? 'none' : 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                width: '100%',
                fontSize: '12px',
                lineHeight: '1',
                position: 'relative',
                paddingTop: hasFooter ? 0 : '4px',
                marginBottom: hasFooter || inEditor ? 0 : '-16px',
                height: hasFooter && !inEditor ? 0 : '32px',
            }}>
            {/* bg 50% height at top */}
            {!hasFooter && (
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
            )}
            {/* span is used to avoid theme button styling */}
            <span
                role={inEditor ? 'presentation' : 'button'}
                tabIndex={inEditor ? -1 : 0}
                className="cbp-see-more-simple-btn cbp-see-more-simple-btn-hover"
                style={{
                    color,
                    backgroundColor: bg.toHex(),
                    padding: '6px 14px',
                    cursor: 'default',
                    position: 'relative',
                    borderRadius: '6px',
                    transform: hasFooter ? 'translateY(-50%)' : undefined,
                }}>
                {seeMoreString || __('Expand', 'code-block-pro')}
            </span>
        </div>
    );
};
