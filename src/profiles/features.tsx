import {
	Button,
	FontSizePicker,
	Popover,
	ToggleControl,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
} from '@wordpress/components';
import {
	createInterpolateElement,
	useEffect,
	useRef,
	useState,
} from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import {
	type Meta,
	type PageUse,
	type Profile,
	type ProfileData,
	type Settings,
	setSetting,
	type Swap,
	useDraftRenders,
	useSamples,
} from './api';
import { ButtonsPage } from './buttons';
import {
	attributesFor,
	BlockThumb,
	Option,
	PickGrid,
	Selected,
	sampleOf,
} from './parts';
import {
	CommitText,
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
const headerName = (type: string) => HEADERS[type] ?? type;
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

const EXTERNAL =
	'M19.5 4.5h-7V6h4.44l-5.97 5.97 1.06 1.06L18 7.06v4.44h1.5v-7Zm-13 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3H17v3a.5.5 0 0 1-.5.5h-10a.5.5 0 0 1-.5-.5v-10a.5.5 0 0 1 .5-.5h3V5.5h-3Z';

const withLigatures = (meta: Meta, family: string) => {
	const name = fontLabel(meta, family);
	const font = meta.fonts.find((f) => f.value === family.replace(/\..*$/, ''));
	return font?.ligatures
		? /* translators: %s: a font's name. */
			sprintf(__('%s (with ligatures)', 'code-block-pro'), name)
		: name;
};

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

export type PageProps = {
	profile: Profile;
	meta: Meta;
	uses: PageUse[];
	dirty: boolean;
	onChange: (data: ProfileData) => void;
	onPick: (pick: Pick) => void;
	onManageBlocks: () => void;
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
	const heights = LINE_HEIGHTS.some((h) => h.value === settings.lineHeight)
		? LINE_HEIGHTS
		: [
				...LINE_HEIGHTS,
				{ value: settings.lineHeight, label: settings.lineHeight },
			];

	return (
		<>
			<Section title={__('Font', 'code-block-pro')} hideTitle>
				<Selected
					label={__('Selected Font', 'code-block-pro')}
					value={withLigatures(meta, settings.fontFamily)}
					returnKey="font"
					onSelect={() => onPick('font')}
				/>
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

const HeaderPage = ({ profile, onPick }: PageProps) => (
	<Section title={__('Header', 'code-block-pro')} hideTitle>
		<Selected
			label={__('Selected Header', 'code-block-pro')}
			value={headerName(profile.data.settings.headerType)}
			returnKey="header"
			onSelect={() => onPick('header')}
		/>
	</Section>
);

const FooterPage = ({ profile, onPick }: PageProps) => {
	const type = profile.data.settings.footerType;
	return (
		<Section title={__('Footer', 'code-block-pro')} hideTitle>
			<Selected
				label={__('Selected Footer', 'code-block-pro')}
				value={FOOTERS[type] ?? type}
				returnKey="footer"
				onSelect={() => onPick('footer')}
			/>
		</Section>
	);
};

// Live, not a thumbnail: highlighting on hover has to be tried to be judged.
const LineNumbersPage = ({ profile, meta, onChange }: PageProps) => {
	const [settings, set] = useSettings(profile, onChange);
	const [html] = useDraftRenders(
		profile.data,
		[{}],
		attributesFor(sampleOf(profile, meta)),
		'lines',
	);
	return (
		<>
			<div
				className="cbp-manager-live"
				dangerouslySetInnerHTML={{ __html: html ?? '' }}
			/>
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
		</>
	);
};

const SeeMorePage = ({ profile, meta, onChange, onPick }: PageProps) => {
	const [settings, set] = useSettings(profile, onChange);
	const on = settings.seeMoreType !== '';
	// Turning See more back on brings back the style it had.
	const last = useRef(settings.seeMoreType || meta.seeMore[0]);
	useEffect(() => {
		if (on) last.current = settings.seeMoreType;
	}, [on, settings.seeMoreType]);
	const live = useDraftRenders(
		on ? profile.data : null,
		[{}],
		attributesFor(sampleOf(profile, meta), { fold: true }),
		'live',
	);
	return (
		<>
			<Section title={__('See more', 'code-block-pro')} hideTitle>
				<Option>
					<ToggleControl
						__nextHasNoMarginBottom
						label={__('Enabled', 'code-block-pro')}
						checked={on}
						onChange={(value) => set('seeMoreType', value ? last.current : '')}
					/>
				</Option>
				<div className="cbp-manager-tiles">
					<button
						type="button"
						className="cbp-manager-tile"
						data-return="seeMore"
						onClick={() => onPick('seeMore')}
					>
						<span className={`cbp-manager-box${on ? '' : ' is-empty'}`}>
							{on ? (
								<BlockThumb html={live[0]} />
							) : (
								__('Not set', 'code-block-pro')
							)}
						</span>
						<span className="cbp-manager-label">
							{__('Style', 'code-block-pro')}
						</span>
						<span className="cbp-manager-meta">
							{SEE_MORE[settings.seeMoreType] ?? ''}
						</span>
					</button>
				</div>
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

const StatsPage = ({ uses, dirty, onManageBlocks }: PageProps) => (
	<>
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
		<div className="cbp-manager-actions">
			<Button
				variant="secondary"
				__next40pxDefaultSize
				disabled={dirty}
				accessibleWhenDisabled
				onClick={onManageBlocks}
			>
				{__('Manage blocks', 'code-block-pro')}
			</Button>
			{dirty && (
				<span className="cbp-manager-hint">
					{__('Save your changes before managing blocks.', 'code-block-pro')}
				</span>
			)}
		</div>
	</>
);

export const FEATURE_PAGES: Record<string, (props: PageProps) => JSX.Element> =
	{
		font: FontPage,
		header: HeaderPage,
		footer: FooterPage,
		'line-numbers': LineNumbersPage,
		'see-more': SeeMorePage,
		buttons: ({ profile, meta, onChange }: PageProps) => (
			<ButtonsPage profile={profile} meta={meta} onChange={onChange} />
		),
		stats: StatsPage,
	};

type PickProps = {
	pick: Pick;
	profile: Profile;
	meta: Meta;
	onChange: (data: ProfileData) => void;
};

const FontChoices = ({ profile, meta, onChange }: Omit<PickProps, 'pick'>) => {
	const { samples } = useSamples(profile.sample);
	const light = profile.data.conditions[0].theme;
	const background =
		meta.themes.find((t) => t.slug === light)?.background ?? '#fff';

	useEffect(() => {
		for (const font of meta.fonts) loadFont(meta, font.value);
	}, [meta]);

	const options = [
		{ value: '', label: __('System default', 'code-block-pro') },
		...meta.fonts.map((font) => ({
			value: font.value,
			label: withLigatures(meta, font.value),
		})),
	].map((font) => ({
		...font,
		thumb: (
			<Preview
				html={samples[light] ?? ''}
				background={background}
				font={fontStack(font.value)}
			/>
		),
	}));

	return (
		<Section title={PICK_TITLES.font} hideTitle>
			<p className="cbp-manager-description">
				{createInterpolateElement(
					__(
						'Choose the font to display. Note that fonts with ligatures will render some glyphs like <plain /> as <ligature />',
						'code-block-pro',
					),
					{
						plain: <code className="cbp-manager-no-ligatures">===</code>,
						ligature: <code className="cbp-manager-ligatures">===</code>,
					},
				)}
			</p>
			<PickGrid
				label={PICK_TITLES.font}
				options={options}
				value={profile.data.settings.fontFamily.replace(/\..*$/, '')}
				onPick={(font) =>
					onChange(setSetting(profile.data, 'fontFamily', font))
				}
			/>
		</Section>
	);
};

const STYLE_CHOICES: Record<
	Exclude<Pick, 'font'>,
	{ key: keyof Settings; labels: Record<string, string>; hint: string }
> = {
	header: {
		key: 'headerType',
		labels: HEADERS,
		hint: __('Select a header below.', 'code-block-pro'),
	},
	footer: {
		key: 'footerType',
		labels: FOOTERS,
		hint: __('Select a footer below.', 'code-block-pro'),
	},
	seeMore: { key: 'seeMoreType', labels: SEE_MORE, hint: '' },
};

const StyleChoices = ({
	pick,
	profile,
	meta,
	onChange,
}: PickProps & { pick: Exclude<Pick, 'font'> }) => {
	const choice = STYLE_CHOICES[pick];
	const values: Record<Exclude<Pick, 'font'>, string[]> = {
		header: ['none', ...meta.headers],
		footer: ['none', ...meta.footers],
		seeMore: meta.seeMore,
	};
	const options = values[pick];
	// Header and footer previews leave the buttons out; they aren't part of the choice.
	const swaps: Swap[] = options.map((value) => ({
		settings: { [choice.key]: value },
		...(pick !== 'seeMore' && { buttons: [] }),
	}));
	const items = useDraftRenders(
		profile.data,
		swaps,
		attributesFor(sampleOf(profile, meta), { fold: pick === 'seeMore' }),
		pick.slice(0, 4),
	);

	return (
		<Section title={PICK_TITLES[pick]} hideTitle={choice.hint !== ''}>
			{choice.hint && <p className="cbp-manager-description">{choice.hint}</p>}
			<PickGrid
				label={sprintf(
					/* translators: %s: what the styles are for, such as Header. */
					__('%s style', 'code-block-pro'),
					PICK_TITLES[pick],
				)}
				options={options.map((value, i) => ({
					value,
					label: choice.labels[value] ?? value,
					thumb: <BlockThumb html={items[i]} />,
				}))}
				value={String(profile.data.settings[choice.key])}
				onPick={(value) =>
					onChange(setSetting(profile.data, choice.key, value))
				}
			/>
		</Section>
	);
};

export const PickScreen = ({ pick, profile, meta, onChange }: PickProps) =>
	pick === 'font' ? (
		<FontChoices profile={profile} meta={meta} onChange={onChange} />
	) : (
		<StyleChoices
			pick={pick}
			profile={profile}
			meta={meta}
			onChange={onChange}
		/>
	);
