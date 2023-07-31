import { createBlock } from '@wordpress/blocks';
import { escapeHTML } from '@wordpress/escape-html';
import blockConfig from '../block.json';
import { Attributes, Lang } from '../types';
import { getMainAlias } from '../util/languages';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
