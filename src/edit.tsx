import {
	PlainText,
	store as blockEditorStore,
	useBlockProps,
} from '@wordpress/block-editor';
import type { BlockEditProps } from '@wordpress/blocks';
import { useDispatch } from '@wordpress/data';
import { safeHTML } from '@wordpress/dom';
import { RawHTML, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import type { Attributes } from './types';

// kses rewrites raw <, > and & in block attributes for users without unfiltered_html.
const ESCAPES: Record<string, string> = {
	'&': '&amp;',
	'<': '&lt;',
	'>': '&gt;',
};
const UNESCAPES: Record<string, string> = { amp: '&', lt: '<', gt: '>' };
const encode = (code: string) => code.replace(/[&<>]/g, (c) => ESCAPES[c]);
const decode = (code: string) =>
	code.replace(/&(amp|lt|gt);/g, (_, name: string) => UNESCAPES[name]);

export const Edit = ({
	attributes,
	setAttributes,
}: BlockEditProps<Attributes>) => {
	const { version, panes = [], legacyContent } = attributes;
	// Missing from the store's published types.
	const { __unstableMarkNextChangeAsNotPersistent: skipUndo } = useDispatch(
		blockEditorStore,
	) as unknown as { __unstableMarkNextChangeAsNotPersistent: () => void };
	const blockProps = useBlockProps();
	// The raw source gives every parsed block a string, so undefined means created here.
	const isNew = version === undefined && legacyContent === undefined;

	useEffect(() => {
		if (!isNew) return;
		skipUndo();
		setAttributes({ version: 2 });
	}, [isNew, skipUndo, setAttributes]);

	if (version === undefined) {
		return (
			<div {...blockProps}>
				{/* Pasted block markup arrives unfiltered, so its scripts would run in the editor. */}
				<RawHTML>{safeHTML(legacyContent ?? '')}</RawHTML>
			</div>
		);
	}

	const [first = {}, ...rest] = panes;
	return (
		<div {...blockProps}>
			<PlainText
				aria-label={__('Code', 'code-block-pro')}
				value={decode(first.code ?? '')}
				onChange={(code: string) =>
					setAttributes({ panes: [{ ...first, code: encode(code) }, ...rest] })
				}
			/>
		</div>
	);
};
