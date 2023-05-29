import { Attributes } from '../../../types';
import { CopyButton } from './CopyButton';

export const ButtonList = (props: Attributes) => {
    const { copyButton } = props;
    return copyButton ? <CopyButton attributes={props} /> : null;
};
