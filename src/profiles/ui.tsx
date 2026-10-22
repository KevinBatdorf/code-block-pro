import { Button, TextControl, VisuallyHidden } from '@wordpress/components';
import { useId, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import type { Meta } from './api';

// WordPress's own icons (@wordpress/icons), inlined.
export const Svg = ({ d, size = 24 }: { d: string; size?: number }) => (
	<svg
		width={size}
		height={size}
		viewBox="0 0 24 24"
		aria-hidden="true"
		focusable="false"
	>
		<path d={d} fillRule="evenodd" clipRule="evenodd" />
	</svg>
);
export const CHEVRON_RIGHT = 'M10.6 6L9.4 7l4.6 5-4.6 5 1.2 1 5.4-6z';
export const CHEVRON_LEFT = 'M14.6 7l-1.2-1L8 12l5.4 6 1.2-1-4.6-5z';
export const CLOSE =
	'M13 11.8l6.1-6.3-1-1-6.1 6.2-6.1-6.2-1 1 6.1 6.3-6.5 6.7 1 1 6.5-6.6 6.5 6.6 1-1z';
export const PLUS = 'M11 12.5V17.5H12.5V12.5H17.5V11H12.5V6H11V11H6V12.5H11Z';
const CAUTION =
	'M5.5 12a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0ZM12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm-.75 12v-1.5h1.5V16h-1.5Zm0-8v5h1.5V8h-1.5Z';
export const CHECK = 'M16.7 7.1l-6.3 8.5-3.3-2.5-.9 1.2 4.5 3.4L17.9 7.9z';
export const LOCK =
	'M17 10h-1.2V7c0-2.1-1.7-3.8-3.8-3.8-2.1 0-3.8 1.7-3.8 3.8v3H7c-.6 0-1 .4-1 1v8c0 .6.4 1 1 1h10c.6 0 1-.4 1-1v-8c0-.6-.4-1-1-1zm-2.8 0H9.8V7c0-1.2 1-2.2 2.2-2.2s2.2 1 2.2 2.2v3z';

const familyOf = (value: string) => value.replace(/\..*$/, '');
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
export const fontStack = (value: string) =>
	value ? `${familyOf(value)}, ${MONO}` : MONO;
export const fontLabel = (meta: Meta, value: string) =>
	value === ''
		? __('System default', 'code-block-pro')
		: (meta.fonts.find((f) => f.value === familyOf(value))?.label ?? value);

export const loadFont = (meta: Meta, value: string) => {
	const font = meta.fonts.find((f) => f.value === familyOf(value));
	const id = `code-block-pro-manager-font-${font?.value}`;
	if (!font || document.getElementById(id)) return;
	const link = document.createElement('link');
	link.id = id;
	link.rel = 'stylesheet';
	link.href = font.href;
	document.head.append(link);
};

export const Preview = ({
	html,
	background,
	font,
}: {
	html: string;
	background: string;
	font?: string;
}) => (
	<span
		className="cbp-manager-sample"
		style={{ background, '--cbp-manager-font': font } as React.CSSProperties}
		aria-hidden="true"
	>
		<span
			className="cbp-manager-sample-inner"
			dangerouslySetInnerHTML={{ __html: html }}
		/>
	</span>
);

type SectionProps = {
	title: string;
	description?: string;
	hideTitle?: boolean;
	children?: React.ReactNode;
};

// hideTitle where the selected tab already names the section.
export const Section = ({
	title,
	description,
	hideTitle = false,
	children,
}: SectionProps) => (
	<fieldset className="preferences-modal__section">
		{hideTitle ? (
			<VisuallyHidden as="legend">{title}</VisuallyHidden>
		) : (
			<legend className="preferences-modal__section-legend">
				<h2 className="preferences-modal__section-title">{title}</h2>
				{description && (
					<p className="preferences-modal__section-description">
						{description}
					</p>
				)}
			</legend>
		)}
		<div className="preferences-modal__section-content">{children}</div>
	</fieldset>
);

type TabsProps<T extends string> = {
	label: string;
	items: { name: T; title: string }[];
	active: T;
	onSelect: (name: T) => void;
	children: React.ReactNode;
};

export const Tabs = <T extends string>({
	label,
	items,
	active,
	onSelect,
	children,
}: TabsProps<T>) => {
	const id = useId();
	const onKeyDown = (event: React.KeyboardEvent) => {
		const step =
			event.key === 'ArrowDown' ? 1 : event.key === 'ArrowUp' ? -1 : 0;
		if (!step) return;
		event.preventDefault();
		const i = items.findIndex((t) => t.name === active);
		const next = items[(i + step + items.length) % items.length];
		onSelect(next.name);
		document.getElementById(`${id}-${next.name}`)?.focus();
	};
	return (
		<div className="preferences__tabs">
			<div
				className="preferences__tabs-tablist cbp-manager-tablist"
				role="tablist"
				aria-orientation="vertical"
				aria-label={label}
			>
				{items.map((t) => (
					<button
						key={t.name}
						id={`${id}-${t.name}`}
						type="button"
						role="tab"
						aria-selected={t.name === active}
						aria-controls={`${id}-panel`}
						tabIndex={t.name === active ? 0 : -1}
						className="preferences__tabs-tab cbp-manager-tab"
						onClick={() => onSelect(t.name)}
						onKeyDown={onKeyDown}
					>
						<span className="cbp-manager-tab-label">{t.title}</span>
						<Svg d={CHEVRON_RIGHT} />
					</button>
				))}
			</div>
			<div
				id={`${id}-panel`}
				role="tabpanel"
				aria-labelledby={`${id}-${active}`}
				className="preferences__tabs-tabpanel cbp-manager-tabpanel"
			>
				{children}
			</div>
		</div>
	);
};

export const ProfileImpact = ({
	title,
	onStats,
}: {
	title: string;
	onStats: () => void;
}) => (
	<div>
		<h2 className="cbp-manager-impact-title">{title}</h2>
		<p className="cbp-manager-impact">
			<Svg d={CAUTION} size={20} />
			<span>
				{__(
					'Changes here will apply to every block that uses this profile.',
					'code-block-pro',
				)}{' '}
				<Button variant="link" onClick={onStats}>
					{__('View stats', 'code-block-pro')}
				</Button>
			</span>
		</p>
	</div>
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
export const CommitText = ({
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
