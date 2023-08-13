import { Attributes } from '../../../types';
import { findBackgroundColor } from '../../../util/colors';

export const Headlights = (attributes: Attributes) => (
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
    </span>
);
