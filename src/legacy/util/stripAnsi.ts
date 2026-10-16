// strip-ansi 7.2.0 + ansi-regex 6.2.2 (MIT, Sindre Sorhus). Its output is stored in data-code.
const ST = '(?:\\u0007|\\u001B\\u005C|\\u009C)';
const osc = `(?:\\u001B\\][\\s\\S]*?${ST})`;
const csi =
	'[\\u001B\\u009B][[\\]()#;?]*(?:\\d{1,4}(?:[;:]\\d{0,4})*)?[\\dA-PR-TZcf-nq-uy=><~]';
const regex = new RegExp(`${osc}|${csi}`, 'g');

export const stripAnsi = (string: string) => {
	if (typeof string !== 'string') {
		throw new TypeError(`Expected a \`string\`, got \`${typeof string}\``);
	}
	if (!string.includes('\u001B') && !string.includes('\u009B')) {
		return string;
	}
	return string.replace(regex, '');
};
