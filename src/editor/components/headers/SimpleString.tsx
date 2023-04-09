import { colord, AnyColor } from 'colord';
import { Attributes, Lang } from '../../../types';
import { languages } from '../../../util/languages';

export const SimpleString = ({
    language,
    bgColor,
    textColor,
    headerString,
}: Partial<Attributes>) => {
    const bgC = colord(bgColor as AnyColor);
    let bg = bgC.isDark()
        ? bgC.lighten(0.05).toHex()
        : bgC.darken(0.05).toHex();
    const textC = colord(textColor as AnyColor);
    let text = textC.isDark()
        ? textC.lighten(0.05).toHex()
        : textC.darken(0.05).toHex();

    if (bgColor?.startsWith('var(')) {
        bg = bgColor;
    }
    if (textColor?.startsWith('var(')) {
        text = textColor;
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
