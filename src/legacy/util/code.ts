export const escapeShortcodes = (content: string) =>
	content.replaceAll(/\[([^[\]]+)\]/g, (match) =>
		match.replace('[', '&#91;').replace(']', '&#93;'),
	);
