import {
	Button,
	__experimentalConfirmDialog as ConfirmDialog,
	Modal,
	Notice,
	VisuallyHidden,
} from '@wordpress/components';
import { dispatch } from '@wordpress/data';
import { useEffect, useId, useRef, useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import {
	humanize,
	type Meta,
	messageOf,
	type PageUse,
	type Profile,
	type ProfileData,
	reloadProfiles,
	type Sample,
	saveProfile,
	useMeta,
	useProfiles,
} from './api';
import {
	ButtonScreen,
	FEATURE_PAGES,
	type Pick,
	PICK_TABS,
	PickScreen,
	PreviewButton,
	pickTitle,
} from './features';
import { Home } from './home';
import { CodeSamplePage } from './sample';
import { ThemeScreen, ThemeTiles } from './themes';
import { CHEVRON_LEFT, CLOSE, loadFont, ProfileImpact, Svg, Tabs } from './ui';

type Screen =
	| { kind: 'home'; tab: 'profiles' | 'languages' }
	| { kind: 'profile'; slug: string; tab: string }
	| { kind: 'theme'; slug: string; tab: 'light' | 'dark' }
	| { kind: 'pick'; slug: string; pick: Pick }
	| { kind: 'button'; slug: string; index: number };

const HOME: Screen = { kind: 'home', tab: 'profiles' };

const FEATURES = [
	{ name: 'theme', title: __('Theme', 'code-block-pro') },
	{ name: 'font', title: __('Font', 'code-block-pro') },
	{ name: 'header', title: __('Header', 'code-block-pro') },
	{ name: 'footer', title: __('Footer', 'code-block-pro') },
	{ name: 'line-numbers', title: __('Line numbers', 'code-block-pro') },
	{ name: 'see-more', title: __('See more', 'code-block-pro') },
	{ name: 'buttons', title: __('Buttons', 'code-block-pro') },
	{ name: 'code-sample', title: __('Code sample', 'code-block-pro') },
	{ name: 'stats', title: __('Stats', 'code-block-pro') },
];

const BACK_TO_PICK: Record<Pick, string> = {
	font: __('Back to font settings', 'code-block-pro'),
	header: __('Back to header settings', 'code-block-pro'),
	footer: __('Back to footer settings', 'code-block-pro'),
	seeMore: __('Back to See more settings', 'code-block-pro'),
};

// What each setting reaches, shown at the top of its page.
const NOTES: Record<string, string> = {
	theme: __(
		'Blocks use the Light theme. If you set a Dark theme, it takes over when the browser is in dark mode, or while the page has a class you choose. Custom themes need the Theme Pack.',
		'code-block-pro',
	),
	font: __(
		'The typeface, size and spacing of the code. Fonts load from your own site, only on pages that show them.',
		'code-block-pro',
	),
	header: __(
		'The bar above the code. Tabs and buttons sit in it. Each block sets its own header title in its sidebar.',
		'code-block-pro',
	),
	footer: __(
		'The line below the code. It shows the language unless a block sets its own footer text or link in its sidebar.',
		'code-block-pro',
	),
	'line-numbers': __(
		'Whether blocks show line numbers. A block sets its first line number in its sidebar.',
		'code-block-pro',
	),
	'see-more': __(
		'How long code is folded and opened again. A block folds only once “Lines shown when folded” is set in its sidebar.',
		'code-block-pro',
	),
	buttons: __(
		'Buttons shown on every block, in this order. Copy copies the code, Theme switch lets readers pick Light or Dark, and Custom sends an event your own script can listen for.',
		'code-block-pro',
	),
	'code-sample': __(
		'This code fills every preview in this profile’s settings. It never appears on your site.',
		'code-block-pro',
	),
	stats: __(
		'Pages with blocks that use this profile, including drafts and private pages.',
		'code-block-pro',
	),
};

/** The screen's hidden title, and the label of its back button. */
const labelsOf = (screen: Screen, name: string) => {
	const titled = (page: string) =>
		/* translators: 1: a profile's name, 2: the settings page open, such as Font. */
		sprintf(__('%1$s: %2$s', 'code-block-pro'), name, page);
	switch (screen.kind) {
		case 'home':
			return { title: __('Code Block Pro', 'code-block-pro'), back: '' };
		case 'profile':
			return { title: name, back: __('Back to profiles', 'code-block-pro') };
		case 'theme':
			return {
				title: titled(__('Theme', 'code-block-pro')),
				back: __('Back to theme select', 'code-block-pro'),
			};
		case 'pick':
			return {
				title: titled(pickTitle(screen.pick)),
				back: BACK_TO_PICK[screen.pick],
			};
		default:
			return {
				title: titled(__('Button', 'code-block-pro')),
				back: __('Back to buttons', 'code-block-pro'),
			};
	}
};

/** Where the back button goes, and the control there that opened this screen. */
const parentOf = (screen: Screen): { screen: Screen | null; focus: string } => {
	switch (screen.kind) {
		case 'theme':
			return {
				screen: { kind: 'profile', slug: screen.slug, tab: 'theme' },
				focus: '',
			};
		case 'pick':
			return {
				screen: {
					kind: 'profile',
					slug: screen.slug,
					tab: PICK_TABS[screen.pick],
				},
				focus: screen.pick,
			};
		case 'button':
			return {
				screen: { kind: 'profile', slug: screen.slug, tab: 'buttons' },
				focus: `button-${screen.index}`,
			};
		case 'profile':
			return { screen: HOME, focus: '' };
		default:
			return { screen: null, focus: '' };
	}
};

type Draft = { data: ProfileData; sample: Sample | null };

const notify = (message: string) =>
	(
		dispatch('core/notices') as {
			createSuccessNotice: (text: string, options: object) => void;
		}
	).createSuccessNotice(message, {
		type: 'snackbar',
		id: 'code-block-pro-profile-saved',
	});

const same = (a: unknown, b: unknown) =>
	JSON.stringify(a) === JSON.stringify(b);

/** Edits stay here, per profile, until Save writes them. */
const useDrafts = (saved: Profile[]) => {
	const [drafts, setDrafts] = useState<Record<string, Draft>>({});
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState('');

	const profiles = saved.map((p) =>
		drafts[p.slug] ? { ...p, ...drafts[p.slug] } : p,
	);
	const changed = saved.filter(
		(p) =>
			drafts[p.slug] &&
			!same(drafts[p.slug], { data: p.data, sample: p.sample }),
	);

	const edit = (p: Profile, next: Partial<Draft>) =>
		setDrafts((all) => ({
			...all,
			[p.slug]: {
				...(all[p.slug] ?? { data: p.data, sample: p.sample }),
				...next,
			},
		}));

	const saveOne = ({ slug, data, sample }: Profile) => {
		const draft = drafts[slug];
		return saveProfile({
			slug,
			...(!same(draft.data, data) && { data: draft.data }),
			...(!same(draft.sample, sample) && { sample: draft.sample }),
		});
	};

	const save = async () => {
		setError('');
		setSaving(true);
		try {
			// One at a time: each save rebuilds the stylesheets stored for every profile.
			await changed.reduce<Promise<unknown>>(
				(previous, p) => previous.then(() => saveOne(p)),
				Promise.resolve(),
			);
			await reloadProfiles();
			setDrafts({});
			notify(
				_n(
					'Profile updated.',
					'Profiles updated.',
					changed.length,
					'code-block-pro',
				),
			);
		} catch (failure) {
			setError(messageOf(failure));
		} finally {
			setSaving(false);
		}
	};

	return { profiles, changed, edit, save, saving, error, setError };
};

type HeaderProps = {
	home: boolean;
	title: string;
	titleId: string;
	back: string;
	onBack: () => void;
	onClose: () => void;
};

// Core's header, drawn here so each screen can have a back button.
const ManagerHeader = ({
	home,
	title,
	titleId,
	back,
	onBack,
	onClose,
}: HeaderProps) => (
	<div className="components-modal__header cbp-manager-header">
		<div className="components-modal__header-heading-container">
			{home ? (
				<h1 className="components-modal__header-heading" id={titleId}>
					{title}
				</h1>
			) : (
				<>
					<VisuallyHidden as="h1" id={titleId}>
						{title}
					</VisuallyHidden>
					<Button
						className="cbp-manager-header-back"
						icon={<Svg d={CHEVRON_LEFT} />}
						onClick={onBack}
					>
						{back}
					</Button>
				</>
			)}
		</div>
		<Button
			size="compact"
			icon={<Svg d={CLOSE} />}
			label={__('Close', 'code-block-pro')}
			onClick={onClose}
		/>
	</div>
);

type PagesProps = {
	tab: string;
	profile: Profile;
	meta: Meta | null;
	uses: PageUse[];
	themeTitle: (slug: string) => string;
	background: (slug: string) => string;
	onScreen: (screen: Screen) => void;
	onEdit: (next: Partial<Draft>) => void;
};

const ProfilePages = ({
	tab,
	profile,
	meta,
	uses,
	themeTitle,
	background,
	onScreen,
	onEdit,
}: PagesProps) => {
	const { slug } = profile;
	const Page = FEATURE_PAGES[tab];
	return (
		<Tabs
			label={__('Settings', 'code-block-pro')}
			items={FEATURES}
			active={tab}
			onSelect={(next) => onScreen({ kind: 'profile', slug, tab: next })}
		>
			{NOTES[tab] && <p className="cbp-manager-description">{NOTES[tab]}</p>}
			{tab === 'theme' && (
				<ThemeTiles
					profile={profile}
					themeTitle={themeTitle}
					background={background}
					onOpen={(which) => onScreen({ kind: 'theme', slug, tab: which })}
				/>
			)}
			{tab === 'code-sample' && meta && (
				<CodeSamplePage
					profile={profile}
					themes={meta.themes}
					defaultSample={meta.sample}
					onChange={(sample) => onEdit({ sample })}
				/>
			)}
			{Page && meta && (
				<Page
					key={tab}
					profile={profile}
					meta={meta}
					uses={uses}
					onChange={(data) => onEdit({ data })}
					onPick={(pick) => onScreen({ kind: 'pick', slug, pick })}
					onButton={(index) => onScreen({ kind: 'button', slug, index })}
				/>
			)}
		</Tabs>
	);
};

type SubScreenProps = {
	screen: Extract<Screen, { kind: 'theme' | 'pick' | 'button' }>;
	profile: Profile;
	meta: Meta;
	onChange: (data: ProfileData) => void;
	onScreen: (screen: Screen) => void;
};

// The screens a settings page opens, which have no settings tabs.
const SubScreen = ({
	screen,
	profile,
	meta,
	onChange,
	onScreen,
}: SubScreenProps) => {
	if (screen.kind === 'theme') {
		return (
			<ThemeScreen
				key={profile.slug}
				profile={profile}
				tab={screen.tab}
				themes={meta.themes}
				onChange={onChange}
			/>
		);
	}
	return (
		<div className="cbp-manager-screen">
			{screen.kind === 'pick' ? (
				<PickScreen
					key={screen.pick}
					pick={screen.pick}
					profile={profile}
					meta={meta}
					onChange={onChange}
				/>
			) : (
				<ButtonScreen
					key={screen.index}
					index={screen.index}
					profile={profile}
					meta={meta}
					onChange={onChange}
					onRemoved={() =>
						onScreen({ kind: 'profile', slug: profile.slug, tab: 'buttons' })
					}
				/>
			)}
		</div>
	);
};

type FooterProps = {
	profile: Profile | undefined;
	meta: Meta | null;
	canSave: boolean;
	saving: boolean;
	onSave: () => void;
	onStats: (slug: string) => void;
};

// Save stays in view on every screen, with the reach of a change beside it.
const ManagerFooter = ({
	profile,
	meta,
	canSave,
	saving,
	onSave,
	onStats,
}: FooterProps) => (
	<div className="cbp-manager-footer">
		{profile && (
			<ProfileImpact
				title={profile.title}
				onStats={() => onStats(profile.slug)}
			/>
		)}
		{profile && meta && <PreviewButton profile={profile} meta={meta} />}
		<Button
			variant="primary"
			__next40pxDefaultSize
			disabled={!canSave}
			accessibleWhenDisabled
			isBusy={saving}
			onClick={onSave}
		>
			{__('Save', 'code-block-pro')}
		</Button>
	</div>
);

type ScreenOptions = {
	view: 'edit' | 'manage';
	blockSlug: string;
	saved: Profile[];
	loading: boolean;
};

const useScreen = ({ view, blockSlug, saved, loading }: ScreenOptions) => {
	const [chosen, setScreen] = useState<Screen>(
		view === 'manage' || !blockSlug
			? HOME
			: { kind: 'profile', slug: blockSlug, tab: 'theme' },
	);
	// The control that opened the screen being left, focused again once its page is back.
	const returnTo = useRef('');

	useEffect(() => {
		if (!returnTo.current) return;
		document
			.querySelector<HTMLElement>(
				`.cbp-manager-modal [data-return="${returnTo.current}"]`,
			)
			?.focus();
		returnTo.current = '';
	}, [chosen]);

	// A block can name a profile that was since removed.
	const screen =
		chosen.kind !== 'home' &&
		!loading &&
		!saved.some((p) => p.slug === chosen.slug)
			? HOME
			: chosen;

	/** Goes back a screen; false on the list, which has none. */
	const up = () => {
		const parent = parentOf(screen);
		if (!parent.screen) return false;
		returnTo.current = parent.focus;
		setScreen(parent.screen);
		return true;
	};

	return { screen, setScreen, up };
};

const useThemeNames = (meta: Meta | null) => {
	const themeOf = (slug: string) => meta?.themes.find((t) => t.slug === slug);
	return {
		background: (slug: string) => themeOf(slug)?.background ?? '#1e1e1e',
		themeTitle: (slug: string) => humanize(themeOf(slug)?.title ?? slug),
	};
};

// Previews on every screen draw the profile's font.
const useFont = (meta: Meta | null, profile: Profile | undefined) => {
	const font = profile?.data.settings.fontFamily ?? '';
	useEffect(() => {
		if (meta) loadFont(meta, font);
	}, [meta, font]);
};

export type ManagerProps = {
	/** The profile of the block the manager opened from. */
	slug: string;
	/** Edit opens that profile; manage opens the list. */
	view: 'edit' | 'manage';
	onClose: () => void;
};

export const ProfileManager = ({
	slug: blockSlug,
	view,
	onClose,
}: ManagerProps) => {
	const { meta, error: metaError } = useMeta();
	const {
		profiles: saved,
		usage,
		pageList,
		loading,
		error: loadError,
	} = useProfiles();
	const { profiles, changed, edit, save, saving, error, setError } =
		useDrafts(saved);
	const { screen, setScreen, up } = useScreen({
		view,
		blockSlug,
		saved,
		loading,
	});
	const { background, themeTitle } = useThemeNames(meta);
	const [confirming, setConfirming] = useState(false);
	const titleId = useId();
	const profile =
		screen.kind === 'home'
			? undefined
			: profiles.find((p) => p.slug === screen.slug);
	useFont(meta, profile);

	const requestClose = () => (changed.length ? setConfirming(true) : onClose());
	const back = () => up() || requestClose();
	const { title, back: backLabel } = labelsOf(screen, profile?.title ?? '');
	const shownError = error || loadError || metaError;

	return (
		<Modal
			title={title}
			__experimentalHideHeader
			aria={{ labelledby: titleId }}
			className="preferences-modal cbp-manager-modal"
			shouldCloseOnClickOutside={false}
			onRequestClose={back}
		>
			<ManagerHeader
				home={screen.kind === 'home'}
				title={title}
				titleId={titleId}
				back={backLabel}
				onBack={back}
				onClose={requestClose}
			/>

			{shownError && (
				<Notice
					status="error"
					onRemove={() => (error ? setError('') : void reloadProfiles())}
					className="cbp-manager-error"
				>
					{shownError}
				</Notice>
			)}

			{screen.kind === 'home' && (
				<Home
					tab={screen.tab}
					onTab={(tab) => setScreen({ kind: 'home', tab })}
					profiles={profiles}
					usage={usage}
					blockSlug={blockSlug}
					themeTitle={themeTitle}
					background={background}
					onOpen={(slug) => setScreen({ kind: 'profile', slug, tab: 'theme' })}
					onError={setError}
				/>
			)}

			{screen.kind === 'profile' && profile && (
				<ProfilePages
					tab={screen.tab}
					profile={profile}
					meta={meta}
					uses={pageList[profile.slug] ?? []}
					themeTitle={themeTitle}
					background={background}
					onScreen={setScreen}
					onEdit={(next) => edit(profile, next)}
				/>
			)}

			{profile &&
				meta &&
				screen.kind !== 'home' &&
				screen.kind !== 'profile' && (
					<SubScreen
						screen={screen}
						profile={profile}
						meta={meta}
						onChange={(data) => edit(profile, { data })}
						onScreen={setScreen}
					/>
				)}

			<ManagerFooter
				profile={profile}
				meta={meta}
				canSave={changed.length > 0 && !saving}
				saving={saving}
				onSave={() => void save()}
				onStats={(slug) => setScreen({ kind: 'profile', slug, tab: 'stats' })}
			/>

			<ConfirmDialog
				className="cbp-manager-confirm"
				isOpen={confirming}
				confirmButtonText={__('Close without saving', 'code-block-pro')}
				cancelButtonText={__('Keep editing', 'code-block-pro')}
				onConfirm={() => {
					setConfirming(false);
					onClose();
				}}
				onCancel={() => setConfirming(false)}
			>
				{__(
					'You have unsaved changes. Close without saving?',
					'code-block-pro',
				)}
			</ConfirmDialog>
		</Modal>
	);
};
