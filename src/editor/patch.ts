const isHigh = (unit: number) => unit >= 0xd800 && unit <= 0xdbff;
const isLow = (unit: number) => unit >= 0xdc00 && unit <= 0xdfff;

const lineOf = (code: Element, node: Node) => {
	let line: Node | null = node;
	while (line && line.parentNode !== code) line = line.parentNode;
	return line as Element | null;
};

// Before character `offset`, so text typed at a line's start lands in that line, not the one above.
const locate = (code: Element, offset: number) => {
	const walker = code.ownerDocument.createTreeWalker(
		code,
		NodeFilter.SHOW_TEXT,
	);
	let seen = 0;
	for (let node = walker.nextNode(); node; node = walker.nextNode()) {
		const text = node as Text;
		if (offset < seen + text.data.length) {
			return { node: text as Node, offset: offset - seen };
		}
		seen += text.data.length;
	}
	// The end of the code is the end of its last line, which may hold no text yet.
	const line = code.lastElementChild;
	return line ? { node: line as Node, offset: line.childNodes.length } : null;
};

const pending = (doc: Document, text: string) => {
	const span = doc.createElement('span');
	span.className = 'cbp-pending';
	span.textContent = text;
	return span;
};

const renumber = (code: Element) => {
	const lines = Array.from(code.children).filter(
		(line) => !line.classList.contains('cbp-marker'),
	);
	const start = Number(lines[0]?.getAttribute('data-line') ?? Number.NaN);
	if (Number.isNaN(start)) return;
	lines.forEach((line, i) => line.setAttribute('data-line', String(start + i)));
};

/**
 * Edits the rendered lines in place until they read `next`, typed text uncolored.
 * Every line stays one element, so the lines keep matching the textarea's.
 */
export const patchCode = (code: Element, next: string) => {
	const doc = code.ownerDocument;
	const old = code.textContent ?? '';
	if (old === next) return;

	const limit = Math.min(old.length, next.length);
	let start = 0;
	while (start < limit && old.charCodeAt(start) === next.charCodeAt(start)) {
		start++;
	}
	if (start > 0 && isHigh(next.charCodeAt(start - 1))) start--;
	let tail = 0;
	while (
		tail < limit - start &&
		old.charCodeAt(old.length - 1 - tail) ===
			next.charCodeAt(next.length - 1 - tail)
	) {
		tail++;
	}
	if (tail > 0 && isLow(next.charCodeAt(next.length - tail))) tail--;

	const from = locate(code, start);
	const to = locate(code, old.length - tail);
	const first = from && lineOf(code, from.node);
	const last = to && lineOf(code, to.node);
	if (!from || !to || !first || !last) return;

	const range = doc.createRange();
	range.setStart(from.node, from.offset);
	range.setEnd(to.node, to.offset);
	range.deleteContents();
	if (last !== first) {
		first.append(...Array.from(last.childNodes));
		last.remove();
	}
	// Deleting across lines leaves the range between them, outside any line.
	range.setStart(from.node, from.offset);
	range.collapse(true);

	const [head, ...rest] = next.slice(start, next.length - tail).split('\n');
	if (head || rest.length) {
		const node = pending(doc, rest.length ? `${head}\n` : head);
		range.insertNode(node);
		range.setStartAfter(node);
	}
	if (rest.length) {
		range.setEnd(first, first.childNodes.length);
		const remainder = range.extractContents();
		first.after(
			...rest.map((text, i) => {
				const line = doc.createElement('span');
				line.className = 'line';
				const isLast = i === rest.length - 1;
				line.append(pending(doc, isLast ? text : `${text}\n`));
				if (isLast) line.append(remainder);
				return line;
			}),
		);
	}
	if (rest.length || last !== first) renumber(code);
};
