import { colord, AnyColor } from 'colord';
import { Lang } from 'shiki';
import { Attributes } from '../../../types';
import { languages } from '../../../util/languages';

export const SimpleString = ({
    language,
    bgColor,
    textColor,
    headerString,
}: Partial<Attributes>) => {
    const bgC = colord(bgColor as AnyColor);
    const bg = bgC.isDark() ? bgC.lighten(0.05) : bgC.darken(0.05);
    const textC = colord(textColor as AnyColor);
    const text = textC.isDark() ? textC.lighten(0.05) : textC.darken(0.05);
    return (
        <span
            style={{
                display: 'flex',
                alignItems: 'center',
                padding: '10px 0px 10px 16px',
                marginBottom: '-2px',
                width: '100%',
                textAlign: 'left',
                backgroundColor: bg.toHex(),
                color: text.toHex(),
            }}>
            {headerString || languages[language as Lang]}
        </span>
    );
};
