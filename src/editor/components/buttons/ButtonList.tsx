import { Attributes } from '../../../types';
import { CopyButton } from './CopyButton';

export const ButtonList = (props: Attributes) => {
    const { buttons } = props;
    const buttonList = buttons?.split(':') || [];
    if (!buttonList.length) return null;
    return buttonList.includes('copy') ? (
        <CopyButton attributes={props} />
    ) : null;
};
