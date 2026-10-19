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

const messageOf = (error: unknown) =>
	error && typeof error === 'object' && 'message' in error
		? String(error.message)
		: __('The server did not answer.', 'code-block-pro');

/**
 * The block as the server renders it for visitors, markers left in the code.
 * One request at a time and one waiting, the newest edit, so a slow server never builds a queue.
 */
export const usePreview = (attributes: Attributes, uid: string) => {
	const [preview, setPreview] = useState<Preview | null>(null);
	const [error, setError] = useState('');
	const [attempt, setAttempt] = useState(0);
	const queue = useRef({
		busy: false,
		next: '',
		last: Number.NEGATIVE_INFINITY,
		timer: 0,
		disposed: false,
	});
	const { legacyContent: _legacy, ...rest } = attributes;
	const body = JSON.stringify(rest);

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
				data: { attributes: JSON.parse(data), keepMarkers: true, uid },
			})
				.then((response) => {
					if (state.disposed) return;
					setPreview({ ...response, body: data });
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
		if (link instanceof HTMLLinkElement) {
			if (link.href !== href) link.href = href;
			continue;
		}
		const added = doc.createElement('link');
		added.id = id;
		added.rel = 'stylesheet';
		added.href = href;
		doc.head.append(added);
	}
};
