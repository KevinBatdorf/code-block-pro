import { Attributes, Lang } from '../../../types';
import { computeLineHighlightColor, findTextColor } from '../../../util/colors';
import { languages } from '../../../util/languages';

export const StringSmall = (attributes: Attributes) => {
    const { language, bgColor, textColor, headerString } = attributes;
    let textBorder = computeLineHighlightColor(textColor, attributes);

    if (textColor?.startsWith('var(')) {
        textBorder = findTextColor(attributes) ?? textColor;
    }
    return (
        <span
            style={{
                display: 'flex',
                alignItems: 'center',
                padding: '10px 0px 0 16px',
                fontSize: '0.8em',
                width: '100%',
                textAlign: 'left',
                backgroundColor: bgColor,
                fontStyle: 'italic',
                color: textColor,
            }}>
            <span
                style={{
                    borderBottom: `1px solid ${textBorder}`,
                }}>
                {headerString || languages[language as Lang]}
            </span>
        </span>
    );
};
