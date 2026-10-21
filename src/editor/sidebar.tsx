import { PanelBody, TextControl, ToggleControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import type { Attributes, Pane } from '../types';

const LIST_HELP = __('Line numbers as shown, like 1, 4-6.', 'code-block-pro');

type LineProps = {
	pane: Pane;
	attributes: Attributes;
	onPane: (changes: Pane) => void;
	onBlock: (changes: Attributes) => void;
};

const LISTS = [
	['highlightLines', __('Highlight lines', 'code-block-pro')],
	['focusLines', __('Focus lines', 'code-block-pro')],
	['sharpLines', __('Keep lines sharp', 'code-block-pro')],
	['addedLines', __('Added lines', 'code-block-pro')],
	['removedLines', __('Removed lines', 'code-block-pro')],
] as const;

const HELP: Partial<Record<(typeof LISTS)[number][0], string>> = {
	focusLines: __('Dims all other lines.', 'code-block-pro'),
	sharpLines: __('Blurs all other lines.', 'code-block-pro'),
};

export const LineSettings = ({
	pane,
	attributes,
	onPane,
	onBlock,
}: LineProps) => (
	<PanelBody title={__('Lines', 'code-block-pro')} initialOpen={false}>
		<TextControl
			__next40pxDefaultSize
			label={__('First line number', 'code-block-pro')}
			type="number"
			min={0}
			value={String(pane.startLine ?? '')}
			onChange={(startLine) => onPane({ startLine })}
		/>
		{LISTS.map(([key, label]) => (
			<TextControl
				key={key}
				__next40pxDefaultSize
				label={label}
				help={HELP[key] ? `${HELP[key]} ${LIST_HELP}` : LIST_HELP}
				value={pane[key] ?? ''}
				onChange={(value) => onPane({ [key]: value })}
			/>
		))}
		<ToggleControl
			label={__('Unblur on hover', 'code-block-pro')}
			checked={!!attributes.removeBlurOnHover}
			onChange={(removeBlurOnHover) => onBlock({ removeBlurOnHover })}
		/>
		<ToggleControl
			label={__('Link to each line', 'code-block-pro')}
			help={__(
				'Gives every line an address, like #L12, to link to.',
				'code-block-pro',
			)}
			checked={!!attributes.lineAnchors}
			onChange={(lineAnchors) => onBlock({ lineAnchors })}
		/>
		<TextControl
			__next40pxDefaultSize
			label={__('Lines shown when folded', 'code-block-pro')}
			help={__(
				'The rest scrolls, or opens with the profile’s expand button if it has one.',
				'code-block-pro',
			)}
			type="number"
			min={0}
			value={String(pane.seeMoreAfter ?? '')}
			onChange={(seeMoreAfter) => onPane({ seeMoreAfter })}
		/>
		<p className="components-base-control__help">
			{
				/* translators: The [!code …] markers are typed into code as written; keep them untranslated. */
				__(
					'You can also mark lines in the code with a comment: [!code highlight], [!code focus], [!code ++] or [!code --]. Add :3 to mark three lines, as in [!code highlight:3].',
					'code-block-pro',
				)
			}
		</p>
	</PanelBody>
);

type OverrideProps = {
	attributes: Attributes;
	// The profile's own setting, or null while the profiles load.
	lineNumbers: boolean | null;
	onBlock: (changes: Attributes) => void;
};

export const Overrides = ({
	attributes,
	lineNumbers,
	onBlock,
}: OverrideProps) => {
	const override = attributes.overrides?.lineNumbers;
	// Matching the profile again drops the override, so a later profile edit reaches this block.
	const setLineNumbers = (next: boolean) => {
		const { lineNumbers: _old, ...rest } = attributes.overrides ?? {};
		const overrides =
			next === lineNumbers ? rest : { ...rest, lineNumbers: next };
		onBlock({
			overrides: Object.keys(overrides).length ? overrides : undefined,
		});
	};
	let help: string = __('Set for this block only.', 'code-block-pro');
	if (override === undefined) {
		help = lineNumbers
			? __('On, as the profile sets.', 'code-block-pro')
			: __('Off, as the profile sets.', 'code-block-pro');
	}

	return (
		<PanelBody title={__('Overrides', 'code-block-pro')}>
			<ToggleControl
				label={__('Line numbers', 'code-block-pro')}
				help={lineNumbers === null ? undefined : help}
				disabled={lineNumbers === null}
				checked={override ?? lineNumbers ?? false}
				onChange={setLineNumbers}
			/>
		</PanelBody>
	);
};

type BlockProps = {
	attributes: Attributes;
	onBlock: (changes: Attributes) => void;
};

export const BlockSettings = ({ attributes, onBlock }: BlockProps) => (
	<PanelBody
		title={__('Header and footer', 'code-block-pro')}
		initialOpen={false}
	>
		<TextControl
			__next40pxDefaultSize
			label={__('Header title', 'code-block-pro')}
			help={__(
				'Shown when the profile’s header has a title.',
				'code-block-pro',
			)}
			value={attributes.headerString ?? ''}
			onChange={(headerString) => onBlock({ headerString })}
		/>
		<TextControl
			__next40pxDefaultSize
			label={__('Footer text', 'code-block-pro')}
			help={__('Shown when the profile has a footer.', 'code-block-pro')}
			value={attributes.footerString ?? ''}
			onChange={(footerString) => onBlock({ footerString })}
		/>
		<TextControl
			__next40pxDefaultSize
			label={__('Footer link', 'code-block-pro')}
			type="url"
			value={attributes.footerLink ?? ''}
			onChange={(footerLink) => onBlock({ footerLink })}
		/>
		<ToggleControl
			label={__('Open the footer link in a new tab', 'code-block-pro')}
			checked={!!attributes.footerLinkTarget}
			onChange={(footerLinkTarget) => onBlock({ footerLinkTarget })}
		/>
	</PanelBody>
);
