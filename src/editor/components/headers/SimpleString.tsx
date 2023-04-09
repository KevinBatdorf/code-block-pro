import { colord, AnyColor } from 'colord';
import { Attributes, Lang } from '../../../types';
import { findBackgroundColor, findTextColor } from '../../../util/colors';
import { languages } from '../../../util/languages';

export const SimpleString = (attributes: Partial<Attributes>) => {
    const { language, bgColor, textColor, headerString } = attributes;
    const bgC = colord(bgColor as AnyColor);
    let bg = bgC.isDark()
        ? bgC.lighten(0.05).toHex()
        : bgC.darken(0.05).toHex();
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
                padding: '10px 0px 10px 16px',
                marginBottom: '-2px',
                width: '100%',
                textAlign: 'left',
                backgroundColor: bg,
                color: text,
            }}>
            {headerString || languages[language as Lang]}
        </span>
    );
};
