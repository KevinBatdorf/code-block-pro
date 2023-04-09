import { __ } from '@wordpress/i18n';
import { colord, AnyColor } from 'colord';
import { Attributes } from '../../../types';
import { findBackgroundColor, findTextColor } from '../../../util/colors';

export const BlockRight = (
    attributes: Partial<Attributes> & { context?: string },
) => {
    const {
        bgColor,
        textColor,
        seeMoreString,
        disablePadding,
        context,
        footerType,
    } = attributes;
    let backgroundColor = colord(bgColor as AnyColor).toHex();
    const textC = colord(textColor as AnyColor);
    let color = textC.isDark()
        ? textC.lighten(0.05).toHex()
        : textC.darken(0.05).toHex();
    const hasFooter = footerType !== 'none';
    const inEditor = context === 'editor';

    if (textColor?.startsWith('var(')) {
        color = findTextColor(attributes) ?? textColor;
    }
    if (bgColor?.startsWith('var(')) {
        backgroundColor = findBackgroundColor(attributes) ?? bgColor;
    }

    return (
        <div
            className="cbp-see-more-container"
            style={{
                display: context === 'front' ? 'none' : 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                width: '100%',
                backgroundColor: 'transparent',
                fontSize: '12px',
                lineHeight: '1',
                position: 'relative',
                marginBottom: hasFooter || inEditor ? 0 : '-16px',
                height: hasFooter && !inEditor ? '16px' : '32px',
            }}>
            {/* span is used to avoid theme button styling */}
            <span
                role={inEditor ? 'presentation' : 'button'}
                tabIndex={inEditor ? -1 : 0}
                className="cbp-see-more-simple-btn cbp-see-more-simple-btn-hover"
                style={{
                    color,
                    backgroundColor,
                    padding: disablePadding ? '10px 0 0' : '10px 16px',
                    cursor: 'default',
                }}>
                {seeMoreString || __('Expand', 'code-block-pro')}
            </span>
        </div>
    );
};
