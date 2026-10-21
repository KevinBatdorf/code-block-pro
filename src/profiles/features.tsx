import {
	Button,
	Dropdown,
	FontSizePicker,
	MenuGroup,
	MenuItem,
	Popover,
	RadioControl,
	TextControl,
	ToggleControl,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
} from '@wordpress/components';
import {
	createInterpolateElement,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import {
	type Button as ProfileButton,
	type Meta,
	type PageUse,
	type Profile,
	type ProfileData,
	type Sample,
	type Settings,
	setSetting,
	type Swap,
	useDraftRenders,
	useSamples,
} from './api';
import {
	CHECK,
	CHEVRON_RIGHT,
	fontLabel,
	fontStack,
	loadFont,
	Preview,
	Section,
	Svg,
} from './ui';

export type Pick = 'font' | 'header' | 'footer' | 'seeMore';

const HEADERS: Record<string, string> = {
	none: __('None', 'code-block-pro'),
	headlights: __('Headlights', 'code-block-pro'),
	headlightsMuted: __('Headlights muted', 'code-block-pro'),
	headlightsMutedAlt: __('Headlights muted alt', 'code-block-pro'),
	simpleString: __('Simple string', 'code-block-pro'),
	stringSmall: __('String muted', 'code-block-pro'),
	pillString: __('Pill string', 'code-block-pro'),
};
const FOOTERS: Record<string, string> = {
	none: __('None', 'code-block-pro'),
	simpleStringEnd: __('Simple string end', 'code-block-pro'),
	simpleStringStart: __('Simple string start', 'code-block-pro'),
};
const SEE_MORE: Record<string, string> = {
	roundCenter: __('Center', 'code-block-pro'),
	blockLeft: __('Left', 'code-block-pro'),
	blockRight: __('Right', 'code-block-pro'),
};
const COPY_ICONS: Record<string, string> = {
	heroicons: __('Clipboard', 'code-block-pro'),
	twoSquares: __('Two squares', 'code-block-pro'),
	textSimple: __('Text', 'code-block-pro'),
};
const SCOPES: Record<'block' | 'page' | 'site', string> = {
	block: __('This block', 'code-block-pro'),
	page: __('Every block on the page', 'code-block-pro'),
	site: __('Every block on the site', 'code-block-pro'),
};
const BUTTON_TYPES: Record<ProfileButton['type'], string> = {
	copy: __('Copy', 'code-block-pro'),
	toggle: __('Theme switch', 'code-block-pro'),
	custom: __('Custom', 'code-block-pro'),
};

const FONT_SIZES = [
	{ name: __('Tiny', 'code-block-pro'), slug: 'tiny', size: '.75rem' },
	{ name: __('Small', 'code-block-pro'), slug: 'small', size: '.875rem' },
	{ name: __('Normal', 'code-block-pro'), slug: 'normal', size: '1rem' },
	{ name: __('Big', 'code-block-pro'), slug: 'big', size: '1.125rem' },
];
const LINE_HEIGHTS = [
	{ value: '1rem', label: __('Compact', 'code-block-pro') },
	{ value: '1.25rem', label: __('Tight', 'code-block-pro') },
	{ value: '1.5rem', label: __('Normal', 'code-block-pro') },
	{ value: '1.625rem', label: __('Relaxed', 'code-block-pro') },
];

/** The settings tab each pick screen goes back to. */
export const PICK_TABS: Record<Pick, string> = {
	font: 'font',
	header: 'header',
	footer: 'footer',
	seeMore: 'see-more',
};
const PICK_TITLES: Record<Pick, string> = {
	font: __('Font', 'code-block-pro'),
	header: __('Header', 'code-block-pro'),
	footer: __('Footer', 'code-block-pro'),
	seeMore: __('See more', 'code-block-pro'),
};
export const pickTitle = (pick: Pick) => PICK_TITLES[pick];

const CHEVRON_UP = 'M6.5 12.4L12 8l5.5 4.4-.9 1.2L12 10l-4.5 3.6-1-1.2z';
const CHEVRON_DOWN = 'M17.5 11.6L12 16l-5.5-4.4.9-1.2L12 14l4.5-3.6 1 1.2z';
const EXTERNAL =
	'M19.5 4.5h-7V6h4.44l-5.97 5.97 1.06 1.06L18 7.06v4.44h1.5v-7Zm-13 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3H17v3a.5.5 0 0 1-.5.5h-10a.5.5 0 0 1-.5-.5v-10a.5.5 0 0 1 .5-.5h3V5.5h-3Z';

const ESCAPES: Record<string, string> = {
	'&': '&amp;',
	'<': '&lt;',
	'>': '&gt;',
};

// Escaped as the editor saves code, which the renderer decodes.
const attributesFor = (sample: Sample, { fold = false } = {}) => {
	const lines = sample.code.split('\n').length;
	const pane = {
		language: sample.language,
		code: sample.code.replace(/[&<>]/g, (c) => ESCAPES[c]),
	};
	return {
		panes: [
			fold && lines > 2
				? { ...pane, seeMoreAfter: Math.min(3, lines - 1) }
				: pane,
		],
	};
};

const BlockThumb = ({
	html,
	corner = false,
}: {
	html?: string;
	corner?: boolean;
}) => {
	const box = useRef<HTMLSpanElement>(null);
	const [zoom, setZoom] = useState(0.5);
	useLayoutEffect(() => {
		const el = box.current;
		if (!el) return undefined;
		// The block's own buttons would be focusable inside the tile's button.
		el.setAttribute('inert', '');
		const observer = new ResizeObserver(([entry]) =>
			setZoom(entry.contentRect.width / (corner ? 190 : 340)),
		);
		observer.observe(el);
		return () => observer.disconnect();
	}, [corner]);
	return (
		<span
			ref={box}
			className={`cbp-manager-thumb${corner ? ' is-corner' : ''}`}
			aria-hidden="true"
		>
			<span
				className="cbp-manager-thumb-inner"
				style={{ zoom }}
				dangerouslySetInnerHTML={{ __html: html ?? '' }}
			/>
		</span>
	);
};

const sampleOf = (profile: Profile, meta: Meta) =>
	profile.sample ?? meta.sample;

// Renders while the button is on screen, so hovering shows the preview without waiting for the server.
export const PreviewButton = ({
	profile,
	meta,
}: {
	profile: Profile;
	meta: Meta;
}) => {
	const [html] = useDraftRenders(
		profile.data,
		[{}],
		attributesFor(sampleOf(profile, meta)),
		'top',
	);
	const [anchor, setAnchor] = useState<HTMLElement | null>(null);
	const [open, setOpen] = useState(false);
	return (
		<>
			<Button
				ref={setAnchor}
				variant="secondary"
				__next40pxDefaultSize
				aria-expanded={open}
				onMouseEnter={() => setOpen(true)}
				onMouseLeave={() => setOpen(false)}
				onFocus={() => setOpen(true)}
				onBlur={() => setOpen(false)}
			>
				{__('Preview', 'code-block-pro')}
			</Button>
			{open && anchor && (
				<Popover
					anchor={anchor}
					placement="top-end"
					offset={12}
					focusOnMount={false}
					className="cbp-manager-preview-popover"
				>
					<div
						className="cbp-manager-live"
						dangerouslySetInnerHTML={{ __html: html ?? '' }}
					/>
				</Popover>
			)}
		</>
	);
};

const Tile = ({
	label,
	meta,
	onClick,
	returnKey,
	children,
}: {
	label: string;
	meta: string;
	onClick: () => void;
	returnKey: string;
	children: React.ReactNode;
}) => (
	<div className="cbp-manager-tiles">
		<button
			type="button"
			className="cbp-manager-tile"
			data-return={returnKey}
			onClick={onClick}
		>
			<span className="cbp-manager-box">{children}</span>
			<span className="cbp-manager-label">{label}</span>
			<span className="cbp-manager-meta">{meta}</span>
		</button>
	</div>
);

const Option = ({ children }: { children: React.ReactNode }) => (
	<div className="preferences-modal__option">{children}</div>
);

type TextProps = {
	label: string;
	value: string;
	placeholder?: string;
	help?: React.ReactNode;
	onCommit: (value: string) => void;
	required?: boolean;
};

// A required field keeps its last non-empty value in the profile while it is cleared to retype.
const CommitText = ({
	label,
	value,
	placeholder,
	help,
	onCommit,
	required = false,
}: TextProps) => {
	const [text, setText] = useState(value);
	const [seen, setSeen] = useState(value);
	// The profile changed from outside this field.
	if (value !== seen) {
		setSeen(value);
		if (value !== text.trim() && (value !== '' || !required)) setText(value);
	}
	return (
		<TextControl
			__nextHasNoMarginBottom
			__next40pxDefaultSize
			label={label}
			placeholder={placeholder}
			help={help}
			value={text}
			onChange={(next) => {
				setText(next);
				if (next.trim() !== '' || !required) onCommit(next.trim());
			}}
		/>
	);
};

type GridOption = { value: string; label: string; thumb: React.ReactNode };

const PickGrid = ({
	label,
	options,
	value,
	onPick,
}: {
	label: string;
	options: GridOption[];
	value: string;
	onPick: (value: string) => void;
}) => {
	const grid = useRef<HTMLDivElement>(null);
	const [quiet, setQuiet] = useState(true);

	useEffect(() => {
		const el =
			grid.current?.querySelector<HTMLElement>('[aria-checked="true"]') ??
			grid.current?.querySelector<HTMLElement>('[role="radio"]');
		el?.focus();
	}, []);

	// That focus is for keyboard users; its ring waits for a key so it isn't read as a second selection.
	useEffect(() => {
		const wake = () => setQuiet(false);
		window.addEventListener('keydown', wake, { once: true });
		return () => window.removeEventListener('keydown', wake);
	}, []);

	return (
		<div
			ref={grid}
			className={`cbp-manager-grid${quiet ? ' is-quiet' : ''}`}
			role="radiogroup"
			aria-label={label}
		>
			{options.map((option) => (
				<button
					key={option.value}
					type="button"
					role="radio"
					aria-checked={option.value === value}
					className="cbp-manager-card"
					onClick={() => onPick(option.value)}
				>
					<span className="cbp-manager-box">
						{option.thumb}
						{option.value === value && (
							<span className="cbp-manager-check">
								<Svg d={CHECK} size={20} />
							</span>
						)}
					</span>
					<span className="cbp-manager-label">{option.label}</span>
				</button>
			))}
		</div>
	);
};

type PageProps = {
	profile: Profile;
	meta: Meta;
	uses: PageUse[];
	onChange: (data: ProfileData) => void;
	onPick: (pick: Pick) => void;
	onButton: (index: number) => void;
};

const useSettings = (
	profile: Profile,
	onChange: (data: ProfileData) => void,
) => {
	const settings = profile.data.settings;
	const set = <K extends keyof Settings>(key: K, value: Settings[K]) =>
		onChange(setSetting(profile.data, key, value));
	return [settings, set] as const;
};

const FontPage = ({ profile, meta, onChange, onPick }: PageProps) => {
	const [settings, set] = useSettings(profile, onChange);
	const { samples } = useSamples(profile.sample);
	const light = profile.data.conditions[0].theme;
	const background =
		meta.themes.find((t) => t.slug === light)?.background ?? '#fff';
	const heights = LINE_HEIGHTS.some((h) => h.value === settings.lineHeight)
		? LINE_HEIGHTS
		: [
				...LINE_HEIGHTS,
				{ value: settings.lineHeight, label: settings.lineHeight },
			];
	useEffect(
		() => loadFont(meta, settings.fontFamily),
		[meta, settings.fontFamily],
	);

	return (
		<>
			<Section title={__('Font', 'code-block-pro')} hideTitle>
				<Tile
					label={__('Font', 'code-block-pro')}
					meta={fontLabel(meta, settings.fontFamily)}
					returnKey="font"
					onClick={() => onPick('font')}
				>
					<Preview
						html={samples[light] ?? ''}
						background={background}
						font={fontStack(settings.fontFamily)}
					/>
				</Tile>
			</Section>
			<Section title={__('Size', 'code-block-pro')}>
				<Option>
					<FontSizePicker
						__next40pxDefaultSize
						fontSizes={FONT_SIZES}
						units={['px', 'em', 'rem']}
						value={settings.fontSize}
						onChange={(size) =>
							set(
								'fontSize',
								size === undefined ? meta.base.settings.fontSize : String(size),
							)
						}
					/>
				</Option>
				<Option>
					<ToggleGroupControl
						__nextHasNoMarginBottom
						__next40pxDefaultSize
						isBlock
						label={__('Line height', 'code-block-pro')}
						value={settings.lineHeight}
						onChange={(value) =>
							set('lineHeight', String(value ?? meta.base.settings.lineHeight))
						}
					>
						{heights.map((h) => (
							<ToggleGroupControlOption
								key={h.value}
								value={h.value}
								label={h.label}
							/>
						))}
					</ToggleGroupControl>
				</Option>
				<Option>
					<ToggleControl
						__nextHasNoMarginBottom
						label={__('Clamp font sizes', 'code-block-pro')}
						help={__(
							'Use this if the code looks unusually large or tiny with your theme.',
							'code-block-pro',
						)}
						checked={settings.clampFonts}
						onChange={(value) => set('clampFonts', value)}
					/>
				</Option>
			</Section>
			<Section title={__('Spacing', 'code-block-pro')}>
				<Option>
					<ToggleControl
						__nextHasNoMarginBottom
						label={__('Padding', 'code-block-pro')}
						help={__(
							'Turn it off to line the code up with the edge of your content.',
							'code-block-pro',
						)}
						checked={!settings.disablePadding}
						onChange={(value) => set('disablePadding', !value)}
					/>
				</Option>
			</Section>
		</>
	);
};

const HeaderPage = ({ profile, meta, onPick }: PageProps) => {
	const live = useDraftRenders(
		profile.data,
		[{}],
		attributesFor(sampleOf(profile, meta)),
		'live',
	);
	const type = profile.data.settings.headerType;
	return (
		<Section title={__('Header', 'code-block-pro')} hideTitle>
			<Tile
				label={__('Style', 'code-block-pro')}
				meta={HEADERS[type] ?? type}
				returnKey="header"
				onClick={() => onPick('header')}
			>
				<BlockThumb html={live[0]} />
			</Tile>
		</Section>
	);
};

const FooterPage = ({ profile, meta, onPick }: PageProps) => {
	const live = useDraftRenders(
		profile.data,
		[{}],
		attributesFor(sampleOf(profile, meta)),
		'live',
	);
	const type = profile.data.settings.footerType;
	return (
		<Section title={__('Footer', 'code-block-pro')} hideTitle>
			<Tile
				label={__('Style', 'code-block-pro')}
				meta={FOOTERS[type] ?? type}
				returnKey="footer"
				onClick={() => onPick('footer')}
			>
				<BlockThumb html={live[0]} />
			</Tile>
		</Section>
	);
};

const LineNumbersPage = ({ profile, onChange }: PageProps) => {
	const [settings, set] = useSettings(profile, onChange);
	return (
		<Section title={__('Line numbers', 'code-block-pro')} hideTitle>
			<Option>
				<ToggleControl
					__nextHasNoMarginBottom
					label={__('Show line numbers', 'code-block-pro')}
					checked={settings.lineNumbers}
					onChange={(value) => set('lineNumbers', value)}
				/>
			</Option>
			<Option>
				<ToggleControl
					__nextHasNoMarginBottom
					label={__('Highlight lines on hover', 'code-block-pro')}
					checked={settings.highlightingHover}
					onChange={(value) => set('highlightingHover', value)}
				/>
			</Option>
		</Section>
	);
};

const SeeMorePage = ({ profile, meta, onChange, onPick }: PageProps) => {
	const [settings, set] = useSettings(profile, onChange);
	const live = useDraftRenders(
		profile.data,
		[{}],
		attributesFor(sampleOf(profile, meta), { fold: true }),
		'live',
	);
	return (
		<>
			<Section title={__('See more', 'code-block-pro')} hideTitle>
				<Tile
					label={__('Style', 'code-block-pro')}
					meta={SEE_MORE[settings.seeMoreType] ?? __('None', 'code-block-pro')}
					returnKey="seeMore"
					onClick={() => onPick('seeMore')}
				>
					<BlockThumb html={live[0]} />
				</Tile>
			</Section>
			<Section title={__('Options', 'code-block-pro')}>
				<Option>
					<CommitText
						label={__('Expand label', 'code-block-pro')}
						placeholder={__('Expand', 'code-block-pro')}
						value={settings.seeMoreString}
						onCommit={(value) => set('seeMoreString', value)}
					/>
				</Option>
				<Option>
					<ToggleControl
						__nextHasNoMarginBottom
						label={__('Collapse button', 'code-block-pro')}
						help={__(
							'Readers can fold the code again after expanding it.',
							'code-block-pro',
						)}
						checked={settings.seeMoreCollapse}
						onChange={(value) => set('seeMoreCollapse', value)}
					/>
				</Option>
				{settings.seeMoreCollapse && (
					<Option>
						<CommitText
							label={__('Collapse label', 'code-block-pro')}
							placeholder={__('Collapse', 'code-block-pro')}
							value={settings.seeMoreCollapseString}
							onCommit={(value) => set('seeMoreCollapseString', value)}
						/>
					</Option>
				)}
				<Option>
					<ToggleControl
						__nextHasNoMarginBottom
						label={__('Animate', 'code-block-pro')}
						checked={settings.seeMoreTransition}
						onChange={(value) => set('seeMoreTransition', value)}
					/>
				</Option>
			</Section>
		</>
	);
};

const describe = (button: ProfileButton) => {
	if (button.type === 'copy') {
		return button.icon === 'textSimple'
			? /* translators: %s: the text a copy button shows. */
				sprintf(
					__('Text: %s', 'code-block-pro'),
					button.label || __('Copy', 'code-block-pro'),
				)
			: /* translators: %s: the name of an icon, such as Clipboard. */
				sprintf(__('%s icon', 'code-block-pro'), COPY_ICONS[button.icon]);
	}
	if (button.type === 'toggle') {
		return `${button.label || __('Theme', 'code-block-pro')} · ${SCOPES[button.scope ?? 'page']}`;
	}
	return button.label ? `${button.label} · ${button.id}` : button.id;
};

// Buttons have no ids, so each one keeps a key while it moves in the list.
const keys = new WeakMap<ProfileButton, number>();
let lastKey = 0;
const keyOf = (button: ProfileButton) => {
	if (!keys.has(button)) keys.set(button, ++lastKey);
	return keys.get(button);
};

const move = <T,>(list: T[], from: number, to: number) => {
	const next = [...list];
	const [item] = next.splice(from, 1);
	next.splice(to, 0, item);
	return next;
};

const ButtonsPage = ({ profile, onChange, onButton }: PageProps) => {
	const { buttons, conditions } = profile.data;
	const save = (next: ProfileButton[]) =>
		onChange({ ...profile.data, buttons: next });
	const has = (type: ProfileButton['type']) =>
		buttons.some((b) => b.type === type);
	const fresh: Record<ProfileButton['type'], ProfileButton> = {
		copy: { type: 'copy', icon: 'heroicons', label: '', copiedLabel: '' },
		toggle: {
			type: 'toggle',
			label: '',
			conditions: conditions.map((c) => c.id),
			scope: 'page',
			remember: true,
		},
		custom: { type: 'custom', id: `button-${buttons.length + 1}`, label: '' },
	};
	const added = __('Already added', 'code-block-pro');
	const unavailable: Record<ProfileButton['type'], string> = {
		copy: has('copy') ? added : '',
		toggle: has('toggle')
			? added
			: conditions.length < 2
				? __('Needs a dark theme', 'code-block-pro')
				: '',
		custom: '',
	};

	return (
		<Section title={__('Buttons', 'code-block-pro')} hideTitle>
			{buttons.length > 0 && (
				<div className="cbp-manager-cards">
					{buttons.map((button, i) => (
						<div key={keyOf(button)} className="cbp-manager-row">
							<button
								type="button"
								className="cbp-manager-row-main"
								data-return={`button-${i}`}
								onClick={() => onButton(i)}
							>
								<span className="cbp-manager-profile-text">
									<span className="cbp-manager-profile-title">
										{BUTTON_TYPES[button.type]}
									</span>
									<span className="cbp-manager-profile-meta">
										{describe(button)}
									</span>
								</span>
								<Svg d={CHEVRON_RIGHT} />
							</button>
							<Button
								size="compact"
								label={__('Move up', 'code-block-pro')}
								icon={<Svg d={CHEVRON_UP} />}
								disabled={i === 0}
								accessibleWhenDisabled
								onClick={() => save(move(buttons, i, i - 1))}
							/>
							<Button
								size="compact"
								label={__('Move down', 'code-block-pro')}
								icon={<Svg d={CHEVRON_DOWN} />}
								disabled={i === buttons.length - 1}
								accessibleWhenDisabled
								onClick={() => save(move(buttons, i, i + 1))}
							/>
						</div>
					))}
				</div>
			)}
			<Dropdown
				className="cbp-manager-add-button"
				popoverProps={{ placement: 'bottom-start' }}
				renderToggle={({ isOpen, onToggle }) => (
					<Button
						variant="secondary"
						__next40pxDefaultSize
						aria-expanded={isOpen}
						onClick={onToggle}
					>
						{__('Add button', 'code-block-pro')}
					</Button>
				)}
				renderContent={({ onClose }) => (
					<MenuGroup>
						{(Object.keys(BUTTON_TYPES) as ProfileButton['type'][]).map(
							(type) => (
								<MenuItem
									key={type}
									disabled={unavailable[type] !== ''}
									info={unavailable[type] || undefined}
									onClick={() => {
										onClose();
										save([...buttons, fresh[type]]);
										onButton(buttons.length);
									}}
								>
									{BUTTON_TYPES[type]}
								</MenuItem>
							),
						)}
					</MenuGroup>
				)}
			/>
		</Section>
	);
};

const StatsPage = ({ uses }: PageProps) => (
	<Section title={__('Pages', 'code-block-pro')}>
		{uses.length === 0 ? (
			<p className="cbp-manager-empty">
				{__('No pages use this profile.', 'code-block-pro')}
			</p>
		) : (
			<div className="cbp-manager-cards">
				{uses.map((page) => (
					<a
						key={page.id}
						className="cbp-manager-row-main cbp-manager-page"
						href={page.url}
						target="_blank"
						rel="noreferrer"
					>
						<span className="cbp-manager-profile-text">
							<span className="cbp-manager-profile-title">{page.title}</span>
							<span className="cbp-manager-profile-meta">
								{sprintf(
									/* translators: %d: how many code blocks on the page use the profile. */
									_n('%d block', '%d blocks', page.blocks, 'code-block-pro'),
									page.blocks,
								)}
							</span>
						</span>
						<Svg d={EXTERNAL} />
					</a>
				))}
			</div>
		)}
	</Section>
);

export const FEATURE_PAGES: Record<string, (props: PageProps) => JSX.Element> =
	{
		font: FontPage,
		header: HeaderPage,
		footer: FooterPage,
		'line-numbers': LineNumbersPage,
		'see-more': SeeMorePage,
		buttons: ButtonsPage,
		stats: StatsPage,
	};

type PickProps = {
	pick: Pick;
	profile: Profile;
	meta: Meta;
	onChange: (data: ProfileData) => void;
};

export const PickScreen = ({ pick, profile, meta, onChange }: PickProps) => {
	const { samples } = useSamples(profile.sample);
	const { settings } = profile.data;
	const light = profile.data.conditions[0].theme;
	const background =
		meta.themes.find((t) => t.slug === light)?.background ?? '#fff';
	const sample = sampleOf(profile, meta);

	const choices: Record<
		Exclude<Pick, 'font'>,
		{ key: keyof Settings; values: string[]; labels: Record<string, string> }
	> = {
		header: {
			key: 'headerType',
			values: ['none', ...meta.headers],
			labels: HEADERS,
		},
		footer: {
			key: 'footerType',
			values: ['none', ...meta.footers],
			labels: FOOTERS,
		},
		seeMore: { key: 'seeMoreType', values: meta.seeMore, labels: SEE_MORE },
	};
	const chrome = pick === 'font' ? null : choices[pick];
	const swaps: Swap[] = chrome
		? chrome.values.map((value) => ({ settings: { [chrome.key]: value } }))
		: [];
	const items = useDraftRenders(
		chrome ? profile.data : null,
		swaps,
		attributesFor(sample, { fold: pick === 'seeMore' }),
		pick.slice(0, 4),
	);

	useEffect(() => {
		if (pick === 'font')
			for (const font of meta.fonts) loadFont(meta, font.value);
	}, [pick, meta]);

	if (pick === 'font') {
		const options = [
			{ value: '', label: __('System default', 'code-block-pro') },
			...meta.fonts,
		].map((font) => ({
			value: font.value,
			label: font.label,
			thumb: (
				<Preview
					html={samples[light] ?? ''}
					background={background}
					font={fontStack(font.value)}
				/>
			),
		}));
		return (
			<Section title={PICK_TITLES.font}>
				<PickGrid
					label={PICK_TITLES.font}
					options={options}
					value={settings.fontFamily.replace(/\..*$/, '')}
					onPick={(font) =>
						onChange(setSetting(profile.data, 'fontFamily', font))
					}
				/>
			</Section>
		);
	}

	const { key, values, labels } = chrome as NonNullable<typeof chrome>;
	return (
		<Section title={PICK_TITLES[pick]}>
			<PickGrid
				label={sprintf(
					/* translators: %s: what the styles are for, such as Header. */
					__('%s style', 'code-block-pro'),
					PICK_TITLES[pick],
				)}
				options={values.map((value, i) => ({
					value,
					label: labels[value] ?? value,
					thumb: <BlockThumb html={items[i]} />,
				}))}
				value={String(settings[key])}
				onPick={(value) => onChange(setSetting(profile.data, key, value))}
			/>
		</Section>
	);
};

type ButtonProps = {
	index: number;
	profile: Profile;
	meta: Meta;
	onChange: (data: ProfileData) => void;
	onRemoved: () => void;
};

type Edit<T extends ProfileButton['type']> = {
	button: Extract<ProfileButton, { type: T }>;
	onSave: (button: ProfileButton) => void;
};

const CopyIcon = ({
	button,
	items,
	onSave,
}: Edit<'copy'> & { items: string[] }) => (
	<Section title={__('Icon', 'code-block-pro')}>
		<PickGrid
			label={__('Icon', 'code-block-pro')}
			options={Object.entries(COPY_ICONS).map(([icon, label], i) => ({
				value: icon,
				label,
				thumb: <BlockThumb html={items[i]} corner />,
			}))}
			value={button.icon}
			onPick={(icon) => onSave({ ...button, icon: icon as typeof button.icon })}
		/>
	</Section>
);

const SwitchOptions = ({ button, onSave }: Edit<'toggle'>) => (
	<Section title={__('Switch', 'code-block-pro')}>
		<Option>
			<RadioControl
				label={__('A click changes', 'code-block-pro')}
				selected={button.scope ?? 'page'}
				options={Object.entries(SCOPES).map(([value, label]) => ({
					value,
					label,
				}))}
				onChange={(scope) =>
					onSave({ ...button, scope: scope as typeof button.scope })
				}
			/>
		</Option>
		<Option>
			<ToggleControl
				__nextHasNoMarginBottom
				label={__('Remember the reader’s choice', 'code-block-pro')}
				help={
					(button.scope ?? 'page') === 'site'
						? __(
								'Kept in the reader’s browser. Other pages follow the choice only while this is on.',
								'code-block-pro',
							)
						: __(
								'Kept in the reader’s browser, so it is still there after a reload or a later visit.',
								'code-block-pro',
							)
				}
				checked={button.remember ?? true}
				onChange={(remember) => onSave({ ...button, remember })}
			/>
		</Option>
	</Section>
);

const EventOptions = ({ button, onSave }: Edit<'custom'>) => (
	<Section title={__('Event', 'code-block-pro')}>
		<Option>
			<CommitText
				label={__('Event ID', 'code-block-pro')}
				value={button.id}
				help={createInterpolateElement(
					__(
						'Clicking the button fires a <event /> event with this as <id />.',
						'code-block-pro',
					),
					{
						event: <code>code-block-pro:button</code>,
						id: <code>detail.id</code>,
					},
				)}
				required
				onCommit={(id) => onSave({ ...button, id })}
			/>
		</Option>
	</Section>
);

const PLACEHOLDERS: Record<ProfileButton['type'], string> = {
	copy: __('Copy', 'code-block-pro'),
	toggle: __('Theme', 'code-block-pro'),
	custom: '',
};

const ButtonText = ({
	button,
	onSave,
}: {
	button: ProfileButton;
	onSave: (button: ProfileButton) => void;
}) => (
	<Section title={__('Text', 'code-block-pro')}>
		<Option>
			<CommitText
				label={
					button.type === 'copy' && button.icon !== 'textSimple'
						? __('Label for screen readers', 'code-block-pro')
						: __('Label', 'code-block-pro')
				}
				placeholder={
					button.type === 'custom' ? button.id : PLACEHOLDERS[button.type]
				}
				value={button.label}
				onCommit={(label) => onSave({ ...button, label })}
			/>
		</Option>
		{button.type === 'copy' && (
			<Option>
				<CommitText
					label={__('After copying', 'code-block-pro')}
					placeholder={__('Copied!', 'code-block-pro')}
					value={button.copiedLabel}
					onCommit={(copiedLabel) => onSave({ ...button, copiedLabel })}
				/>
			</Option>
		)}
	</Section>
);

export const ButtonScreen = ({
	index,
	profile,
	meta,
	onChange,
	onRemoved,
}: ButtonProps) => {
	const button = profile.data.buttons[index];
	const swaps: Swap[] =
		button?.type === 'copy'
			? Object.keys(COPY_ICONS).map((icon) => ({
					buttons: [{ ...button, icon } as ProfileButton],
				}))
			: [];
	const items = useDraftRenders(
		button?.type === 'copy' ? profile.data : null,
		swaps,
		attributesFor(sampleOf(profile, meta)),
		'icon',
	);
	if (!button) return null;

	const onSave = (next: ProfileButton) =>
		onChange({
			...profile.data,
			buttons: profile.data.buttons.map((b, i) => (i === index ? next : b)),
		});
	const remove = () => {
		onChange({
			...profile.data,
			buttons: profile.data.buttons.filter((_, i) => i !== index),
		});
		onRemoved();
	};

	return (
		<>
			{button.type === 'copy' && (
				<CopyIcon button={button} items={items} onSave={onSave} />
			)}
			{button.type === 'toggle' && (
				<SwitchOptions button={button} onSave={onSave} />
			)}
			{button.type === 'custom' && (
				<EventOptions button={button} onSave={onSave} />
			)}
			<ButtonText button={button} onSave={onSave} />
			<Button
				variant="secondary"
				isDestructive
				__next40pxDefaultSize
				onClick={remove}
			>
				{__('Remove button', 'code-block-pro')}
			</Button>
		</>
	);
};
