import { Notice } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';

const requirementMessage = ({
	needsPhp,
	needsMbregex,
	nextPhp,
}: {
	needsPhp: boolean;
	needsMbregex: boolean;
	nextPhp: string;
}) => {
	if (needsPhp && needsMbregex) {
		return sprintf(
			// translators: %s is a PHP version number, such as 8.2
			__(
				'Version 2 is coming! 🎉 However, it needs PHP %s or newer and mbregex, part of the PHP mbstring extension. This server has neither, so updates are paused here.',
				'code-block-pro',
			),
			nextPhp,
		);
	}
	if (needsPhp) {
		return sprintf(
			// translators: %s is a PHP version number, such as 8.2
			__(
				'Version 2 is coming! 🎉 However, it needs PHP %s or newer, and this server runs an older version. Ask your host to upgrade.',
				'code-block-pro',
			),
			nextPhp,
		);
	}
	return __(
		'Version 2 is coming! 🎉 However, it needs mbregex, part of the PHP mbstring extension, which this server was built without. Updates are paused until your host adds it.',
		'code-block-pro',
	);
};

export const UpdatesPausedNotice = () => {
	const { canHighlight, hasNextPhp, nextPhp } = window.codeBlockPro ?? {};
	const needsPhp = hasNextPhp === false;
	const needsMbregex = canHighlight === false;
	if (!needsPhp && !needsMbregex) return null;
	return (
		<div className="code-block-pro-editor" data-cy="updates-paused">
			<div className="my-6">
				<Notice status="warning" isDismissible={false}>
					{requirementMessage({
						needsPhp,
						needsMbregex,
						nextPhp: nextPhp ?? '8.2',
					})}
				</Notice>
			</div>
		</div>
	);
};
