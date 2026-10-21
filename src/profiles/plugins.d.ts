// Not a dependency: the build maps it to WordPress's own wp.plugins.
declare module '@wordpress/plugins' {
	export const registerPlugin: (
		name: string,
		settings: { render: () => JSX.Element | null },
	) => void;
}
