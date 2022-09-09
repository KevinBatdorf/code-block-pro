import { colord, AnyColor } from 'colord';
import { Attributes } from '../../../types';

export const HeadlightsMutedAlt = ({ bgColor }: Partial<Attributes>) => {
    const bgC = colord(bgColor as AnyColor);
    const bg = bgC.isDark() ? bgC.lighten(0.05) : bgC.darken(0.05);
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
            }}>
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width={62}
                height={20}
                viewBox="0 0 62 20">
                <g fill="none" fillRule="evenodd" transform="translate(1 1)">
                    <circle
                        cx="8"
                        cy="8"
                        r="8"
                        fill={bgColor}
                        stroke={bgColor}
                        strokeWidth=".5"></circle>
                    <circle
                        cx="30"
                        cy="8"
                        r="8"
                        fill={bgColor}
                        stroke={bgColor}
                        strokeWidth=".5"></circle>
                    <circle
                        cx="52"
                        cy="8"
                        r="8"
                        fill={bgColor}
                        stroke={bgColor}
                        strokeWidth=".5"></circle>
                </g>
            </svg>
        </span>
    );
};
