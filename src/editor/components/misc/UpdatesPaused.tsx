import { Notice } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export const UpdatesPausedNotice = () => {
	if (window.codeBlockPro?.canHighlight !== false) return null;
	return (
		<div className="code-block-pro-editor" data-cy="updates-paused">
			<Notice status="warning" isDismissible={false}>
				{__(
					'Plugin updates are paused on this site. The next version requires mbregex, part of the PHP mbstring extension, and this server was built without it. Your host can move the site to a PHP build that includes it.',
					'code-block-pro',
				)}
			</Notice>
		</div>
	);
};
