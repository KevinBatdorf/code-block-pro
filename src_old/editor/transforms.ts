import { createBlock } from '@wordpress/blocks';
import { escapeHTML } from '@wordpress/escape-html';
import blockConfig from '../block.json';
import type { Attributes, Lang } from '../types';
import { getMainAlias } from '../util/languages';

export const transformToCBP = (attrs: any) => {
	const { content, language } = attrs;
	const decode = (value: string) => {
		const txt = document.createElement('textarea');
		txt.innerHTML = value;
		return txt.value;
	};
	return createBlock(blockConfig.name, {
		code: content ? escapeHTML(decode(content)) : undefined,
		language: getMainAlias(language) as Lang,
	});
};

export const transformFromCBP = (attrs: Attributes) => {
	const { code: content } = attrs;
	return createBlock('core/code', { content });
};
