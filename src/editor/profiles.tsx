import apiFetch from '@wordpress/api-fetch';
import { BlockControls, useBlockEditingMode } from '@wordpress/block-editor';
import {
	MenuGroup,
	MenuItemsChoice,
	SelectControl,
	ToolbarDropdownMenu,
	ToolbarGroup,
} from '@wordpress/components';
import { useEffect, useState } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { __, sprintf } from '@wordpress/i18n';

type Profile = { slug: string; title: string };

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

const useProfiles = () => {
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

export const ProfileToolbar = ({ value, onChange }: Props) => {
	const { profiles } = useProfiles();
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
					)}
				</ToolbarDropdownMenu>
			</ToolbarGroup>
		</BlockControls>
	);
};

export const ProfilePicker = ({ value, onChange }: Props) => {
	const { profiles, failed } = useProfiles();

	const options = (profiles ?? []).map(({ slug, title }) => ({
		value: slug,
		// Titles come back as WordPress stores them, with & as &amp;.
		label: decodeEntities(title),
	}));
	if (!profiles?.some(({ slug }) => slug === value)) {
		let label = value;
		if (value === '') label = __('This block’s own settings', 'code-block-pro');
		else if (profiles) {
			/* translators: %s: the name of a profile, as saved in the block. */
			label = sprintf(__('%s (missing)', 'code-block-pro'), value);
		}
		options.push({ value, label });
	}

	return (
		<SelectControl
			__next40pxDefaultSize
			label={__('Profile', 'code-block-pro')}
			hideLabelFromVision
			help={
				failed
					? __(
							'The profiles could not load. Select the block again to try again.',
							'code-block-pro',
						)
					: __(
							'Sets the theme, font and layout. Editing a profile changes every block that uses it.',
							'code-block-pro',
						)
			}
			disabled={!profiles}
			value={value}
			options={options}
			onChange={onChange}
		/>
	);
};
