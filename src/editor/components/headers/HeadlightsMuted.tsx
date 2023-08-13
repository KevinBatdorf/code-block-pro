import { colord, AnyColor } from 'colord';
import { Attributes } from '../../../types';
import { findBackgroundColor } from '../../../util/colors';

export const HeadlightsMuted = (attributes: Attributes) => {
    const { textColor } = attributes;
    return (
        <span
            style={{
                display: 'block',
                padding: '16px 0 0 16px',
                marginBottom: '-1px',
                width: '100%',
                textAlign: 'left',
                backgroundColor: findBackgroundColor(attributes),
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
                        fill={colord(textColor as AnyColor)
                            .alpha(0.2)
                            .toHex()}
                        stroke={colord(textColor as AnyColor)
                            .alpha(0.3)
                            .toHex()}
                        strokeWidth=".5"></circle>
                    <circle
                        cx="26"
                        cy="6"
                        r="6"
                        fill={colord(textColor as AnyColor)
                            .alpha(0.2)
                            .toHex()}
                        stroke={colord(textColor as AnyColor)
                            .alpha(0.3)
                            .toHex()}
                        strokeWidth=".5"></circle>
                    <circle
                        cx="46"
                        cy="6"
                        r="6"
                        fill={colord(textColor as AnyColor)
                            .alpha(0.2)
                            .toHex()}
                        stroke={colord(textColor as AnyColor)
                            .alpha(0.3)
                            .toHex()}
                        strokeWidth=".5"></circle>
                </g>
            </svg>
        </span>
    );
};
