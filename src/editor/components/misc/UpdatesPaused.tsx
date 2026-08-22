import { Notice } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';

const bothMessage = (nextPhp: string) =>
	sprintf(
		// translators: %s is a PHP version number, such as 8.2
		__(
			'Version 2 is coming! 🎉 However, it needs PHP %s or newer and mbregex, part of the PHP mbstring extension. This server has neither, so updates are paused here.',
			'code-block-pro',
		),
		nextPhp,
	);

const phpMessage = (nextPhp: string) =>
	sprintf(
		// translators: %s is a PHP version number, such as 8.2
		__(
			'Version 2 is coming! 🎉 However, it needs PHP %s or newer, and this server runs an older version. Ask your host to upgrade.',
			'code-block-pro',
		),
		nextPhp,
	);

const mbregexMessage = () =>
	__(
		'Version 2 is coming! 🎉 However, it needs mbregex, part of the PHP mbstring extension, which this server was built without. Updates are paused until your host adds it.',
		'code-block-pro',
	);

export const UpdatesPausedNotice = () => {
	const { canHighlight, hasNextPhp, nextPhp } = window.codeBlockPro ?? {};
	const needsMbregex = canHighlight === false;
	const needsPhp = hasNextPhp === false && Boolean(nextPhp);
	if (!needsPhp && !needsMbregex) return null;
	const message = () => {
		if (!needsPhp || !nextPhp) return mbregexMessage();
		return needsMbregex ? bothMessage(nextPhp) : phpMessage(nextPhp);
	};
	return (
		<div className="code-block-pro-editor" data-cy="updates-paused">
			<div className="my-6">
				<Notice status="warning" isDismissible={false}>
					{message()}
				</Notice>
			</div>
		</div>
	);
};
