import apiFetch from '@wordpress/api-fetch';
import { useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import type { Attributes } from '../types';

export type Issue = { code: string; message: string };

type Response = {
	html: string;
	styles: { handle: string; href: string }[];
	ms: number;
	indent: string;
	issues?: Issue[];
};

export type Preview = Response & { body: string };

// Caps typing on a fast server at a few requests a second; a slow one is paced by its replies.
const SPACING = 150;

// Recent renders by attributes, so a block that remounts shows its code at once, not a blank skeleton.
const recent = new Map<string, Preview>();
const remember = (preview: Preview) => {
	recent.delete(preview.body);
	recent.set(preview.body, preview);
	let size = 0;
	for (const [body, each] of Array.from(recent).toReversed()) {
		size += each.html.length;
		// A few long blocks' worth; one of 3,000 lines is about 8 MB of HTML.
		if (size > 32_000_000 || recent.size > 20) recent.delete(body);
	}
};

const messageOf = (error: unknown) =>
	error && typeof error === 'object' && 'message' in error
		? String(error.message)
		: __('The server did not answer.', 'code-block-pro');

/**
 * The block as the server renders it for visitors, markers left in the code.
 * One request at a time and one waiting, the newest edit, so a slow server never builds a queue.
 */
export const usePreview = (attributes: Attributes, uid: string) => {
	const { legacyContent: _legacy, ...rest } = attributes;
	const body = JSON.stringify(rest);
	const [preview, setPreview] = useState<Preview | null>(
		() => recent.get(body) ?? null,
	);
	// The code as the block opened with it, saved or not; its render can fill the page's cache entry.
	const opened = useRef(body);
	const [error, setError] = useState('');
	const [attempt, setAttempt] = useState(0);
	const queue = useRef({
		busy: false,
		next: '',
		last: Number.NEGATIVE_INFINITY,
		timer: 0,
		disposed: false,
	});

	useEffect(() => {
		const state = queue.current;
		state.disposed = false;
		return () => {
			state.disposed = true;
			window.clearTimeout(state.timer);
		};
	}, []);

	useEffect(() => {
		const state = queue.current;
		const sendNext = () => {
			const { next } = state;
			state.next = '';
			if (next && !state.disposed) send(next);
		};
		const send = (data: string) => {
			if (state.busy || state.timer) {
				state.next = data;
				return;
			}
			const wait = state.last + SPACING - performance.now();
			if (wait > 0) {
				state.next = data;
				state.timer = window.setTimeout(() => {
					state.timer = 0;
					sendNext();
				}, wait);
				return;
			}
			state.busy = true;
			state.last = performance.now();
			apiFetch<Response>({
				path: '/code-block-pro/v1/preview',
				method: 'POST',
				data: {
					attributes: JSON.parse(data),
					keepMarkers: true,
					uid,
					saved: data === opened.current,
				},
			})
				.then((response) => {
					if (state.disposed) return;
					const next = { ...response, body: data };
					remember(next);
					setPreview(next);
					setError('');
				})
				.catch((failure: unknown) => {
					if (!state.disposed) setError(messageOf(failure));
				})
				.finally(() => {
					state.busy = false;
					if (state.next === data) state.next = '';
					sendNext();
				});
		};
		send(body);
	}, [body, attempt, uid]);

	return {
		preview,
		busy: preview?.body !== body,
		error,
		retry: () => setAttempt((count) => count + 1),
	};
};

export const loadStyles = (doc: Document, styles: Response['styles']) => {
	for (const { handle, href } of styles) {
		const id = `${handle}-css`;
		const link = doc.getElementById(id);
		// Not instanceof: the canvas iframe has its own HTMLLinkElement, and a missed link is added again.
		if (link?.tagName === 'LINK') {
			if ((link as HTMLLinkElement).href !== href) {
				(link as HTMLLinkElement).href = href;
			}
			continue;
		}
		const added = doc.createElement('link');
		added.id = id;
		added.rel = 'stylesheet';
		added.href = href;
		doc.head.append(added);
	}
};
