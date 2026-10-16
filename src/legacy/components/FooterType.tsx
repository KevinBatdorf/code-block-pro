import type { Attributes } from '../types';
import { SimpleStringEnd } from './footers/SimpleStringEnd';
import { SimpleStringStart } from './footers/SimpleStringStart';

export const FooterType = (props: Attributes) => {
	const { footerType } = props;
	if (footerType === 'simpleStringEnd') {
		return <SimpleStringEnd {...props} />;
	}
	if (footerType === 'simpleStringStart') {
		return <SimpleStringStart {...props} />;
	}

	return null;
};
