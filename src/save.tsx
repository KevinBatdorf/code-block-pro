import { RawHTML } from '@wordpress/element';
import type { Attributes } from './types';

// Returning null here erases every 1.x block in a post the next time it is saved.
export const save = ({ attributes }: { attributes: Attributes }) =>
	attributes.version === undefined ? (
		<RawHTML>{attributes.legacyContent ?? ''}</RawHTML>
	) : null;
