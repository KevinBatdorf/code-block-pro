import { Notice } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export const UpdatesPausedNotice = () => {
	const { canUpgrade } = window.codeBlockPro ?? {};
	if (canUpgrade !== false) return null;
	return (
		<div className="code-block-pro-editor" data-cy="updates-paused">
			<div className="border-0 border-b border-solid border-gray-300 py-4 [&_.components-notice]:pr-4">
				<Notice status="warning" isDismissible={false}>
					{__(
						'Version 2 is coming! 🎉 However, it needs mbregex, part of the PHP mbstring extension, which this server was built without. Updates are paused until your host adds it.',
						'code-block-pro',
					)}
				</Notice>
			</div>
		</div>
	);
};
