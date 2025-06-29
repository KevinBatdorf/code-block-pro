import { escapeHTML } from '@wordpress/escape-html';
import { decodeEntities } from '@wordpress/html-entities';
import { Attributes } from '../types';

export const encode = (code: string, { useDecodeURI }: Partial<Attributes>) => {
    if (useDecodeURI) {
        try {
            // Here for bw compatability
            return encodeURIComponent(code);
        } catch (e) {
            console.error(e);
            return code;
        }
    }
    return escapeHTML(code);
};

export const decode = (code: string, { useDecodeURI }: Partial<Attributes>) => {
    if (useDecodeURI) {
        try {
            // Here for bw compatability
            return decodeURIComponent(code);
        } catch (e) {
            console.error(e);
            return code;
        }
    }
    return decodeEntities(code);
};

export const escapeShortcodes = (content: string) =>
    content.replaceAll(/\[([^[\]]+)\]/g, (match) =>
        match.replace('[', '&#91;').replace(']', '&#93;'),
    );
