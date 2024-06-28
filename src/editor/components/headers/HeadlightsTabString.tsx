import { colord, AnyColor } from "colord";
import { Attributes, Lang } from '../../../types';
import { findBackgroundColor, findTextColor } from '../../../util/colors';
import { languages } from '../../../util/languages';

export const HeadlightsTabString = (attributes: Attributes) => {
    const {language, bgColor, textColor, headerString} = attributes;
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
                display: 'block',
                padding: '5px 0 0 16px',
                marginBottom: '-1px',
                width: '100%',
                textAlign: 'left',
                backgroundColor: bg,
                color: text,
            }}>
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width={54}
                height={14}
                viewBox="0 0 54 14">
                <g fill="none" fillRule="evenodd" transform="translate(1 1)">
                    <circle
                        cx="6"
                        cy="6"
                        r="6"
                        fill="#FF5F56"
                        stroke="#E0443E"
                        strokeWidth=".5"></circle>
                    <circle
                        cx="26"
                        cy="6"
                        r="6"
                        fill="#FFBD2E"
                        stroke="#DEA123"
                        strokeWidth=".5"></circle>
                    <circle
                        cx="46"
                        cy="6"
                        r="6"
                        fill="#27C93F"
                        stroke="#1AAB29"
                        strokeWidth=".5"></circle>
                </g>
            </svg>
            <span
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '5px 10px',
                    borderRadius: '0.25rem 0.25rem 0 0',
                    marginLeft: '16px',
                    textAlign: 'center',
                    color: text,
                    backgroundColor: bgColor,
                }}>
                {headerString || languages[language as Lang]}
            </span>
        </span>
    );
}
