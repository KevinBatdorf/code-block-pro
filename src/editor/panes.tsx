import {
	Button,
	__experimentalHStack as HStack,
	TextControl,
} from '@wordpress/components';
import { useLayoutEffect, useRef } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import languages from '../languages.json';
import type { Pane } from '../types';

type Props = {
	panes: Pane[];
	active: number;
	onSelect: (index: number) => void;
	onChange: (panes: Pane[], active: number) => void;
};

type Action = 'select' | 'up' | 'down';

const nameOf = (pane: Pane) =>
	pane.label?.trim() ||
	(languages as Record<string, string>)[pane.language ?? ''] ||
	__('Plain text', 'code-block-pro');

const move = (panes: Pane[], from: number, to: number) => {
	const next = [...panes];
	next.splice(to, 0, ...next.splice(from, 1));
	return next;
};

const selectedAfterMove = (active: number, from: number, to: number) => {
	if (active === from) return to;
	if (active === to) return from;
	return active;
};

export const Panes = ({ panes, active, onSelect, onChange }: Props) => {
	const all = panes.length ? panes : [{}];
	const tabbed = all.length > 1;
	const list = useRef<HTMLUListElement>(null);
	const add = useRef<HTMLButtonElement>(null);
	// Rows are keyed by position, so after a move or a removal focus would stay on the old slot.
	const refocus = useRef<{ row: number; action: Action } | null>(null);

	useLayoutEffect(() => {
		const target = refocus.current;
		if (!target) return;
		refocus.current = null;
		const row = list.current?.querySelectorAll('li')[target.row];
		const button = row?.querySelector<HTMLElement>(
			`[data-action="${target.action}"]`,
		);
		// A disabled button keeps focus but reads as unusable, so land on the tab itself.
		const usable =
			button?.getAttribute('aria-disabled') === 'true'
				? row?.querySelector<HTMLElement>('[data-action="select"]')
				: button;
		(usable ?? add.current)?.focus();
	});

	const change = (
		next: Pane[],
		selected: number,
		focus: typeof refocus.current,
	) => {
		refocus.current = focus;
		onChange(next, selected);
	};

	return (
		<>
			{tabbed && (
				<ul className="cbp-panes" ref={list}>
					{all.map((pane, i) => {
						/* translators: 1: a code tab's position, 2: its label or language. */
						const name = sprintf(
							__('tab %1$d (%2$s)', 'code-block-pro'),
							i + 1,
							nameOf(pane),
						);
						return (
							// Panes have no id; the position is the identity.
							// oxlint-disable-next-line react-doctor/no-array-index-as-key
							<li key={i}>
								<HStack spacing={0}>
									<Button
										__next40pxDefaultSize
										className="cbp-pane-select"
										data-action="select"
										isPressed={i === active}
										onClick={() => onSelect(i)}
									>
										{nameOf(pane)}
									</Button>
									<Button
										size="small"
										icon="arrow-up-alt2"
										data-action="up"
										label={sprintf(
											/* translators: %s: a code tab, like "tab 2 (PHP)". */
											__('Move %s up', 'code-block-pro'),
											name,
										)}
										accessibleWhenDisabled
										disabled={i === 0}
										onClick={() =>
											change(
												move(all, i, i - 1),
												selectedAfterMove(active, i, i - 1),
												{
													row: i - 1,
													action: 'up',
												},
											)
										}
									/>
									<Button
										size="small"
										icon="arrow-down-alt2"
										data-action="down"
										label={sprintf(
											/* translators: %s: a code tab, like "tab 2 (PHP)". */
											__('Move %s down', 'code-block-pro'),
											name,
										)}
										accessibleWhenDisabled
										disabled={i === all.length - 1}
										onClick={() =>
											change(
												move(all, i, i + 1),
												selectedAfterMove(active, i, i + 1),
												{
													row: i + 1,
													action: 'down',
												},
											)
										}
									/>
									<Button
										size="small"
										icon="no-alt"
										label={sprintf(
											/* translators: %s: a code tab, like "tab 2 (PHP)". */
											__('Remove %s', 'code-block-pro'),
											name,
										)}
										onClick={() => {
											const selected =
												active > i || active === all.length - 1
													? Math.max(active - 1, 0)
													: active;
											change(
												all.filter((_, at) => at !== i),
												selected,
												{ row: selected, action: 'select' },
											);
										}}
									/>
								</HStack>
							</li>
						);
					})}
				</ul>
			)}
			{tabbed && (
				<TextControl
					__next40pxDefaultSize
					label={__('Tab label', 'code-block-pro')}
					help={__('Leave empty to show the language.', 'code-block-pro')}
					value={all[active]?.label ?? ''}
					onChange={(text) =>
						onChange(
							all.map((pane, i) =>
								i === active ? { ...pane, label: text } : pane,
							),
							active,
						)
					}
				/>
			)}
			<Button
				ref={add}
				className="cbp-add-pane"
				variant="secondary"
				onClick={() =>
					onChange(
						[...all, { language: all[active]?.language ?? '', code: '' }],
						all.length,
					)
				}
			>
				{__('Add tab', 'code-block-pro')}
			</Button>
		</>
	);
};
