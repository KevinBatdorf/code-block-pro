import { type BlockConfiguration, registerBlockType } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';
import metadata from './block.json';
import { Edit } from './edit';
import { blockIcon } from './icon';
import { save } from './save';
import type { Attributes } from './types';

registerBlockType<Attributes>(metadata as BlockConfiguration<Attributes>, {
	title: __('Code Pro', 'code-block-pro'),
	icon: blockIcon,
	// block.json can't translate defaults, and 1.x omitted any value equal to the translated one.
	attributes: {
		...metadata.attributes,
		copyButtonString: {
			type: 'string',
			default: __('Copy', 'code-block-pro'),
		},
		copyButtonStringCopied: {
			type: 'string',
			default: __('Copied!', 'code-block-pro'),
		},
	} as BlockConfiguration<Attributes>['attributes'],
	edit: Edit,
	save,
});
