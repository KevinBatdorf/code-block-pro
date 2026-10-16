import { __ } from '@wordpress/i18n';

export const TextSimple = ({ text }: { text?: string }) => (
	<span className="cbp-btn-text">{text || __('Copy', 'code-block-pro')}</span>
);
