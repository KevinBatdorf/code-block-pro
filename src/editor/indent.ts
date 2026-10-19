type Edit = {
	from: number;
	to: number;
	text: string;
	selection: [number, number];
};

const leading = (line: string, unit: string) => {
	const spaces = unit === '\t' ? 1 : unit.length;
	return line.match(new RegExp(`^(\\t| {1,${spaces}})`))?.[0].length ?? 0;
};

/**
 * What Tab or Shift+Tab does to a textarea: insert one indent at the caret,
 * or indent or outdent every line the selection touches.
 */
export const indentEdit = (
	value: string,
	start: number,
	end: number,
	unit: string,
	{ outdent = false } = {},
): Edit => {
	if (!outdent && !value.slice(start, end).includes('\n')) {
		const caret = start + unit.length;
		return { from: start, to: end, text: unit, selection: [caret, caret] };
	}
	const from = value.lastIndexOf('\n', start - 1) + 1;
	// A selection that ends at a line's start leaves that line alone, as code editors do.
	const last = end > start && value[end - 1] === '\n' ? end - 1 : end;
	const lineEnd = value.indexOf('\n', last);
	const to = lineEnd === -1 ? value.length : lineEnd;
	const lines = value.slice(from, to).split('\n');
	const changes = lines.map((line) => {
		if (outdent) return -leading(line, unit);
		return line === '' ? 0 : unit.length;
	});
	const text = lines
		.map((line, i) =>
			outdent ? line.slice(-changes[i]) : changes[i] ? unit + line : line,
		)
		.join('\n');
	const total = changes.reduce((sum, change) => sum + change, 0);
	const first = start > from ? Math.max(changes[0], from - start) : 0;
	const selectionStart = start + first;
	return {
		from,
		to,
		text,
		selection: [selectionStart, Math.max(selectionStart, end + total)],
	};
};

/** Through the browser's own editing, so the textarea's undo keeps working. */
export const applyEdit = (input: HTMLTextAreaElement, edit: Edit) => {
	input.setSelectionRange(edit.from, edit.to);
	if (!input.ownerDocument.execCommand('insertText', false, edit.text)) {
		input.setRangeText(edit.text, edit.from, edit.to);
		input.dispatchEvent(new Event('input', { bubbles: true }));
	}
	input.setSelectionRange(...edit.selection);
};
