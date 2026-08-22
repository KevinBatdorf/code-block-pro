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
				'The next version of Code Block Pro requires PHP %s or newer and mbregex, part of the PHP mbstring extension. This server has neither, so plugin updates are paused here. Your host can provide both.',
				'code-block-pro',
			),
			nextPhp,
		);
	}
	if (needsPhp) {
		return sprintf(
			// translators: %s is a PHP version number, such as 8.2
			__(
				'The next version of Code Block Pro requires PHP %s or newer. This server runs an older PHP, so it will not be offered the next version. Your host can upgrade it.',
				'code-block-pro',
			),
			nextPhp,
		);
	}
	return __(
		'The next version of Code Block Pro requires mbregex, part of the PHP mbstring extension. This server was built without it, so plugin updates are paused here. Your host can move the site to a PHP build that includes it.',
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
			<Notice status="warning" isDismissible={false}>
				{requirementMessage({
					needsPhp,
					needsMbregex,
					nextPhp: nextPhp ?? '8.2',
				})}
			</Notice>
		</div>
	);
};
