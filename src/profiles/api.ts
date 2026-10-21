import apiFetch from '@wordpress/api-fetch';
import {
	useEffect,
	useRef,
	useState,
	useSyncExternalStore,
} from '@wordpress/element';
import { doAction } from '@wordpress/hooks';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';
import { PROFILES_CHANGED } from '../editor/actions';
import { loadStyles } from '../editor/preview';

export type Settings = {
	fontSize: string;
	fontFamily: string;
	lineHeight: string;
	clampFonts: boolean;
	headerType: string;
	footerType: string;
	lineNumbers: boolean;
	highlightingHover: boolean;
	seeMoreType: string;
	seeMoreString: string;
	seeMoreTransition: boolean;
	seeMoreCollapse: boolean;
	seeMoreCollapseString: string;
	disablePadding: boolean;
	tabSize: number;
	useTabs: boolean;
	editorHeight: string;
};

export type Trigger =
	| { type: 'base' }
	| { type: 'media'; value: string }
	| { type: 'class'; value: string }
	| { type: 'button' };

export type Background =
	| { type: 'theme' }
	| { type: 'color'; value: string }
	| { type: 'slot' };

export type Condition = {
	id: string;
	name: string;
	theme: string;
	trigger: Trigger;
	background: Background;
};

export type Button =
	| {
			type: 'copy';
			icon: 'heroicons' | 'twoSquares' | 'textSimple';
			label: string;
			copiedLabel: string;
	  }
	| {
			type: 'toggle';
			label: string;
			conditions: string[];
			scope?: 'block' | 'page' | 'site';
			remember?: boolean;
	  }
	| { type: 'custom'; id: string; label: string };

export type ProfileData = {
	version: 1;
	settings: Settings;
	conditions: Condition[];
	// language => condition id => theme slug
	languages: Record<string, Record<string, string>>;
	buttons: Button[];
};

export type Sample = { language: string; code: string };

// `sample` is the profile's own code for theme previews, or null for the shared one.
export type Profile = {
	slug: string;
	title: string;
	data: ProfileData;
	sample: Sample | null;
};

export type Theme = {
	slug: string;
	title: string;
	background: string;
	foreground: string;
	dark: boolean;
};

export type Meta = {
	themes: Theme[];
	fonts: { value: string; label: string; href: string }[];
	headers: string[];
	footers: string[];
	seeMore: string[];
	base: ProfileData;
	sample: Sample;
};

export type PageUse = {
	id: number;
	title: string;
	url: string;
	blocks: number;
};

type Attributes = Record<string, unknown>;

const PATH = '/code-block-pro/v1/manage';

export const messageOf = (error: unknown) =>
	error && typeof error === 'object' && 'message' in error
		? String(error.message)
		: __('The server did not answer.', 'code-block-pro');

let metaRequest: Promise<Meta> | null = null;
const loadMeta = () => {
	metaRequest ??= apiFetch<Meta>({ path: `${PATH}/meta` }).catch(
		(error: unknown) => {
			metaRequest = null;
			throw error;
		},
	);
	return metaRequest;
};

export const useMeta = () => {
	const [meta, setMeta] = useState<Meta | null>(null);
	const [error, setError] = useState('');
	useEffect(() => {
		let live = true;
		loadMeta()
			.then((loaded) => live && setMeta(loaded))
			.catch((failure: unknown) => live && setError(messageOf(failure)));
		return () => {
			live = false;
		};
	}, []);
	return { meta, error };
};

type StoreState = {
	profiles: Profile[];
	usage: Record<string, number>;
	pages: Record<string, number>;
	pageList: Record<string, PageUse[]>;
	loading: boolean;
	error: string;
};

let state: StoreState = {
	profiles: [],
	usage: {},
	pages: {},
	pageList: {},
	loading: true,
	error: '',
};
const listeners = new Set<() => void>();
const emit = (next: Partial<StoreState>) => {
	state = { ...state, ...next };
	for (const listener of listeners) listener();
};
const subscribe = (listener: () => void) => {
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
};

export const reloadProfiles = async () => {
	emit({ loading: true, error: '' });
	try {
		const loaded = await apiFetch<Omit<StoreState, 'loading' | 'error'>>({
			path: `${PATH}/profiles`,
		});
		const pageList = Object.fromEntries(
			Object.entries(loaded.pageList).map(([slug, pages]) => [
				slug,
				pages.map((page) => ({ ...page, title: decodeEntities(page.title) })),
			]),
		);
		emit({
			...loaded,
			profiles: loaded.profiles.map((profile) => ({
				...profile,
				title: decodeEntities(profile.title),
			})),
			pageList,
			loading: false,
		});
	} catch (error) {
		emit({ loading: false, error: messageOf(error) });
	}
};

let loaded = false;
/** Profiles with their full data, and how many blocks on the site use each (`usage[slug]`). */
export const useProfiles = () => {
	const snapshot = useSyncExternalStore(subscribe, () => state);
	useEffect(() => {
		if (loaded) return;
		loaded = true;
		void reloadProfiles();
	}, []);
	return snapshot;
};

type Save = {
	slug?: string;
	title?: string;
	data?: ProfileData;
	// Null goes back to the shared sample.
	sample?: Sample | null;
};

/** Adds a profile when slug is left out. Resolves to the saved slug. */
export const saveProfile = async ({
	slug = '',
	title = '',
	data,
	sample,
}: Save) => {
	const saved = await apiFetch<{ slug: string }>({
		path: `${PATH}/profiles`,
		method: 'POST',
		data: {
			slug,
			title,
			...(data && { data }),
			...(sample !== undefined && { sample }),
		},
	});
	doAction(PROFILES_CHANGED, saved.slug);
	return saved.slug;
};

// The code in every theme, one request per distinct sample. Null is the shared sample.
const samplesFor = new Map<string, Promise<Record<string, string>>>();
export const useSamples = (sample: Sample | null) => {
	const key = JSON.stringify(sample);
	const [loadedSamples, setLoadedSamples] = useState<{
		key: string;
		samples: Record<string, string>;
	}>({ key: '', samples: {} });
	useEffect(() => {
		let live = true;
		const load = () => {
			if (!samplesFor.has(key)) {
				samplesFor.set(
					key,
					apiFetch<Record<string, string>>({
						path: `${PATH}/samples`,
						method: 'POST',
						data: (JSON.parse(key) as Sample | null) ?? {
							language: '',
							code: '',
						},
					}).catch((error: unknown) => {
						samplesFor.delete(key);
						throw error;
					}),
				);
			}
			samplesFor
				.get(key)
				?.then((samples) => live && setLoadedSamples({ key, samples }))
				.catch(() => undefined);
		};
		// Typing in the code sample would otherwise send a request per keystroke.
		const timer = window.setTimeout(load, samplesFor.has(key) ? 0 : 300);
		return () => {
			live = false;
			window.clearTimeout(timer);
		};
	}, [key]);
	return {
		samples: loadedSamples.samples,
		fresh: loadedSamples.key === key,
	};
};

// Each slot's rules are scoped to its own draft, so previews of two slots never share a stylesheet.
const setDraftStyle = (slot: string, css: string) => {
	const id = `code-block-pro-draft-${slot}`;
	let style = document.getElementById(id);
	if (!style) {
		style = document.createElement('style');
		style.id = id;
		document.head.append(style);
	}
	if (style.textContent !== css) style.textContent = css;
};

export type Swap = { settings?: Partial<Settings>; buttons?: Button[] };

/**
 * The profile in its Light theme once per swap, through the real renderer, nothing saved.
 * Swaps share the slot's stylesheet, so they may differ only in markup.
 */
export const useDraftRenders = (
	data: ProfileData | null,
	swaps: Swap[],
	attributes: Attributes | null,
	slot: string,
) => {
	const [items, setItems] = useState<string[]>([]);
	const latest = useRef(0);
	const body =
		data && attributes ? JSON.stringify({ data, swaps, attributes, slot }) : '';

	useEffect(() => {
		if (!body) return undefined;
		const ticket = ++latest.current;
		const request = JSON.parse(body) as { slot: string };
		const timer = window.setTimeout(() => {
			apiFetch<{
				items: string[];
				css: string;
				styles: { handle: string; href: string }[];
			}>({ path: `${PATH}/render`, method: 'POST', data: request })
				.then((rendered) => {
					if (ticket !== latest.current) return;
					loadStyles(document, rendered.styles);
					setDraftStyle(request.slot, rendered.css);
					setItems(rendered.items);
				})
				.catch(() => undefined);
		}, 200);
		return () => window.clearTimeout(timer);
	}, [body]);

	return items;
};

export const humanize = (slug: string) =>
	slug
		.replace(/[-_]+/g, ' ')
		.replace(/([a-z])([A-Z])/g, '$1 $2')
		.replace(/\b\w/g, (c) => c.toUpperCase())
		.replace(/\bGithub\b/g, 'GitHub');

export const setSetting = <K extends keyof Settings>(
	data: ProfileData,
	key: K,
	value: Settings[K],
): ProfileData => ({
	...data,
	settings: { ...data.settings, [key]: value },
});

export const newConditionId = (data: ProfileData) => {
	for (let i = data.conditions.length; ; i++) {
		const id = `c${i}`;
		if (!data.conditions.some((c) => c.id === id)) return id;
	}
};

export const DARK_QUERY = '(prefers-color-scheme: dark)';

// When this browser last put each profile on a block, for the profile list's order.
const USED = 'code-block-pro-profile-used';
export const usedAt = (): Record<string, number> => {
	try {
		return JSON.parse(window.localStorage.getItem(USED) ?? '{}');
	} catch {
		return {};
	}
};
export const markUsed = (slug: string) => {
	try {
		window.localStorage.setItem(
			USED,
			JSON.stringify({ ...usedAt(), [slug]: Date.now() }),
		);
	} catch {
		// Storage can be full or blocked; the list falls back to its default order.
	}
};
