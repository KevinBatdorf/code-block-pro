import { HeadlightsIcon } from '../../icons';
import { Attributes } from '../../types';

export const HeaderType = ({ headerType, bgColor }: Partial<Attributes>) => {
    if (headerType === 'headlights') {
        return (
            <span
                style={{
                    display: 'block',
                    padding: '16px 0 0 16px',
                    marginBottom: '-1px',
                    width: '100%',
                    backgroundColor: bgColor,
                }}>
                <HeadlightsIcon />
            </span>
        );
    }
    return null;
};
