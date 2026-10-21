import { RadioControl, TextControl } from '@wordpress/components';
import { useEffect, useRef, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import {
	type Condition,
	DARK_QUERY,
	humanize,
	newConditionId,
	type Profile,
	type ProfileData,
	type Theme,
	type Trigger,
	useSamples,
} from './api';
import { CHECK, fontStack, LOCK, PLUS, Preview, Section, Svg } from './ui';

// Dark follows the browser's setting, or a class a theme or dark-mode plugin puts on the page.
const isDark = (c: Condition) =>
	(c.trigger.type === 'media' && c.trigger.value === DARK_QUERY) ||
	c.trigger.type === 'class';
const BROWSER_DARK: Trigger = { type: 'media', value: DARK_QUERY };
export const darkOf = (data: ProfileData) =>
	data.conditions.slice(1).find(isDark) ?? null;
const customOf = (data: ProfileData) =>
	data.conditions.slice(1).filter((c) => !isDark(c));

const withLight = (data: ProfileData, theme: string): ProfileData => ({
	...data,
	conditions: data.conditions.map((c, i) => (i === 0 ? { ...c, theme } : c)),
});

const withoutDark = (data: ProfileData, dark: Condition): ProfileData => ({
	...data,
	conditions: data.conditions.filter((c) => c !== dark),
	languages: Object.fromEntries(
		Object.entries(data.languages).map(([language, byId]) => [
			language,
			Object.fromEntries(Object.entries(byId).filter(([id]) => id !== dark.id)),
		]),
	),
	buttons: data.buttons.map((b) =>
		b.type === 'toggle'
			? { ...b, conditions: b.conditions.filter((id) => id !== dark.id) }
			: b,
	),
});

const withDark = (
	data: ProfileData,
	theme: string | null,
	trigger: Trigger,
): ProfileData => {
	const dark = darkOf(data);
	if (theme === null) return dark ? withoutDark(data, dark) : data;
	if (dark) {
		return {
			...data,
			conditions: data.conditions.map((c) =>
				c === dark ? { ...c, theme } : c,
			),
		};
	}
	const added: Condition = {
		id: newConditionId(data),
		name: 'Dark',
		theme,
		trigger,
		background: { type: 'theme' },
	};
	return { ...data, conditions: [...data.conditions, added] };
};

const withDarkTrigger = (data: ProfileData, trigger: Trigger): ProfileData => {
	const dark = darkOf(data);
	return dark
		? {
				...data,
				conditions: data.conditions.map((c) =>
					c === dark ? { ...c, trigger } : c,
				),
			}
		: data;
};

const CLASS_NAME = /^-?[_a-zA-Z][_a-zA-Z0-9-]{0,99}$/;

const DarkSettings = ({
	trigger,
	onChange,
}: {
	trigger: Trigger;
	onChange: (trigger: Trigger) => void;
}) => {
	const [mode, setMode] = useState(
		trigger.type === 'class' ? 'class' : 'media',
	);
	const [name, setName] = useState(
		trigger.type === 'class' ? trigger.value : '',
	);
	const valid = CLASS_NAME.test(name);
	return (
		<div className="cbp-manager-settings">
			<RadioControl
				label={__('Switch to Dark by', 'code-block-pro')}
				selected={mode}
				options={[
					{ label: __('Browser setting', 'code-block-pro'), value: 'media' },
					{ label: __('Class name', 'code-block-pro'), value: 'class' },
				]}
				onChange={(next) => {
					setMode(next);
					if (next === 'media') onChange(BROWSER_DARK);
					else if (valid) onChange({ type: 'class', value: name });
				}}
			/>
			{mode === 'class' && (
				<TextControl
					__nextHasNoMarginBottom
					__next40pxDefaultSize
					label={__('Class name', 'code-block-pro')}
					placeholder="dark-mode"
					value={name}
					help={
						name && !valid
							? __(
									'Use letters, numbers, hyphens and underscores, starting with a letter.',
									'code-block-pro',
								)
							: __(
									'The class your theme or dark mode plugin adds to the page while dark mode is on.',
									'code-block-pro',
								)
					}
					onChange={(next) => {
						const value = next.trim();
						setName(value);
						if (CLASS_NAME.test(value)) onChange({ type: 'class', value });
					}}
				/>
			)}
		</div>
	);
};

type TilesProps = {
	profile: Profile;
	themeTitle: (slug: string) => string;
	background: (slug: string) => string;
	onOpen: (tab: 'light' | 'dark') => void;
};

export const ThemeTiles = ({
	profile,
	themeTitle,
	background,
	onOpen,
}: TilesProps) => {
	const { samples } = useSamples(profile.sample);
	const first = useRef<HTMLButtonElement>(null);
	useEffect(() => first.current?.focus(), []);
	const light = profile.data.conditions[0].theme;
	const dark = darkOf(profile.data);
	const custom = customOf(profile.data);
	const font = fontStack(profile.data.settings.fontFamily);

	return (
		<Section title={__('Theme', 'code-block-pro')} hideTitle>
			<div className="cbp-manager-tiles">
				<button
					ref={first}
					type="button"
					className="cbp-manager-tile"
					onClick={() => onOpen('light')}
				>
					<span className="cbp-manager-box">
						<Preview
							html={samples[light] ?? ''}
							background={background(light)}
							font={font}
						/>
					</span>
					<span className="cbp-manager-label">
						{__('Light', 'code-block-pro')}
					</span>
					<span className="cbp-manager-meta">{themeTitle(light)}</span>
				</button>
				<button
					type="button"
					className="cbp-manager-tile"
					onClick={() => onOpen('dark')}
				>
					{dark ? (
						<span className="cbp-manager-box">
							<Preview
								html={samples[dark.theme] ?? ''}
								background={background(dark.theme)}
								font={font}
							/>
						</span>
					) : (
						<span className="cbp-manager-box is-empty">
							<Svg d={PLUS} />
						</span>
					)}
					<span className="cbp-manager-label">
						{__('Dark', 'code-block-pro')}
					</span>
					<span className="cbp-manager-meta">
						{dark ? themeTitle(dark.theme) : __('None', 'code-block-pro')}
					</span>
				</button>
				<button type="button" className="cbp-manager-tile" disabled>
					<span className="cbp-manager-box is-empty">
						<Svg d={LOCK} />
					</span>
					<span className="cbp-manager-label">
						{__('Custom', 'code-block-pro')}
					</span>
					<span className="cbp-manager-meta">
						{custom.length
							? sprintf(
									/* translators: %d: how many custom themes the profile has. */
									__('%d · Theme Pack', 'code-block-pro'),
									custom.length,
								)
							: __('Theme Pack', 'code-block-pro')}
					</span>
				</button>
			</div>
		</Section>
	);
};

type ThemeScreenProps = {
	profile: Profile;
	tab: 'light' | 'dark';
	themes: Theme[];
	onChange: (data: ProfileData) => void;
};

export const ThemeScreen = ({
	profile,
	tab,
	themes,
	onChange,
}: ThemeScreenProps) => {
	// Kept here until a Dark theme exists to carry it.
	const [pending, setPending] = useState<Trigger>(
		() => darkOf(profile.data)?.trigger ?? BROWSER_DARK,
	);
	const { samples } = useSamples(profile.sample);
	const [quiet, setQuiet] = useState(true);
	const grid = useRef<HTMLDivElement>(null);
	const light = profile.data.conditions[0].theme;
	const dark = darkOf(profile.data)?.theme ?? null;
	const pick = (theme: string | null) =>
		onChange(
			tab === 'light' && theme
				? withLight(profile.data, theme)
				: withDark(profile.data, theme, pending),
		);

	// Entering the screen lands on the chosen theme, or the first one.
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

	const sorted = themes.toSorted((a, b) => Number(b.dark) - Number(a.dark));
	const value = tab === 'light' ? light : dark;

	return (
		<div className="cbp-manager-screen">
			<Section
				title={
					tab === 'dark'
						? __('Dark', 'code-block-pro')
						: __('Light', 'code-block-pro')
				}
			>
				{tab === 'dark' && (
					<DarkSettings
						trigger={pending}
						onChange={(trigger) => {
							setPending(trigger);
							onChange(withDarkTrigger(profile.data, trigger));
						}}
					/>
				)}
				<div
					ref={grid}
					className={`cbp-manager-grid${quiet ? ' is-quiet' : ''}`}
					role="radiogroup"
					aria-label={
						tab === 'dark'
							? __('Dark theme', 'code-block-pro')
							: __('Light theme', 'code-block-pro')
					}
				>
					{tab === 'dark' && (
						<button
							type="button"
							role="radio"
							aria-checked={dark === null}
							className="cbp-manager-card"
							onClick={() => pick(null)}
						>
							<span className="cbp-manager-box is-empty">
								{dark === null && (
									<span className="cbp-manager-check">
										<Svg d={CHECK} size={20} />
									</span>
								)}
							</span>
							<span className="cbp-manager-label">
								{__('No theme', 'code-block-pro')}
							</span>
						</button>
					)}
					{sorted.map((theme) => (
						<button
							key={theme.slug}
							type="button"
							role="radio"
							aria-checked={theme.slug === value}
							className="cbp-manager-card"
							onClick={() => pick(theme.slug)}
						>
							<span className="cbp-manager-box">
								<Preview
									html={samples[theme.slug] ?? ''}
									background={theme.background}
									font={fontStack(profile.data.settings.fontFamily)}
								/>
								{theme.slug === value && (
									<span className="cbp-manager-check">
										<Svg d={CHECK} size={20} />
									</span>
								)}
							</span>
							<span className="cbp-manager-label">{humanize(theme.title)}</span>
						</button>
					))}
				</div>
			</Section>
		</div>
	);
};
