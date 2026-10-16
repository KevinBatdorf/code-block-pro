import { useBlockProps as blockProps, RichText } from '@wordpress/block-editor';
import { applyFilters } from '@wordpress/hooks';
import classNames from 'classnames';
import { ButtonList } from './components/ButtonList';
import { FooterType } from './components/FooterType';
import { HeaderType } from './components/HeaderType';
import { SeeMoreType } from './components/SeeMoreType';
import defaultThemes from './defaultThemes.json';
import type { Attributes, ThemeOption } from './types';
import { findLineNumberColor } from './util/colors';
import { fontFamilyLong, maybeClamp } from './util/fonts';

export const BlockOutput = ({ attributes }: { attributes: Attributes }) => {
	const {
		clampFonts,
		code,
		codeHTML,
		disablePadding,
		enableBlurring,
		enableHighlighting,
		footerType,
		fontSize,
		fontFamily,
		highestLineNumber,
		highlightingHover,
		lineHeight,
		lineHighlightColor,
		lineNumbers,
		lineNumbersWidth,
		removeBlurOnHover,
		startingLineNumber,
		tabSize,
		theme,
		useTabs,
	} = attributes;

	const fontFamilyRatio = (fontFamily: string) =>
		fontFamily === 'Code-Pro-Fantasque-Sans-Mono' ? 0.5 : 0.6;

	// To add custom styles
	const themes = applyFilters(
		'blocks.codeBlockPro.themes',
		defaultThemes,
	) as ThemeOption;
	const styles = themes[theme]?.styles;
	return (
		<div
			{...blockProps.save({
				className: classNames({
					'padding-disabled': disablePadding,
					'padding-bottom-disabled': footerType && footerType !== 'none',
					'cbp-has-line-numbers': lineNumbers,
					'cbp-blur-enabled': enableBlurring,
					'cbp-unblur-on-hover': removeBlurOnHover,
					'cbp-highlight-hover': highlightingHover,
				}),
			})}
			data-code-block-pro-font-family={fontFamily}
			style={
				{
					fontSize: maybeClamp(fontSize, clampFonts),
					// Tiny check to avoid block invalidation error
					fontFamily: fontFamilyLong(fontFamily),
					'--cbp-line-number-color': lineNumbers
						? findLineNumberColor(attributes)
						: undefined,
					'--cbp-line-number-start':
						Number(startingLineNumber) > 1 ? startingLineNumber : undefined,
					'--cbp-line-number-width': highestLineNumber
						? `calc(${
								String(highestLineNumber).length
							} * ${fontFamilyRatio(fontFamily)} * ${fontSize})`
						: lineNumbersWidth
							? `${lineNumbersWidth}px`
							: undefined,
					'--cbp-line-highlight-color':
						enableHighlighting || highlightingHover
							? lineHighlightColor
							: undefined,
					lineHeight: maybeClamp(lineHeight, clampFonts),
					'--cbp-tab-width':
						useTabs === undefined
							? undefined // bw compatibility
							: String(tabSize),
					tabSize:
						useTabs === undefined
							? undefined // bw compatibility
							: 'var(--cbp-tab-width, 2)',
					...Object.entries(styles ?? {}).reduce(
						(acc, [key, value]) => ({
							...acc,
							[`--shiki-${key}`]: value,
						}),
						{},
					),
					...(applyFilters(
						'blocks.codeBlockPro.additionalOutputAttributes',
						{},
						attributes,
					) as object),
				} as React.CSSProperties
			}
		>
			{code?.length > 0 ? (
				<>
					<HeaderType {...attributes} />
					<ButtonList {...attributes} />
					<RichText.Content value={codeHTML} />
					<FooterType {...attributes} />
					<SeeMoreType {...attributes} />
				</>
			) : null}
		</div>
	);
};
