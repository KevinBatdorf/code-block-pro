import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import type { BlockEditProps } from '@wordpress/blocks';
import {
	ComboboxControl,
	PanelBody,
	VisuallyHidden,
} from '@wordpress/components';
import { useInstanceId } from '@wordpress/compose';
import {
	createPortal,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import languages from '../languages.json';
import type { Attributes, Pane } from '../types';
import './editor.css';
import { applyEdit, indentEdit } from './indent';
import { Panes } from './panes';
import { patchCode } from './patch';
import { loadStyles, type Preview, usePreview } from './preview';
import { ProfilePicker, ProfileToolbar } from './profiles';
import { BlockSettings, LineSettings } from './sidebar';
import { Status } from './status';

// kses rewrites raw <, > and & in block attributes for users without unfiltered_html.
const ESCAPES: Record<string, string> = {
	'&': '&amp;',
	'<': '&lt;',
	'>': '&gt;',
};
const UNESCAPES: Record<string, string> = { amp: '&', lt: '<', gt: '>' };
const encode = (code: string) => code.replace(/[&<>]/g, (c) => ESCAPES[c]);
// The textarea turns CRLF into LF, so the rendered lines must too.
const decode = (code: string) =>
	code
		.replace(/\r\n?/g, '\n')
		.replace(/&(amp|lt|gt);/g, (_, name: string) => UNESCAPES[name]);

// The server can't color these: 2.0 shows ANSI as plain text, and phiki can't compile Bicep's grammar.
const UNCOLORED = ['ansi', 'bicep'];

const LANGUAGES = [
	{ value: '', label: __('Plain text', 'code-block-pro') },
	...Object.entries(languages as Record<string, string>)
		.filter(([value]) => !UNCOLORED.includes(value))
		.filter(([, name], i, all) => all.findIndex(([, n]) => n === name) === i)
		.map(([value, label]) => ({ value, label })),
];

const SKELETON =
	'<div class="cbp-block"><div class="cbp-pane"><pre tabindex="0"><code><span class="line"></span></code></pre></div></div>';

const blockOf = (root: ParentNode) => root.querySelector('.cbp-block');
const panesOf = (block: Element | null) =>
	Array.from(block?.querySelectorAll(':scope > .cbp-pane') ?? []);
const preOf = (root: ParentNode, index: number) =>
	panesOf(blockOf(root))[index]?.querySelector<HTMLElement>(':scope > pre') ??
	null;

const themeClasses = (pane: Element | undefined) =>
	(pane?.getAttribute('data-cbp-theme') ?? '').split(' ').filter(Boolean);

const select = (root: ParentNode, index: number) => {
	const block = blockOf(root);
	const panes = panesOf(block);
	const shown = panes[index];
	if (!block || !shown) return;
	panes.forEach((pane) => pane.classList.toggle('cbp-active', pane === shown));
	block.querySelectorAll<HTMLElement>('.cbp-tab').forEach((tab, i) => {
		tab.setAttribute('aria-selected', String(i === index));
		tab.tabIndex = i === index ? 0 : -1;
	});
	for (const el of block.querySelectorAll(
		':scope > .cbp-header, :scope > .cbp-footer',
	)) {
		el.classList.remove(...themeClasses(panes[0]));
		el.classList.add(...themeClasses(shown));
	}
};

// A tab added since the last render has no pane yet, and the textarea needs one to sit in.
const addMissingPanes = (root: ParentNode, index: number) => {
	const panes = panesOf(blockOf(root));
	let last = panes.at(-1);
	for (let i = panes.length; last && i <= index; i++) {
		const pane = last.cloneNode(true) as Element;
		pane.removeAttribute('id');
		for (const extra of pane.querySelectorAll(
			':scope > .cbp-pane-label, :scope > .cbp-more',
		)) {
			extra.remove();
		}
		const code = pane.querySelector(':scope > pre > code');
		if (code) code.innerHTML = '<span class="line"></span>';
		last.after(pane);
		last = pane;
	}
};

const TAB_KEYS: Record<string, (at: number, count: number) => number> = {
	ArrowRight: (at, count) => (at + 1) % count,
	ArrowLeft: (at, count) => (at - 1 + count) % count,
	Home: () => 0,
	End: (_, count) => count - 1,
};

const pathTo = (root: Node, el: Element) => {
	const path: Element[] = [];
	for (let node: Element | null = el; node && node !== root;) {
		path.unshift(node);
		node = node.parentElement;
	}
	return path;
};

const syncAttributes = (live: Element, next: Element) => {
	for (const { name } of Array.from(live.attributes)) {
		if (!next.hasAttribute(name)) live.removeAttribute(name);
	}
	for (const { name, value } of Array.from(next.attributes)) {
		if (live.getAttribute(name) !== value) live.setAttribute(name, value);
	}
};

const replaceAround = (
	live: ParentNode,
	next: ParentNode,
	keep: Element,
	nextKeep: Element | null,
) => {
	const nodes = Array.from(next.childNodes);
	const at = nextKeep ? nodes.indexOf(nextKeep) : nodes.length;
	for (const child of Array.from(live.childNodes)) {
		if (child !== keep) child.remove();
	}
	keep.before(...nodes.slice(0, at));
	keep.after(...nodes.slice(at + 1));
};

// Only the lines between the first and last that differ are swapped; replacing thousands froze typing.
const mergeLines = (live: Element, next: Element) => {
	const old = Array.from(live.childNodes);
	const fresh = Array.from(next.childNodes);
	let start = 0;
	while (
		start < old.length &&
		start < fresh.length &&
		old[start].isEqualNode(fresh[start])
	) {
		start++;
	}
	let end = 0;
	while (
		end < old.length - start &&
		end < fresh.length - start &&
		old[old.length - 1 - end].isEqualNode(fresh[fresh.length - 1 - end])
	) {
		end++;
	}
	const after = old[old.length - end] ?? null;
	for (const node of old.slice(start, old.length - end)) node.remove();
	for (const node of fresh.slice(start, fresh.length - end)) {
		live.insertBefore(node, after);
	}
};

const sameShape = (pre: Element, nextPre: Element) =>
	pre.children.length === 2 &&
	pre.firstElementChild?.tagName === 'CODE' &&
	nextPre.children.length === 1 &&
	nextPre.firstElementChild?.tagName === 'CODE';

/**
 * Swaps in a new render without moving the textarea's `<pre>`, which would drop focus mid-word.
 * False when the two renders differ in shape and the caller has to start over.
 */
const merge = (
	root: Element,
	next: DocumentFragment,
	pre: Element,
	index: number,
) => {
	const nextPre = preOf(next, index);
	const input = pre.querySelector(':scope > textarea');
	if (!nextPre || !input || !root.contains(pre)) return false;
	const live = pathTo(root, pre);
	const fresh = pathTo(next, nextPre);
	if (
		live.length !== fresh.length ||
		live.some((el, i) => el.tagName !== fresh[i].tagName)
	) {
		return false;
	}
	replaceAround(root, next, live[0], fresh[0]);
	live.forEach((el, i) => {
		syncAttributes(el, fresh[i]);
		if (el === pre && sameShape(pre, fresh[i])) {
			const code = pre.firstElementChild as Element;
			const nextCode = fresh[i].firstElementChild as Element;
			syncAttributes(code, nextCode);
			mergeLines(code, nextCode);
			return;
		}
		replaceAround(el, fresh[i], live[i + 1] ?? input, fresh[i + 1] ?? null);
	});
	return true;
};

export const CodeEditor = ({
	attributes,
	setAttributes,
	isSelected,
}: BlockEditProps<Attributes>) => {
	const { panes = [] } = attributes;
	const [active, setActive] = useState(0);
	const index = Math.min(active, Math.max(panes.length - 1, 0));
	const pane: Pane = panes[index] ?? {};
	const code = decode(pane.code ?? '');
	const instance = useInstanceId(CodeEditor);
	const { preview, busy, error, retry } = usePreview(
		attributes,
		`cbp-e${instance}`,
	);
	const host = useRef<HTMLDivElement>(null);
	// A render replaces the tab buttons, so the tab that had focus is refocused after it.
	const focusTab = useRef<number | null>(null);
	const [pre, setPre] = useState<HTMLElement | null>(null);
	const installed = useRef<{
		preview: Preview | null;
		index: number;
		html: string;
		// The text the render shows, and the text the lines read now that typing has patched them.
		rendered: string;
		current: string;
		patched: boolean;
	} | null>(null);
	const blockProps = useBlockProps({ className: 'cbp-editor' });
	const hint = `code-block-pro-hint-${instance}`;
	// The 1.x stylesheet loads here for 1.x blocks and restyles anything under this class.
	blockProps.className = blockProps.className
		.replace(/\bwp-block-kevinbatdorf-code-block-pro\b/, '')
		.trim();

	const setPane = (changes: Pane) =>
		setAttributes({
			panes: panes.length
				? panes.map((each, i) => (i === index ? { ...each, ...changes } : each))
				: [changes],
		});

	useLayoutEffect(() => {
		const root = host.current;
		if (!root) return;
		const last = installed.current;
		const html = preview?.html ?? SKELETON;
		const patched = last?.patched ?? false;
		const changed = last?.preview !== preview || last?.index !== index;
		// A render the lines already show, unpatched, would cost a full swap for nothing.
		const same = last?.index === index && last.html === html && !patched;
		if (changed && same && last) last.preview = preview;
		// Typing back to the rendered text leaves split and empty spans; the render itself is exact.
		else if (changed || (patched && code === last?.rendered)) {
			const template = root.ownerDocument.createElement('template');
			template.innerHTML = html;
			addMissingPanes(template.content, index);
			select(template.content, index);
			const live = root.querySelector<HTMLElement>('pre:has(> textarea)');
			if (!live || !merge(root, template.content, live, index)) {
				root.replaceChildren(template.content);
			}
			const shown = preOf(root, index);
			const text = shown?.querySelector(':scope > code')?.textContent ?? '';
			installed.current = {
				preview,
				index,
				html,
				rendered: text,
				current: text,
				patched: false,
			};
			setPre(shown);
			if (preview) loadStyles(root.ownerDocument, preview.styles);
		}
		if (focusTab.current !== null) {
			root.querySelectorAll<HTMLElement>('.cbp-tab')[focusTab.current]?.focus();
			focusTab.current = null;
		}
		const lines = preOf(root, index)?.querySelector(':scope > code');
		const state = installed.current;
		if (!lines || !state || code === state.current) return;
		patchCode(lines, code, state.current);
		state.current = code;
		state.patched = true;
	}, [preview, index, code]);

	// The editor focuses a new block before the textarea exists, leaving focus on the wrapper.
	useEffect(() => {
		const input = pre?.querySelector<HTMLElement>(':scope > textarea');
		const wrapper = host.current?.parentElement;
		const focused = input?.ownerDocument.activeElement;
		if (!input || !isSelected) return;
		if (focused === wrapper || focused === input.ownerDocument.body)
			input.focus();
	}, [pre, isSelected]);

	// Tab indents until Escape; then the next Tab leaves the code, as in other code editors.
	// Native, so it runs before the block editor's own Tab handling moves focus.
	const indent = preview?.indent ?? '  ';
	useEffect(() => {
		const input = pre?.querySelector<HTMLTextAreaElement>(':scope > textarea');
		if (!input) return undefined;
		let released = false;
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				released = true;
				return;
			}
			const tab = event.key === 'Tab' && !event.altKey && !event.ctrlKey;
			if (!tab || event.metaKey || event.isComposing) {
				if (event.key !== 'Shift') released = false;
				return;
			}
			if (released) return;
			event.preventDefault();
			const { value, selectionStart, selectionEnd } = input;
			applyEdit(
				input,
				indentEdit(value, selectionStart, selectionEnd, indent, {
					outdent: event.shiftKey,
				}),
			);
		};
		const onFocus = () => {
			released = false;
		};
		input.addEventListener('keydown', onKeyDown);
		input.addEventListener('focus', onFocus);
		return () => {
			input.removeEventListener('keydown', onKeyDown);
			input.removeEventListener('focus', onFocus);
		};
	}, [pre, indent]);

	useEffect(() => {
		const root = host.current;
		if (!root) return undefined;
		const tabs = () => Array.from(root.querySelectorAll('.cbp-tab'));
		const choose = (next: number) => {
			focusTab.current = next;
			setActive(next);
		};
		const onClick = (event: MouseEvent) => {
			const tab = (event.target as Element).closest('.cbp-tab');
			if (tab) choose(tabs().indexOf(tab));
		};
		const onKeyDown = (event: KeyboardEvent) => {
			const tab = (event.target as Element).closest('.cbp-tab');
			const move = TAB_KEYS[event.key];
			if (!tab || !move) return;
			event.preventDefault();
			const all = tabs();
			choose(move(all.indexOf(tab), all.length));
		};
		root.addEventListener('click', onClick);
		root.addEventListener('keydown', onKeyDown);
		return () => {
			root.removeEventListener('click', onClick);
			root.removeEventListener('keydown', onKeyDown);
		};
	}, []);

	return (
		<div {...blockProps}>
			<ProfileToolbar
				value={attributes.profile ?? 'default'}
				onChange={(profile) => setAttributes({ profile })}
			/>
			<Status
				waiting={busy}
				issues={preview?.issues ?? []}
				error={error}
				retry={retry}
			/>
			{/* The content group still shows when the block sits in a pattern or template part. */}
			<InspectorControls group="content">
				<PanelBody title={__('Code', 'code-block-pro')}>
					<Panes
						panes={panes}
						active={index}
						onSelect={setActive}
						onChange={(next, selected) => {
							setAttributes({ panes: next });
							setActive(selected);
						}}
					/>
					<ComboboxControl
						__next40pxDefaultSize
						label={__('Language', 'code-block-pro')}
						value={pane.language ?? ''}
						options={LANGUAGES}
						onChange={(language) => setPane({ language: language ?? '' })}
					/>
				</PanelBody>
			</InspectorControls>
			<InspectorControls>
				<PanelBody title={__('Profile', 'code-block-pro')}>
					<ProfilePicker
						value={attributes.profile ?? 'default'}
						onChange={(profile) => setAttributes({ profile })}
					/>
				</PanelBody>
				<LineSettings
					pane={pane}
					attributes={attributes}
					onPane={setPane}
					onBlock={setAttributes}
				/>
				<BlockSettings attributes={attributes} onBlock={setAttributes} />
			</InspectorControls>
			<div ref={host} aria-busy={busy} />
			<VisuallyHidden id={hint}>
				{__(
					'Tab indents. Press Escape, then Tab, to leave the code.',
					'code-block-pro',
				)}
			</VisuallyHidden>
			{pre &&
				createPortal(
					<textarea
						className="cbp-input"
						aria-label={__('Code', 'code-block-pro')}
						aria-describedby={hint}
						value={code}
						rows={1}
						cols={1}
						spellCheck={false}
						autoCapitalize="off"
						autoComplete="off"
						autoCorrect="off"
						onChange={(event) => setPane({ code: encode(event.target.value) })}
						onScroll={(event) => {
							event.currentTarget.scrollTop = 0;
							event.currentTarget.scrollLeft = 0;
						}}
					/>,
					pre,
				)}
		</div>
	);
};
