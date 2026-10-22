import { Button, RadioControl, ToggleControl } from '@wordpress/components';
import {
	createInterpolateElement,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
	type Button as ProfileButton,
	type Meta,
	type Profile,
	type ProfileData,
	type Swap,
	useDraftRenders,
} from './api';
import { attributesFor, BlockThumb, Option, PickGrid, sampleOf } from './parts';
import { CommitText, Section, Svg } from './ui';

type Type = ProfileButton['type'];

const BUTTON_TYPES: Record<Type, string> = {
	copy: __('Copy', 'code-block-pro'),
	toggle: __('Theme switch', 'code-block-pro'),
	custom: __('Custom', 'code-block-pro'),
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
const PLACEHOLDERS: Record<Type, string> = {
	copy: __('Copy', 'code-block-pro'),
	toggle: __('Theme', 'code-block-pro'),
	custom: '',
};

// @wordpress/icons' arrows.
const ARROW_UP = 'M12 3.9 6.5 9.5l1 1 3.8-3.7V20h1.5V6.8l3.7 3.7 1-1z';
const ARROW_DOWN =
	'm16.5 13.5-3.7 3.7V4h-1.5v13.2l-3.8-3.7-1 1 5.5 5.6 5.5-5.6z';
const ARROW_LEFT = 'M20 11.2H6.8l3.7-3.7-1-1L3.9 12l5.6 5.5 1-1-3.7-3.7H20z';
const ARROW_RIGHT = 'm14.5 6.5-1 1 3.7 3.7H4v1.6h13.2l-3.7 3.7 1 1 5.6-5.5z';

// The preview draws the block this wide, scales it to the tab's width and shows its top this tall.
const BLOCK_WIDTH = 360;
const BLOCK_TOP = 112;

type Selection =
	| { rail: 'block'; index: number }
	| { rail: 'available'; type: Type }
	| null;

const fresh = (type: Type, data: ProfileData): ProfileButton => {
	if (type === 'copy') {
		return { type, icon: 'heroicons', label: '', copiedLabel: '' };
	}
	if (type === 'toggle') {
		return {
			type,
			label: '',
			conditions: data.conditions.map((c) => c.id),
			scope: 'page',
			remember: true,
		};
	}
	const taken = new Set(
		data.buttons.flatMap((b) => (b.type === 'custom' ? [b.id] : [])),
	);
	let n = 1;
	while (taken.has(`button-${n}`)) n++;
	return { type, id: `button-${n}`, label: '' };
};

/** The profile button a rendered one stands for; the renderer skips a switch with no Dark to switch to. */
const indexOf = (el: Element, buttons: ProfileButton[]) => {
	if (el.classList.contains('cbp-copy')) {
		return buttons.findIndex((b) => b.type === 'copy');
	}
	if (el.classList.contains('cbp-toggle')) {
		return buttons.findIndex((b) => b.type === 'toggle');
	}
	const id = el.getAttribute('data-cbp-button');
	return buttons.findIndex((b) => b.type === 'custom' && b.id === id);
};

const move = <T,>(list: T[], from: number, to: number) => {
	const next = [...list];
	const [item] = next.splice(from, 1);
	next.splice(to, 0, item);
	return next;
};

type Edit<T extends Type> = {
	button: Extract<ProfileButton, { type: T }>;
	onSave: (button: ProfileButton) => void;
};

const CopyIcon = ({
	button,
	profile,
	meta,
	onSave,
}: Edit<'copy'> & { profile: Profile; meta: Meta }) => {
	const swaps: Swap[] = Object.keys(COPY_ICONS).map((icon) => ({
		buttons: [{ ...button, icon } as ProfileButton],
	}));
	const items = useDraftRenders(
		profile.data,
		swaps,
		attributesFor(sampleOf(profile, meta)),
		'icon',
	);
	return (
		<Section title={__('Icon', 'code-block-pro')}>
			<PickGrid
				label={__('Icon', 'code-block-pro')}
				options={Object.entries(COPY_ICONS).map(([icon, label], i) => ({
					value: icon,
					label,
					thumb: <BlockThumb html={items[i]} corner />,
				}))}
				value={button.icon}
				onPick={(icon) =>
					onSave({ ...button, icon: icon as typeof button.icon })
				}
			/>
		</Section>
	);
};

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

const ButtonSettings = ({
	button,
	profile,
	meta,
	onSave,
}: {
	button: ProfileButton;
	profile: Profile;
	meta: Meta;
	onSave: (button: ProfileButton) => void;
}) => (
	<div className="cbp-manager-button-settings">
		{button.type === 'copy' && (
			<CopyIcon button={button} profile={profile} meta={meta} onSave={onSave} />
		)}
		{button.type === 'toggle' && (
			<SwitchOptions button={button} onSave={onSave} />
		)}
		{button.type === 'custom' && (
			<EventOptions button={button} onSave={onSave} />
		)}
		<ButtonText button={button} onSave={onSave} />
	</div>
);

type Props = {
	profile: Profile;
	meta: Meta;
	onChange: (data: ProfileData) => void;
};

export const ButtonsPage = ({ profile, meta, onChange }: Props) => {
	const { buttons, conditions } = profile.data;
	const [selected, setSelected] = useState<Selection>(null);
	const [html] = useDraftRenders(
		profile.data,
		[{}],
		attributesFor(sampleOf(profile, meta)),
		'btns',
	);
	const stage = useRef<HTMLDivElement>(null);
	const area = useRef<HTMLDivElement>(null);
	const inner = useRef<HTMLDivElement>(null);
	const chips = useRef<Partial<Record<Type, HTMLButtonElement | null>>>({});
	const [view, setView] = useState({ zoom: 1, height: 0 });
	const [arrowsAt, setArrowsAt] = useState<{ x: number; y: number } | null>(
		null,
	);
	const index = selected?.rail === 'block' ? selected.index : -1;
	const hasDark = conditions.length > 1;
	const available = (['copy', 'toggle', 'custom'] as Type[]).filter(
		(type) => type === 'custom' || !buttons.some((b) => b.type === type),
	);

	useLayoutEffect(() => {
		const box = area.current;
		const block = inner.current;
		if (!box || !block) return undefined;
		const observer = new ResizeObserver(() =>
			setView({
				zoom: box.clientWidth / BLOCK_WIDTH,
				height: block.offsetHeight,
			}),
		);
		observer.observe(box);
		observer.observe(block);
		return () => observer.disconnect();
	}, []);

	// The preview's buttons are the block's own markup, so a click on one is caught here.
	useEffect(() => {
		const box = area.current;
		if (!box) return undefined;
		const pick = (event: MouseEvent) => {
			const el = (event.target as Element).closest('.cbp-button');
			const at = el ? indexOf(el, buttons) : -1;
			if (at >= 0) setSelected({ rail: 'block', index: at });
		};
		box.addEventListener('click', pick);
		return () => box.removeEventListener('click', pick);
	}, [buttons]);

	// Marks the selected button in the preview and puts the arrows below it, or above a chip in the rail.
	useLayoutEffect(() => {
		const box = stage.current;
		const block = inner.current;
		if (!box || !block) return;
		let target: Element | null =
			selected?.rail === 'available'
				? (chips.current[selected.type] ?? null)
				: null;
		for (const el of block.querySelectorAll('.cbp-buttons .cbp-button')) {
			const chosen = indexOf(el, buttons) === index;
			el.toggleAttribute('data-cbp-manager-selected', chosen);
			if (chosen) target = el;
		}
		const rect = target?.getBoundingClientRect();
		const origin = box.getBoundingClientRect();
		const below = selected?.rail === 'block';
		setArrowsAt(
			rect
				? {
						x: rect.left + rect.width / 2 - origin.left,
						y: (below ? rect.bottom + 6 : rect.top - 38) - origin.top,
					}
				: null,
		);
	}, [html, selected, buttons, index, view]);

	const save = (next: ProfileButton[]) =>
		onChange({ ...profile.data, buttons: next });
	const add = (type: Type) => {
		save([...buttons, fresh(type, profile.data)]);
		setSelected({ rail: 'block', index: buttons.length });
	};
	const remove = (at: number) => {
		save(buttons.filter((_, i) => i !== at));
		setSelected({ rail: 'available', type: buttons[at].type });
	};
	const shift = (at: number, by: number) => {
		save(move(buttons, at, at + by));
		setSelected({ rail: 'block', index: at + by });
	};

	return (
		<>
			<Section title={__('Buttons', 'code-block-pro')} hideTitle>
				<div ref={stage} className="cbp-manager-buttons-stage">
					<div
						ref={area}
						className={`cbp-manager-buttons-preview${view.height > BLOCK_TOP ? ' is-cropped' : ''}`}
						style={{
							height: Math.min(view.height, BLOCK_TOP) * view.zoom || undefined,
						}}
					>
						<div
							ref={inner}
							className="cbp-manager-buttons-block"
							style={{ width: BLOCK_WIDTH, transform: `scale(${view.zoom})` }}
							dangerouslySetInnerHTML={{ __html: html ?? '' }}
						/>
					</div>
					<div className="cbp-manager-arrows" />
					{selected && arrowsAt !== null && (
						<div
							className="cbp-manager-arrows-set"
							style={{ left: arrowsAt.x, top: arrowsAt.y }}
						>
							{selected.rail === 'block' ? (
								<>
									<Button
										size="small"
										icon={<Svg d={ARROW_LEFT} />}
										label={__('Move left', 'code-block-pro')}
										className={index > 0 ? '' : 'is-hidden'}
										onClick={() => shift(index, -1)}
									/>
									<Button
										size="small"
										icon={<Svg d={ARROW_DOWN} />}
										label={__('Take out of the block', 'code-block-pro')}
										onClick={() => remove(index)}
									/>
									<Button
										size="small"
										icon={<Svg d={ARROW_RIGHT} />}
										label={__('Move right', 'code-block-pro')}
										className={index < buttons.length - 1 ? '' : 'is-hidden'}
										onClick={() => shift(index, 1)}
									/>
								</>
							) : (
								<Button
									size="small"
									icon={<Svg d={ARROW_UP} />}
									label={__('Put in the block', 'code-block-pro')}
									onClick={() => add(selected.type)}
								/>
							)}
						</div>
					)}
					<div
						className="cbp-manager-rail"
						role="group"
						aria-label={__('Buttons to add', 'code-block-pro')}
					>
						{available.map((type) => (
							<Button
								key={type}
								ref={(el: HTMLButtonElement | null) => {
									chips.current[type] = el;
								}}
								variant="secondary"
								__next40pxDefaultSize
								isPressed={
									selected?.rail === 'available' && selected.type === type
								}
								disabled={type === 'toggle' && !hasDark}
								accessibleWhenDisabled
								onClick={() => setSelected({ rail: 'available', type })}
							>
								{BUTTON_TYPES[type]}
							</Button>
						))}
						{available.includes('toggle') && !hasDark && (
							<span className="cbp-manager-hint">
								{__('The theme switch needs a dark theme.', 'code-block-pro')}
							</span>
						)}
					</div>
				</div>
			</Section>
			{index >= 0 && buttons[index] && (
				<ButtonSettings
					key={index}
					button={buttons[index]}
					profile={profile}
					meta={meta}
					onSave={(next) =>
						save(buttons.map((b, i) => (i === index ? next : b)))
					}
				/>
			)}
		</>
	);
};
