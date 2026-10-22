import { Button } from '@wordpress/components';
import {
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import type { Meta, Profile, Sample } from './api';
import { CHECK, Svg } from './ui';

const ESCAPES: Record<string, string> = {
	'&': '&amp;',
	'<': '&lt;',
	'>': '&gt;',
};

// Escaped as the editor saves code, which the renderer decodes.
export const attributesFor = (sample: Sample, { fold = false } = {}) => {
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

export const sampleOf = (profile: Profile, meta: Meta) =>
	profile.sample ?? meta.sample;

export const BlockThumb = ({
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

export const Option = ({ children }: { children: React.ReactNode }) => (
	<div className="preferences-modal__option">{children}</div>
);

export const Selected = ({
	label,
	value,
	returnKey,
	onSelect,
}: {
	label: string;
	value: string;
	returnKey: string;
	onSelect: () => void;
}) => (
	<div className="cbp-manager-selected">
		<div className="cbp-manager-selected-text">
			<span className="cbp-manager-selected-label">{label}</span>
			<span className="cbp-manager-selected-value">{value}</span>
		</div>
		<Button
			variant="secondary"
			__next40pxDefaultSize
			data-return={returnKey}
			onClick={onSelect}
		>
			{__('Select', 'code-block-pro')}
		</Button>
	</div>
);

type GridOption = { value: string; label: string; thumb: React.ReactNode };

export const PickGrid = ({
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
					<span className="cbp-manager-box">{option.thumb}</span>
					{option.value === value && <Check />}
					<span className="cbp-manager-label">{option.label}</span>
				</button>
			))}
		</div>
	);
};

export const Check = () => (
	<span className="cbp-manager-check">
		<Svg d={CHECK} size={16} />
	</span>
);
