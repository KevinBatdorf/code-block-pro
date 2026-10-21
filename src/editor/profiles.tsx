import apiFetch from '@wordpress/api-fetch';
import {
	BlockControls,
	useBlockEditContext,
	useBlockEditingMode,
} from '@wordpress/block-editor';
import {
	Button,
	MenuGroup,
	MenuItem,
	MenuItemsChoice,
	ToolbarDropdownMenu,
	ToolbarGroup,
} from '@wordpress/components';
import { useEffect, useState } from '@wordpress/element';
import { doAction, hasAction } from '@wordpress/hooks';
import { decodeEntities } from '@wordpress/html-entities';
import { __, sprintf } from '@wordpress/i18n';

type Summary = {
	settings: Record<string, string | number | boolean>;
	themes: string[];
	buttons: string[];
};
type Profile = { slug: string; title: string; summary?: Summary };

// One request for every block on the page.
let request: Promise<Profile[]> | null = null;
const loadProfiles = () => {
	request ??= apiFetch<Profile[]>({
		path: '/code-block-pro/v1/profiles',
	}).catch((failure: unknown) => {
		request = null;
		throw failure;
	});
	return request;
};

type Props = { value: string; onChange: (profile: string) => void };

export const useProfiles = () => {
	const [profiles, setProfiles] = useState<Profile[] | null>(null);
	const [failed, setFailed] = useState(false);

	useEffect(() => {
		let live = true;
		loadProfiles()
			.then((list) => live && setProfiles(list))
			.catch(() => live && setFailed(true));
		return () => {
			live = false;
		};
	}, []);

	return { profiles, failed };
};

// Without a listener for this action, the menu leaves out Edit and Manage profiles.
const OPEN_PROFILES = 'codeBlockPro.openProfiles';

export const ProfileToolbar = ({ value, onChange }: Props) => {
	const { profiles } = useProfiles();
	const { clientId } = useBlockEditContext();
	// Inside a library pattern or template part, the profile stays as the pattern set it.
	const editable = useBlockEditingMode() === 'default';
	const current = profiles?.find(({ slug }) => slug === value);
	const name = current
		? decodeEntities(current.title)
		: value || __('This block’s own settings', 'code-block-pro');

	if (!editable) return null;
	return (
		<BlockControls group="block">
			<ToolbarGroup>
				<ToolbarDropdownMenu
					icon={null}
					text={name}
					label={__('Profile', 'code-block-pro')}
				>
					{({ onClose }) => (
						<>
							{hasAction(OPEN_PROFILES) && (
								<MenuGroup>
									<MenuItem
										onClick={() => {
											onClose();
											doAction(OPEN_PROFILES, {
												clientId,
												slug: value,
												view: 'edit',
											});
										}}
									>
										{__('Edit profile', 'code-block-pro')}
									</MenuItem>
									<MenuItem
										onClick={() => {
											onClose();
											doAction(OPEN_PROFILES, {
												clientId,
												slug: value,
												view: 'manage',
											});
										}}
									>
										{__('Manage profiles', 'code-block-pro')}
									</MenuItem>
								</MenuGroup>
							)}
							<MenuGroup label={__('Profile', 'code-block-pro')}>
								<MenuItemsChoice
									value={value}
									onHover={() => {}}
									choices={(profiles ?? []).map(({ slug, title }) => ({
										value: slug,
										label: decodeEntities(title),
									}))}
									onSelect={(slug: string) => {
										onChange(slug);
										onClose();
									}}
								/>
							</MenuGroup>
						</>
					)}
				</ToolbarDropdownMenu>
			</ToolbarGroup>
		</BlockControls>
	);
};

const HEADERS: Record<string, string> = {
	headlights: __('Headlights', 'code-block-pro'),
	headlightsMuted: __('Headlights muted', 'code-block-pro'),
	headlightsMutedAlt: __('Headlights muted alt', 'code-block-pro'),
	simpleString: __('Simple string', 'code-block-pro'),
	stringSmall: __('String muted', 'code-block-pro'),
	pillString: __('Pill string', 'code-block-pro'),
};
const FOOTERS: Record<string, string> = {
	simpleStringEnd: __('Simple string end', 'code-block-pro'),
	simpleStringStart: __('Simple string start', 'code-block-pro'),
};
const SEE_MORE: Record<string, string> = {
	roundCenter: __('Center', 'code-block-pro'),
	blockLeft: __('Left', 'code-block-pro'),
	blockRight: __('Right', 'code-block-pro'),
};
const BUTTONS: Record<string, string> = {
	copy: __('Copy', 'code-block-pro'),
	toggle: __('Theme switch', 'code-block-pro'),
	custom: __('Custom', 'code-block-pro'),
};

const words = (slug: string) =>
	slug
		.replace(/[-_]+/g, ' ')
		.replace(/\b\w/g, (c) => c.toUpperCase())
		.replace(/\bGithub\b/g, 'GitHub');

const fontName = (family: string) =>
	family === ''
		? __('System default font', 'code-block-pro')
		: family
				.replace(/^Code-Pro-/, '')
				.replace(/\..*$/, '')
				.replace(/-/g, ' ');

const featuresOf = ({ settings, themes, buttons }: Summary) => {
	const [light, dark] = themes.map(words);
	const header = HEADERS[String(settings.headerType)];
	const footer = FOOTERS[String(settings.footerType)];
	const seeMore = SEE_MORE[String(settings.seeMoreType)];
	return [
		dark
			? /* translators: 1: a color theme, 2: the color theme used in dark mode. */
				sprintf(__('%1$s, %2$s when dark', 'code-block-pro'), light, dark)
			: light,
		fontName(String(settings.fontFamily ?? '')),
		header &&
			/* translators: %s: the name of a header style. */
			sprintf(__('Header: %s', 'code-block-pro'), header),
		footer &&
			/* translators: %s: the name of a footer style. */
			sprintf(__('Footer: %s', 'code-block-pro'), footer),
		settings.lineNumbers && __('Line numbers', 'code-block-pro'),
		seeMore &&
			/* translators: %s: where the See more button sits, such as Center. */
			sprintf(__('See more: %s', 'code-block-pro'), seeMore),
		buttons.length > 0 &&
			/* translators: %s: a list of button names, such as Copy, Theme switch. */
			sprintf(
				__('Buttons: %s', 'code-block-pro'),
				buttons.map((type) => BUTTONS[type] ?? type).join(', '),
			),
	].filter((feature): feature is string => Boolean(feature));
};

export const ProfileSummary = ({ value }: { value: string }) => {
	const { profiles, failed } = useProfiles();
	const { clientId } = useBlockEditContext();
	const current = profiles?.find(({ slug }) => slug === value);
	let title = value;
	if (current) title = decodeEntities(current.title);
	else if (value === '')
		title = __('This block’s own settings', 'code-block-pro');
	else if (profiles) {
		/* translators: %s: the name of a profile, as saved in the block. */
		title = sprintf(__('%s (missing)', 'code-block-pro'), value);
	}

	return (
		<div className="cbp-profile-summary">
			<p className="cbp-profile-summary__title">{title}</p>
			{failed && (
				<p className="components-base-control__help">
					{__(
						'The profiles could not load. Select the block again to try again.',
						'code-block-pro',
					)}
				</p>
			)}
			{current?.summary && (
				<ul className="cbp-profile-summary__features">
					{featuresOf(current.summary).map((feature) => (
						<li key={feature}>{feature}</li>
					))}
				</ul>
			)}
			{hasAction(OPEN_PROFILES) && (
				<Button
					variant="secondary"
					__next40pxDefaultSize
					onClick={() =>
						doAction(OPEN_PROFILES, { clientId, slug: value, view: 'edit' })
					}
				>
					{__('Edit profile', 'code-block-pro')}
				</Button>
			)}
		</div>
	);
};
