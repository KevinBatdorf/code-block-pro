import type { Attributes } from '../types';
import { Headlights } from './headers/Headlights';
import { HeadlightsMuted } from './headers/HeadlightsMuted';
import { HeadlightsMutedAlt } from './headers/HeadlightsMutedAlt';
import { PillString } from './headers/PillString';
import { SimpleString } from './headers/SimpleString';
import { StringSmall } from './headers/StringSmall';

const unsupportedWithCssVars = ['headlightsMutedAlt'];

export const HeaderType = (attributes: Attributes) => {
	const { headerType, bgColor } = attributes;
	const isACustomTheme = bgColor?.startsWith('var(');
	if (isACustomTheme && unsupportedWithCssVars.includes(headerType ?? '')) {
		return null;
	}

	if (headerType === 'headlights') {
		return <Headlights {...attributes} />;
	}
	if (headerType === 'headlightsMuted') {
		return <HeadlightsMuted {...attributes} />;
	}
	if (headerType === 'headlightsMutedAlt') {
		return <HeadlightsMutedAlt {...attributes} />;
	}
	if (headerType === 'simpleString') {
		return <SimpleString {...attributes} />;
	}
	if (headerType === 'stringSmall') {
		return <StringSmall {...attributes} />;
	}
	if (headerType === 'pillString') {
		return <PillString {...attributes} />;
	}
	return null;
};
