import {
	Button,
	__experimentalConfirmDialog as ConfirmDialog,
	Modal,
	Notice,
	VisuallyHidden,
} from '@wordpress/components';
import { dispatch } from '@wordpress/data';
import {
	createInterpolateElement,
	useEffect,
	useId,
	useRef,
	useState,
} from '@wordpress/element';
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
	FEATURE_PAGES,
	type Pick,
	PICK_TABS,
	PickScreen,
	PreviewButton,
	pickTitle,
} from './features';
import { GeneralPage } from './general';
import { Home } from './home';
import { ThemeScreen, ThemeTiles } from './themes';
import { CHEVRON_LEFT, CLOSE, loadFont, ProfileImpact, Svg, Tabs } from './ui';

type Screen =
	| { kind: 'home'; tab: 'profiles' | 'languages' }
	| { kind: 'profile'; slug: string; tab: string }
	| { kind: 'theme'; slug: string; tab: 'light' | 'dark' }
	| { kind: 'pick'; slug: string; pick: Pick };

const HOME: Screen = { kind: 'home', tab: 'profiles' };

const FEATURES = [
	{ name: 'general', title: __('General', 'code-block-pro') },
	{ name: 'theme', title: __('Theme', 'code-block-pro') },
	{ name: 'font', title: __('Font', 'code-block-pro') },
	{ name: 'header', title: __('Header', 'code-block-pro') },
	{ name: 'footer', title: __('Footer', 'code-block-pro') },
	{ name: 'line-numbers', title: __('Line numbers', 'code-block-pro') },
	{ name: 'see-more', title: __('See more', 'code-block-pro') },
	{ name: 'buttons', title: __('Buttons', 'code-block-pro') },
	{ name: 'stats', title: __('Stats', 'code-block-pro') },
];

const BACK_TO_PICK: Record<Pick, string> = {
	font: __('Back to font settings', 'code-block-pro'),
	header: __('Back to header settings', 'code-block-pro'),
	footer: __('Back to footer settings', 'code-block-pro'),
	seeMore: __('Back to See more settings', 'code-block-pro'),
};

const LEARN_MORE = 'https://code-block-pro.com';

// What each setting reaches, shown at the top of its page.
const Note = ({
	tab,
	onTab,
}: {
	tab: string;
	onTab: (tab: string) => void;
}) => {
	const notes: Record<string, React.ReactNode> = {
		theme: createInterpolateElement(
			__(
				'Select a theme and optionally select a second theme to show in dark mode. Users with the theme pack can set further conditions to offer more themes. Learn more at <a>code-block-pro.com</a>',
				'code-block-pro',
			),
			{
				a: (
					<a href={LEARN_MORE} target="_blank" rel="noreferrer">
						code-block-pro.com
					</a>
				),
			},
		),
		header: __(
			'Select a header below. Depending on the chosen header you will see configuration options below.',
			'code-block-pro',
		),
		footer: __(
			'Select a footer below. Depending on the chosen footer you will see configuration options below.',
			'code-block-pro',
		),
		'line-numbers': createInterpolateElement(
			__(
				'Decide whether to show or hide line numbers. Note that you may also add a <a>button</a> to allow users to toggle them, in which case this value would be the default',
				'code-block-pro',
			),
			{
				a: (
					<Button variant="link" onClick={() => onTab('buttons')}>
						button
					</Button>
				),
			},
		),
		'see-more': __(
			'Determine whether a max line can be set for blocks. The setting is per block so here you set the look and feel of it',
			'code-block-pro',
		),
		stats: __(
			'Below is every post we found the block on. You can manage your blocks with the Manage Blocks tool',
			'code-block-pro',
		),
	};
	return notes[tab] ? (
		<p className="cbp-manager-description">{notes[tab]}</p>
	) : null;
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
		default:
			return {
				title: titled(pickTitle(screen.pick)),
				back: BACK_TO_PICK[screen.pick],
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
		case 'profile':
			return { screen: HOME, focus: '' };
		default:
			return { screen: null, focus: '' };
	}
};

type Draft = { title: string; data: ProfileData; sample: Sample | null };

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
			!same(drafts[p.slug], { title: p.title, data: p.data, sample: p.sample }),
	);

	const edit = (p: Profile, next: Partial<Draft>) =>
		setDrafts((all) => ({
			...all,
			[p.slug]: {
				...(all[p.slug] ?? { title: p.title, data: p.data, sample: p.sample }),
				...next,
			},
		}));

	const saveOne = ({ slug, title, data, sample }: Profile) => {
		const draft = drafts[slug];
		return saveProfile({
			slug,
			...(draft.title !== title && { title: draft.title }),
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
	pageList: Record<string, PageUse[]>;
	usage: Record<string, number>;
	dirty: boolean;
	themeTitle: (slug: string) => string;
	background: (slug: string) => string;
	onScreen: (screen: Screen) => void;
	onEdit: (next: Partial<Draft>) => void;
	onDuplicate: () => Promise<void>;
	onManageBlocks: () => void;
};

const ProfilePages = ({
	tab,
	profile,
	meta,
	pageList,
	usage,
	dirty,
	themeTitle,
	background,
	onScreen,
	onEdit,
	onDuplicate,
	onManageBlocks,
}: PagesProps) => {
	const { slug } = profile;
	const Page = FEATURE_PAGES[tab];
	const onTab = (next: string) =>
		onScreen({ kind: 'profile', slug, tab: next });
	return (
		<Tabs
			label={__('Settings', 'code-block-pro')}
			items={FEATURES}
			active={tab}
			onSelect={onTab}
		>
			<Note tab={tab} onTab={onTab} />
			{tab === 'theme' && (
				<ThemeTiles
					profile={profile}
					themeTitle={themeTitle}
					background={background}
					onOpen={(which) => onScreen({ kind: 'theme', slug, tab: which })}
				/>
			)}
			{tab === 'general' && meta && (
				<GeneralPage
					profile={profile}
					themes={meta.themes}
					defaultSample={meta.sample}
					blocks={usage[slug] ?? 0}
					dirty={dirty}
					onTitle={(title) => onEdit({ title })}
					onSample={(sample) => onEdit({ sample })}
					onStats={() => onTab('stats')}
					onDuplicate={onDuplicate}
				/>
			)}
			{Page && meta && (
				<Page
					key={tab}
					profile={profile}
					meta={meta}
					uses={pageList[slug] ?? []}
					dirty={dirty}
					onChange={(data) => onEdit({ data })}
					onPick={(pick) => onScreen({ kind: 'pick', slug, pick })}
					onManageBlocks={onManageBlocks}
				/>
			)}
		</Tabs>
	);
};

type SubScreenProps = {
	screen: Extract<Screen, { kind: 'theme' | 'pick' }>;
	profile: Profile;
	meta: Meta;
	onChange: (data: ProfileData) => void;
};

// The screens a settings page opens, which have no settings tabs.
const SubScreen = ({ screen, profile, meta, onChange }: SubScreenProps) => {
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
			<PickScreen
				key={screen.pick}
				pick={screen.pick}
				profile={profile}
				meta={meta}
				onChange={onChange}
			/>
		</div>
	);
};

// Opens over the profile manager; saving first means its Back and Close never leave edits behind.
const BlockManager = ({
	onBack,
	onClose,
}: {
	onBack: () => void;
	onClose: () => void;
}) => {
	const titleId = useId();
	const title = __('Manage blocks', 'code-block-pro');
	return (
		<Modal
			title={title}
			__experimentalHideHeader
			aria={{ labelledby: titleId }}
			className="preferences-modal cbp-manager-modal"
			shouldCloseOnClickOutside={false}
			onRequestClose={onBack}
		>
			<ManagerHeader
				home={false}
				title={title}
				titleId={titleId}
				back={__('Back to stats', 'code-block-pro')}
				onBack={onBack}
				onClose={onClose}
			/>
		</Modal>
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
			: { kind: 'profile', slug: blockSlug, tab: 'general' },
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

// The copy opens on General, where its name is the first thing to change.
const duplicator =
	(setScreen: (screen: Screen) => void, setError: (message: string) => void) =>
	async (from: Profile) => {
		try {
			const slug = await saveProfile({
				/* translators: %s: the name of the profile being copied. */
				title: sprintf(__('%s copy', 'code-block-pro'), from.title),
				data: from.data,
				sample: from.sample,
			});
			await reloadProfiles();
			setScreen({ kind: 'profile', slug, tab: 'general' });
		} catch (failure) {
			setError(messageOf(failure));
		}
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
	const [managing, setManaging] = useState(false);
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
	const duplicate = duplicator(setScreen, setError);

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
					onOpen={(slug) =>
						setScreen({ kind: 'profile', slug, tab: 'general' })
					}
					onError={setError}
				/>
			)}

			{screen.kind === 'profile' && profile && (
				<ProfilePages
					tab={screen.tab}
					profile={profile}
					meta={meta}
					pageList={pageList}
					usage={usage}
					dirty={changed.length > 0}
					themeTitle={themeTitle}
					background={background}
					onScreen={setScreen}
					onEdit={(next) => edit(profile, next)}
					onDuplicate={() => duplicate(profile)}
					onManageBlocks={() => setManaging(true)}
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

			{managing && (
				<BlockManager onBack={() => setManaging(false)} onClose={onClose} />
			)}
		</Modal>
	);
};
