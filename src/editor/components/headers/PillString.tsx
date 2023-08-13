import { colord, AnyColor } from 'colord';
import { Attributes, Lang } from '../../../types';
import { findBackgroundColor, findTextColor } from '../../../util/colors';
import { languages } from '../../../util/languages';

export const PillString = (attributes: Attributes) => {
    const { language, bgColor, textColor, headerString } = attributes;
    const bgC = colord(bgColor as AnyColor);
    let bg = bgC.toHex();
    const textC = colord(textColor as AnyColor);
    let text = textC.isDark()
        ? textC.lighten(0.05).toHex()
        : textC.darken(0.05).toHex();

    if (bgColor?.startsWith('var(')) {
        bg = findBackgroundColor(attributes) ?? bgColor;
    }
    if (textColor?.startsWith('var(')) {
        text = findTextColor(attributes) ?? textColor;
    }

    return (
        <span
            style={{
                display: 'flex',
                alignItems: 'center',
                padding: '16px 0 0 16px',
                width: '100%',
                textAlign: 'left',
                backgroundColor: bg,
            }}>
            <span
                style={{
                    background: text,
                    padding: '0.3rem 0.5rem 0.2rem',
                    borderRadius: '1rem',
                    fontSize: '0.8em',
                    lineHeight: 1,
                    height: '1.25rem',
                    textAlign: 'center',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: bg,
                }}>
                {headerString || languages[language as Lang]}
            </span>
        </span>
    );
};
