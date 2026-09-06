/**
 * How each of the 50 stored blocks in ./blocks was originally produced.
 *
 * The markup in ./blocks is the artifact, not this file. Regenerating it needs
 * the 1.x save path still in the tree, so once that changes these definitions
 * are history. See ./README.md.
 */

export type FixtureBlock = {
	/** Names a file in ./code unless `literal` is set. */
	code: string;
	literal?: boolean;
	/** The sample file's trailing newline is stripped unless this is set. */
	trailingNewline?: boolean;
	crlf?: boolean;
	attributes: Record<string, unknown>;
	/** Set after highlighting, so the stored HTML predates them — a language dropped upstream. */
	after?: Record<string, unknown>;
	/** Deleted after highlighting. Reproduces a save that predates an attribute. */
	unset?: string[];
	/** Dropped at serialize time, for keys the editor refills on sight. */
	strip?: string[];
	/** Registers a custom theme through the themes filter before inserting. */
	themeFilter?: 'cssVars';
};

export type Fixture = {
	slug: string;
	purpose: string;
	blocks: FixtureBlock[];
};

/** No chrome, so a fixture about something else is not also a header test. */
const plain = { headerType: 'none', copyButton: false };

export const fixtures: Fixture[] = [
	// ---------------------------------------------------------------- shapes
	{
		slug: '01-bare',
		purpose:
			'The minimum a stored block can be: no chrome, no typography, no line features. Every attribute a later version added is absent.',
		blocks: [
			{
				code: 'hello.js',
				attributes: { language: 'javascript', theme: 'nord', ...plain },
				unset: [
					'headerType',
					'footerType',
					'copyButton',
					'copyButtonType',
					'copyButtonString',
					'copyButtonStringCopied',
					'copyButtonUseTextarea',
					'fontSize',
					'fontFamily',
					'lineHeight',
					'clampFonts',
					'disablePadding',
					'lineNumbers',
					'highlightingHover',
					'tabSize',
					'useTabs',
					'seeMoreType',
					'seeMoreString',
					'seeMoreTransition',
					'seeMoreCollapse',
					'seeMoreCollapseString',
				],
			},
		],
	},
	{
		slug: '02-empty-code',
		purpose:
			'Empty code with every piece of chrome enabled. Save renders the wrapper and nothing inside it — the guard the renderer has to keep.',
		blocks: [
			{
				code: '',
				literal: true,
				attributes: {
					language: 'javascript',
					theme: 'dracula',
					headerType: 'headlights',
					footerType: 'simpleStringEnd',
					footerString: 'A footer on an empty block',
					copyButton: true,
					copyButtonType: 'heroicons',
					lineNumbers: true,
				},
			},
		],
	},
	{
		slug: '03-trailing-newline',
		purpose:
			'Twelve lines plus a trailing newline. The stored render has 13 span.line, the last holding only the newline. Every line-index feature counts off this.',
		blocks: [
			{
				code: 'twelve.ts',
				trailingNewline: true,
				attributes: {
					language: 'typescript',
					theme: 'dark-plus',
					lineNumbers: true,
					...plain,
				},
			},
		],
	},
	{
		slug: '04-no-trailing-newline',
		purpose:
			'The same twelve lines without the trailing newline — 12 span.line. Diff against 03 to see whether a renderer invented or swallowed a line.',
		blocks: [
			{
				code: 'twelve.ts',
				attributes: {
					language: 'typescript',
					theme: 'dark-plus',
					lineNumbers: true,
					...plain,
				},
			},
		],
	},
	{
		slug: '05-whitespace-lines',
		purpose:
			'A blank line, a line of only spaces, a line of only a tab, and one 400-character line. Empty span.line elements have to survive, and the long one has to scroll rather than wrap.',
		blocks: [
			{
				code: 'whitespace.go',
				attributes: {
					language: 'go',
					theme: 'github-dark',
					lineNumbers: true,
					...plain,
				},
			},
		],
	},
	{
		slug: '06-long-file',
		purpose:
			'300 lines with line numbers and a copy button. Pins the three-digit gutter, and is the fixture to time a render against.',
		blocks: [
			{
				code: 'long.php',
				attributes: {
					language: 'php',
					theme: 'one-dark-pro',
					lineNumbers: true,
					copyButton: true,
					copyButtonType: 'heroicons',
					headerType: 'none',
				},
			},
		],
	},
	{
		slug: '07-crlf',
		purpose:
			'CRLF line endings throughout. A carriage return must never reach the page as a glyph or an extra line.',
		blocks: [
			{
				code: 'crlf.bat',
				crlf: true,
				attributes: { language: 'bat', theme: 'monokai', ...plain },
			},
		],
	},

	// ------------------------------------------------- grammar, one per feature
	{
		slug: '08-php-shortcodes',
		purpose:
			'PHP with real shortcodes in the source and escaping left on. Both the visible code and the copy payload have to keep the brackets inert.',
		blocks: [
			{
				code: 'shortcodes.php',
				attributes: {
					language: 'php',
					theme: 'dark-plus',
					useEscapeShortCodes: true,
					copyButton: true,
					copyButtonType: 'heroicons',
					headerType: 'simpleString',
					headerString: 'shortcodes.php',
				},
			},
		],
	},
	{
		slug: '09-tsx-highlight-range',
		purpose:
			'TSX (JSX, a template literal, a regex literal) with a nested highlight range and a custom highlight colour.',
		blocks: [
			{
				code: 'component.tsx',
				attributes: {
					language: 'tsx',
					theme: 'one-dark-pro',
					enableHighlighting: true,
					lineHighlights: '1,[3,5]',
					lineHighlightColor: 'rgba(255, 121, 198, 0.25)',
					lineNumbers: true,
					...plain,
				},
			},
		],
	},
	{
		slug: '10-python-highlight-list',
		purpose:
			'Python (decorators, an f-string, a docstring) with a flat highlight list. The other half of the highlight parser.',
		blocks: [
			{
				code: 'decorators.py',
				attributes: {
					language: 'python',
					theme: 'github-light',
					enableHighlighting: true,
					lineHighlights: '1,5',
					...plain,
				},
			},
		],
	},
	{
		slug: '11-bash-glob',
		purpose:
			'A bash loop variable and a *.txt glob on nord — the one case already measured as mis-scoped by phiki. This fixture is that fix acceptance test.',
		blocks: [
			{
				code: 'glob.sh',
				attributes: { language: 'bash', theme: 'nord', ...plain },
			},
		],
	},
	{
		slug: '12-diff-hover',
		purpose:
			'A diff with + and - lines and hover highlighting only. Pins the hover colour variable with no static highlights present.',
		blocks: [
			{
				code: 'patch.diff',
				attributes: {
					language: 'diff',
					theme: 'monokai',
					highlightingHover: true,
					...plain,
				},
			},
		],
	},
	{
		slug: '13-html-hazards',
		purpose:
			'HTML holding a closing pre tag, a script, a style, and entities. Escaping has to hold in the visible pre and in the copy pre both.',
		blocks: [
			{
				code: 'hazards.html',
				attributes: {
					language: 'html',
					theme: 'github-dark-dimmed',
					copyButton: true,
					copyButtonType: 'twoSquares',
					headerType: 'none',
				},
			},
		],
	},
	{
		slug: '14-yaml-deep-indent',
		purpose:
			'YAML with block scalars and anchors. Indentation is the meaning here, so a lost space is a broken render.',
		blocks: [
			{
				code: 'config.yml',
				attributes: { language: 'yaml', theme: 'solarized-light', ...plain },
			},
		],
	},
	{
		slug: '15-markdown-see-more',
		purpose:
			'Markdown containing its own fenced block, cut off after line 5 by see-more. The most common max-height shape on the most nested grammar.',
		blocks: [
			{
				code: 'nested-fence.md',
				attributes: {
					language: 'markdown',
					theme: 'vitesse-light',
					enableMaxHeight: true,
					seeMoreAfterLine: '5',
					seeMoreType: 'roundCenter',
					seeMoreString: 'Read the rest',
					...plain,
				},
			},
		],
	},
	{
		slug: '16-ansi',
		purpose:
			'ANSI control sequences through the ansi renderer, which is a different code path from every other language.',
		blocks: [
			{
				code: [
					'\u001b[32m✓\u001b[0m 12 passed \u001b[2m(1.4s)\u001b[0m',
					'\u001b[31m✗\u001b[0m 1 failed',
					'  \u001b[1;31mAssertionError\u001b[0m: expected \u001b[33m12\u001b[0m to be \u001b[33m13\u001b[0m',
					'\u001b[2m  at tests/lines.spec.ts:42:11\u001b[0m',
					'',
					'\u001b[44;97m INFO \u001b[0m re-run with \u001b[36m--reporter=verbose\u001b[0m',
				].join('\n'),
				literal: true,
				attributes: { language: 'ansi', theme: 'material-darker', ...plain },
			},
		],
	},
	{
		slug: '17-unknown-language',
		purpose:
			'A stored language slug the renderer will not recognise, with valid stored HTML from when it did. A language renamed or dropped upstream.',
		blocks: [
			{
				code: 'query.sql',
				attributes: { language: 'sql', theme: 'min-dark', ...plain },
				after: { language: 'sql-in-a-past-life' },
			},
		],
	},
	{
		slug: '18-no-language',
		purpose:
			'No language attribute at all. The renderer has to reach plain text without throwing.',
		blocks: [
			{
				code: 'hello.js',
				attributes: { language: 'javascript', theme: 'poimandres', ...plain },
				strip: ['language'],
			},
		],
	},

	// ------------------------------------------------------------ theme, colour
	{
		slug: '19-min-light-prose',
		purpose:
			'Mostly plain text on min-light, which colours plain text explicitly. A renderer that leaves plain text to the wrapper differs on every glyph here.',
		blocks: [
			{
				code: 'prose.txt',
				attributes: { language: 'plaintext', theme: 'min-light', ...plain },
			},
		],
	},
	{
		slug: '20-custom-colors-headlights',
		purpose:
			'Background and text colours overridden away from the theme, with a header that reads them. Chrome takes bgColor, not the theme.',
		blocks: [
			{
				code: 'lifetimes.rs',
				attributes: {
					language: 'rust',
					theme: 'github-dark',
					bgColor: '#11021f',
					textColor: '#ffe9fb',
					headerType: 'headlights',
					copyButton: false,
				},
			},
		],
	},
	{
		slug: '21-css-var-theme',
		purpose:
			'The pack CSS-variables theme: tokens resolve to var() at render, bgColor is a var(), and the header type that cannot support that is selected anyway.',
		blocks: [
			{
				code: 'component.tsx',
				themeFilter: 'cssVars',
				attributes: {
					language: 'tsx',
					theme: 'inherit-from-global',
					headerType: 'headlightsMutedAlt',
					copyButton: false,
					lineNumbers: true,
				},
			},
		],
	},
	{
		slug: '22-third-party-theme',
		purpose:
			'A theme slug that only exists in the add-on pack, with stored HTML from a theme that does ship. Nothing may be generated for it and nothing may crash.',
		blocks: [
			{
				code: 'spaces.rb',
				attributes: { language: 'ruby', theme: 'material-ocean', ...plain },
				after: { theme: 'aurora-x' },
			},
		],
	},
	{
		slug: '23-theme-pair',
		purpose:
			'Two blocks, two themes, one page. Any scheme that names colours globally instead of per block collides here.',
		blocks: [
			{
				code: 'twelve.ts',
				attributes: { language: 'typescript', theme: 'dracula', ...plain },
			},
			{
				code: 'twelve.ts',
				attributes: { language: 'typescript', theme: 'min-light', ...plain },
			},
		],
	},

	// ---------------------------------------------------------------- chrome
	{
		slug: '24-header-muted',
		purpose: 'Muted headlights carrying a filename string.',
		blocks: [
			{
				code: 'lifetimes.rs',
				attributes: {
					language: 'rust',
					theme: 'vitesse-dark',
					headerType: 'headlightsMuted',
					headerString: 'src/registry.rs',
					copyButton: false,
				},
			},
		],
	},
	{
		slug: '25-header-simple-entities',
		purpose:
			'A header string with an ampersand, an angle bracket, and an emoji. Stored escaped, and it must not double-escape on the way out.',
		blocks: [
			{
				code: 'hello.js',
				attributes: {
					language: 'javascript',
					theme: 'slack-dark',
					headerType: 'simpleString',
					headerString: 'Tom & Jerry <script> \u{1F3A9}',
					copyButton: false,
				},
			},
		],
	},
	{
		slug: '26-header-small-empty',
		purpose:
			'A muted string header with no string set, so the placeholder falls back to the language name.',
		blocks: [
			{
				code: 'config.yml',
				attributes: {
					language: 'yaml',
					theme: 'material-palenight',
					headerType: 'stringSmall',
					headerString: '',
					copyButton: false,
				},
			},
		],
	},
	{
		slug: '27-header-pill-overflow',
		purpose:
			'A pill header holding far more text than fits. Pins whatever overflow does today.',
		blocks: [
			{
				code: 'hello.js',
				attributes: {
					language: 'javascript',
					theme: 'rose-pine',
					headerType: 'pillString',
					headerString:
						'a header string long enough to run past the end of the block and keep going, because somebody out there did exactly this',
					copyButton: false,
				},
			},
		],
	},
	{
		slug: '28-footer-end-link',
		purpose:
			'Footer at the end with a link that opens in a new tab. The only fixture carrying an anchor and a target.',
		blocks: [
			{
				code: 'query.sql',
				attributes: {
					language: 'sql',
					theme: 'solarized-dark',
					headerType: 'none',
					footerType: 'simpleStringEnd',
					footerString: 'Full query on GitHub',
					footerLink: 'https://example.com/query',
					footerLinkTarget: true,
					copyButton: false,
				},
			},
		],
	},
	{
		slug: '29-footer-start-nolink',
		purpose: 'Footer at the start with no link. The unlinked footer branch.',
		blocks: [
			{
				code: 'spaces.rb',
				attributes: {
					language: 'ruby',
					theme: 'rose-pine-moon',
					headerType: 'none',
					footerType: 'simpleStringStart',
					footerString: 'cache/store.rb',
					footerLink: '',
					copyButton: false,
				},
			},
		],
	},
	{
		slug: '30-header-footer-nopadding',
		purpose:
			'Header, footer and disabled padding together, the only way to get both padding classes on the wrapper at once.',
		blocks: [
			{
				code: 'twelve.ts',
				attributes: {
					language: 'typescript',
					theme: 'light-plus',
					headerType: 'headlights',
					footerType: 'simpleStringEnd',
					footerString: 'twelve.ts',
					disablePadding: true,
					copyButton: false,
				},
			},
		],
	},
	{
		slug: '31-nopadding-only',
		purpose:
			'Padding disabled with no chrome, so the code runs to the edge of the wrapper.',
		blocks: [
			{
				code: 'glob.sh',
				attributes: {
					language: 'bash',
					theme: 'github-dark',
					disablePadding: true,
					...plain,
				},
			},
		],
	},
	{
		slug: '32-align-wide',
		purpose: 'Wide alignment, which puts a core class on the wrapper.',
		blocks: [
			{
				code: 'twelve.ts',
				attributes: {
					language: 'typescript',
					theme: 'nord',
					align: 'wide',
					...plain,
				},
			},
		],
	},
	{
		slug: '33-align-full',
		purpose:
			'Full alignment with a header and a copy button, the widest thing the block can be.',
		blocks: [
			{
				code: 'component.tsx',
				attributes: {
					language: 'tsx',
					theme: 'dracula',
					align: 'full',
					headerType: 'headlights',
					copyButton: true,
					copyButtonType: 'heroicons',
				},
			},
		],
	},

	// -------------------------------------------------------------- copy button
	{
		slug: '34-copy-two-squares',
		purpose: 'The two-squares copy icon with a custom label.',
		blocks: [
			{
				code: 'hello.js',
				attributes: {
					language: 'javascript',
					theme: 'material-default',
					headerType: 'none',
					copyButton: true,
					copyButtonType: 'twoSquares',
					copyButtonString: 'Grab it',
				},
			},
		],
	},
	{
		slug: '35-copy-text-simple',
		purpose:
			'The text copy button, the only type that renders both its label and its copied label into the markup.',
		blocks: [
			{
				code: 'hello.js',
				attributes: {
					language: 'javascript',
					theme: 'min-dark',
					headerType: 'none',
					copyButton: true,
					copyButtonType: 'textSimple',
					copyButtonString: 'Copy this',
					copyButtonStringCopied: 'Got it!',
				},
			},
		],
	},
	{
		slug: '36-copy-textarea-encoded',
		purpose:
			'The copy payload in a textarea instead of a data attribute, with URI encoding on and shortcode escaping off. Every switch on the copy path at once.',
		blocks: [
			{
				code: 'shortcodes.php',
				attributes: {
					language: 'php',
					theme: 'github-dark',
					headerType: 'none',
					copyButton: true,
					copyButtonType: 'heroicons',
					copyButtonUseTextarea: true,
					useDecodeURI: true,
					useEscapeShortCodes: false,
				},
			},
		],
	},

	// ------------------------------------------------------------ line features
	{
		slug: '37-line-numbers',
		purpose: 'Line numbers on, nothing else. The plain numbered block.',
		blocks: [
			{
				code: 'spaces.rb',
				attributes: {
					language: 'ruby',
					theme: 'nord',
					lineNumbers: true,
					...plain,
				},
			},
		],
	},
	{
		slug: '38-numbers-start-998',
		purpose:
			'Numbering from 998 over twelve lines, so the gutter crosses from three digits to four and the highlight offset is not zero.',
		blocks: [
			{
				code: 'twelve.ts',
				attributes: {
					language: 'typescript',
					theme: 'github-dark',
					lineNumbers: true,
					startingLineNumber: '998',
					enableHighlighting: true,
					lineHighlights: '1000',
					...plain,
				},
			},
		],
	},
	{
		slug: '39-blur',
		purpose:
			'Blur with two lines exempt, unblurring on hover, and a highlight underneath it. Blur and highlight have to coexist on one render.',
		blocks: [
			{
				code: 'decorators.py',
				attributes: {
					language: 'python',
					theme: 'material-ocean',
					enableBlurring: true,
					lineBlurs: '[2,4]',
					removeBlurOnHover: true,
					enableHighlighting: true,
					lineHighlights: '6',
					...plain,
				},
			},
		],
	},
	{
		slug: '40-index-past-eof',
		purpose:
			'Highlight, blur and see-more all pointing past the last line of a twelve-line block. Nothing may throw and no phantom line may appear.',
		blocks: [
			{
				code: 'twelve.ts',
				attributes: {
					language: 'typescript',
					theme: 'monokai',
					enableHighlighting: true,
					lineHighlights: '20',
					enableBlurring: true,
					lineBlurs: '19',
					enableMaxHeight: true,
					seeMoreAfterLine: '99',
					seeMoreType: 'blockLeft',
					...plain,
				},
			},
		],
	},

	// ------------------------------------------------------------- max height
	{
		slug: '41-see-more-left-transition',
		purpose: 'See-more on the left with the height transition on.',
		blocks: [
			{
				code: 'long.php',
				attributes: {
					language: 'php',
					theme: 'vitesse-dark',
					enableMaxHeight: true,
					seeMoreAfterLine: '12',
					seeMoreType: 'blockLeft',
					seeMoreString: 'Show all 300 lines',
					seeMoreTransition: true,
					...plain,
				},
			},
		],
	},
	{
		slug: '42-see-more-right-collapse',
		purpose:
			'See-more on the right that can be collapsed again, with both strings set. The only fixture with a collapse control.',
		blocks: [
			{
				code: 'config.yml',
				attributes: {
					language: 'yaml',
					theme: 'slack-ochin',
					enableMaxHeight: true,
					seeMoreAfterLine: '6',
					seeMoreType: 'blockRight',
					seeMoreString: 'More',
					seeMoreCollapse: true,
					seeMoreCollapseString: 'Less',
					...plain,
				},
			},
		],
	},
	{
		slug: '43-editor-height',
		purpose:
			'An editor height with no front-end max height. It must stay admin-only and leave the page alone.',
		blocks: [
			{
				code: 'long.php',
				attributes: {
					language: 'php',
					theme: 'dracula-soft',
					editorHeight: '200',
					enableMaxHeight: false,
					...plain,
				},
			},
		],
	},

	// --------------------------------------------------------- type, whitespace
	{
		slug: '44-font-tiny-tight',
		purpose: 'The smallest font size against the tightest line height.',
		blocks: [
			{
				code: 'twelve.ts',
				attributes: {
					language: 'typescript',
					theme: 'github-light',
					fontSize: '.75rem',
					lineHeight: '1rem',
					...plain,
				},
			},
		],
	},
	{
		slug: '45-font-big-clamped',
		purpose:
			'The largest font size with clamping on, the only way a clamp() lands in the style attribute.',
		blocks: [
			{
				code: 'twelve.ts',
				attributes: {
					language: 'typescript',
					theme: 'github-light',
					fontSize: '1.125rem',
					lineHeight: '1.625rem',
					clampFonts: true,
					...plain,
				},
			},
		],
	},
	{
		slug: '46-font-fantasque-numbers',
		purpose:
			'Fantasque with line numbers, the one font with its own gutter-width ratio.',
		blocks: [
			{
				code: 'decorators.py',
				attributes: {
					language: 'python',
					theme: 'nord',
					fontFamily: 'Code-Pro-Fantasque-Sans-Mono',
					lineNumbers: true,
					...plain,
				},
			},
		],
	},
	{
		slug: '47-tabs-real-4',
		purpose:
			'Real tab characters at width 4. The stored code holds tabs and the width comes from a custom property.',
		blocks: [
			{
				code: 'tabs.go',
				attributes: {
					language: 'go',
					theme: 'github-dark',
					useTabs: true,
					tabSize: 4,
					...plain,
				},
			},
		],
	},
	{
		slug: '48-tabs-legacy-undefined',
		purpose:
			'Tab attributes absent entirely, the shape every block saved before they existed has. No tab custom property, no tab-size.',
		blocks: [
			{
				code: 'tabs.go',
				attributes: {
					language: 'go',
					theme: 'github-dark',
					useTabs: true,
					tabSize: 4,
					...plain,
				},
				unset: ['useTabs', 'tabSize'],
			},
		],
	},

	// ---------------------------------------------------------------- legacy
	{
		slug: '49-legacy-no-modern-attrs',
		purpose:
			'An old numbered block: the legacy pixel gutter width instead of a computed one, and none of the attributes added since. Both bw-compat branches at once.',
		blocks: [
			{
				code: 'twelve.ts',
				attributes: {
					language: 'typescript',
					theme: 'monokai',
					lineNumbers: true,
					headerType: 'headlights',
					copyButton: true,
					copyButtonType: 'heroicons',
				},
				after: { lineNumbersWidth: 40 },
				unset: [
					'highestLineNumber',
					'useTabs',
					'tabSize',
					'useDecodeURI',
					'useEscapeShortCodes',
					'copyButtonUseTextarea',
					'copyButtonString',
					'copyButtonStringCopied',
					'clampFonts',
					'seeMoreType',
					'seeMoreString',
					'seeMoreTransition',
					'seeMoreCollapse',
					'seeMoreCollapseString',
					'enableMaxHeight',
					'seeMoreAfterLine',
					'editorHeight',
				],
			},
		],
	},
	{
		slug: '50-unicode-rtl',
		purpose:
			'Emoji, CJK, Arabic, combining marks, a zero-width space and a non-breaking space, numbered so the gutter is involved too.',
		blocks: [
			{
				code: 'unicode-rtl.js',
				attributes: {
					language: 'javascript',
					theme: 'dracula',
					lineNumbers: true,
					copyButton: true,
					copyButtonType: 'heroicons',
					headerType: 'none',
				},
			},
		],
	},
];
