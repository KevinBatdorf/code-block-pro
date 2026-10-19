import {
	store as blockEditorStore,
	InspectorControls,
	useBlockProps,
} from '@wordpress/block-editor';
import type { BlockEditProps } from '@wordpress/blocks';
import { ExternalLink, Notice } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { safeHTML } from '@wordpress/dom';
import { RawHTML, useCallback, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { CodeEditor } from './editor/code-editor';
import { loadStyles } from './editor/preview';
import type { Attributes } from './types';

export const Edit = (props: BlockEditProps<Attributes>) => {
	const { attributes, setAttributes } = props;
	const { version, legacyContent } = attributes;
	// Missing from the store's published types.
	const { __unstableMarkNextChangeAsNotPersistent: skipUndo } = useDispatch(
		blockEditorStore,
	) as unknown as { __unstableMarkNextChangeAsNotPersistent: () => void };
	// The raw source gives every parsed block a string, so undefined means created here.
	const isNew = version === undefined && legacyContent === undefined;

	useEffect(() => {
		if (!isNew) return;
		skipUndo();
		setAttributes({ version: 2 });
	}, [isNew, skipUndo, setAttributes]);

	if (version === undefined && !isNew) {
		return (
			<Legacy
				html={legacyContent ?? ''}
				fontFamily={attributes.fontFamily ?? ''}
			/>
		);
	}
	return <CodeEditor {...props} />;
};

const Legacy = ({ html, fontFamily }: { html: string; fontFamily: string }) => {
	// 1.x loaded its fonts from a front-end script, which never runs in the editor.
	const font = fontFamily.replace(/\..*$/, '');
	const loadFont = useCallback(
		(el: HTMLElement | null) => {
			const url = window.codeBlockPro?.pluginUrl;
			if (!el || !url || !/^Code-Pro-[A-Za-z-]+$/.test(font)) return;
			loadStyles(el.ownerDocument, [
				{
					handle: `code-block-pro-font-${font}`,
					href: `${url}build/fonts/${font}.css`,
				},
			]);
		},
		[font],
	);
	return (
		<div {...useBlockProps({ ref: loadFont })}>
			{window.codeBlockPro?.canUpgrade === false && (
				<InspectorControls>
					<div style={{ padding: 16 }}>
						<Notice status="warning" isDismissible={false}>
							<p>
								{__(
									'This block can’t be edited on this server, because PHP was built without mbregex, a part of the mbstring extension. It still shows on your pages as it was saved. Ask your web host to enable mbregex, or install Code Block Pro 1.x to edit it.',
									'code-block-pro',
								)}
							</p>
							<ExternalLink href="https://wordpress.org/plugins/code-block-pro/advanced/">
								{__('Download Code Block Pro 1.x', 'code-block-pro')}
							</ExternalLink>
						</Notice>
					</div>
				</InspectorControls>
			)}
			{/* Pasted block markup arrives unfiltered, so its scripts would run in the editor. */}
			<RawHTML>{safeHTML(html)}</RawHTML>
		</div>
	);
};
