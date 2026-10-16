import type { Attributes } from '../types';
import { BlockLeft } from './seemore/BlockLeft';
import { BlockRight } from './seemore/BlockRight';
import { RoundCenter } from './seemore/RoundCenter';

export const SeeMoreType = (
	props: Partial<Attributes> & { context?: string },
) => {
	const { seeMoreType, enableMaxHeight, context } = props;
	if (!enableMaxHeight) return null;
	if (seeMoreType === 'roundCenter') {
		return <RoundCenter {...props} context={context} />;
	}
	if (seeMoreType === 'blockLeft') {
		return <BlockLeft {...props} context={context} />;
	}
	if (seeMoreType === 'blockRight') {
		return <BlockRight {...props} context={context} />;
	}

	return null;
};
