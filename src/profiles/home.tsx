import { Button, TextControl } from '@wordpress/components';
import { useEffect, useRef, useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import {
	humanize,
	messageOf,
	type Profile,
	type ProfileData,
	reloadProfiles,
	saveProfile,
	usedAt,
} from './api';
import { darkOf } from './themes';
import { CHEVRON_RIGHT, Section, Svg, Tabs } from './ui';

const features = (data: ProfileData) =>
	[
		data.settings.headerType !== 'none' && humanize(data.settings.headerType),
		data.settings.lineNumbers && __('Line numbers', 'code-block-pro'),
		data.settings.seeMoreType && __('See more', 'code-block-pro'),
		data.settings.footerType !== 'none' && __('Footer', 'code-block-pro'),
	].filter((feature): feature is string => Boolean(feature));

type Props = {
	tab: 'profiles' | 'languages';
	onTab: (tab: 'profiles' | 'languages') => void;
	profiles: Profile[];
	usage: Record<string, number>;
	blockSlug: string;
	themeTitle: (slug: string) => string;
	background: (slug: string) => string;
	onOpen: (slug: string) => void;
	onError: (message: string) => void;
};

export const Home = ({
	tab,
	onTab,
	profiles,
	usage,
	blockSlug,
	themeTitle,
	background,
	onOpen,
	onError,
}: Props) => {
	const [adding, setAdding] = useState(false);
	const [name, setName] = useState('');
	const [busy, setBusy] = useState(false);
	const first = useRef<HTMLButtonElement>(null);
	useEffect(() => first.current?.focus(), []);

	const add = async () => {
		const title = name.trim();
		if (!title) return;
		setBusy(true);
		try {
			const slug = await saveProfile({ title });
			await reloadProfiles();
			setAdding(false);
			setName('');
			onOpen(slug);
		} catch (failure) {
			onError(messageOf(failure));
		} finally {
			setBusy(false);
		}
	};

	// The block's own profile first, then the most recently used.
	const used = usedAt();
	const sorted = profiles.toSorted(
		(a, b) =>
			Number(b.slug === blockSlug) - Number(a.slug === blockSlug) ||
			(used[b.slug] ?? 0) - (used[a.slug] ?? 0),
	);

	return (
		<Tabs
			label={__('Code Block Pro', 'code-block-pro')}
			items={[
				{ name: 'profiles', title: __('Profiles', 'code-block-pro') },
				{ name: 'languages', title: __('Languages', 'code-block-pro') },
			]}
			active={tab}
			onSelect={onTab}
		>
			{tab === 'languages' ? (
				<Section title={__('Languages', 'code-block-pro')} hideTitle />
			) : (
				<Section title={__('Profiles', 'code-block-pro')} hideTitle>
					<div className="cbp-manager-cards">
						{sorted.map((p, i) => {
							const light = p.data.conditions[0].theme;
							const dark = darkOf(p.data);
							const count = usage[p.slug] ?? 0;
							const themes = dark
								? sprintf(
										/* translators: 1: the Light theme, 2: the Dark theme. */
										__('%1$s, %2$s dark', 'code-block-pro'),
										themeTitle(light),
										themeTitle(dark.theme),
									)
								: themeTitle(light);
							return (
								<button
									key={p.slug}
									ref={i === 0 ? first : undefined}
									type="button"
									className="cbp-manager-profile"
									onClick={() => onOpen(p.slug)}
								>
									<span
										className="cbp-manager-profile-swatch"
										aria-hidden="true"
										style={{
											background: dark
												? `linear-gradient(135deg, ${background(light)} 50%, ${background(dark.theme)} 50%)`
												: background(light),
										}}
									/>
									<span className="cbp-manager-profile-text">
										<span className="cbp-manager-profile-title">{p.title}</span>
										<span className="cbp-manager-profile-meta">
											{[themes, ...features(p.data)].join(' · ')}
										</span>
									</span>
									<span className="cbp-manager-profile-count">
										{sprintf(
											/* translators: %d: how many code blocks use the profile. */
											_n('%d block', '%d blocks', count, 'code-block-pro'),
											count,
										)}
									</span>
									<Svg d={CHEVRON_RIGHT} />
								</button>
							);
						})}
					</div>
					{adding ? (
						<form
							className="cbp-manager-add"
							onSubmit={(event) => {
								event.preventDefault();
								void add();
							}}
						>
							<TextControl
								__nextHasNoMarginBottom
								__next40pxDefaultSize
								label={__('Name', 'code-block-pro')}
								hideLabelFromVision
								placeholder={__('Name', 'code-block-pro')}
								value={name}
								onChange={setName}
								autoFocus
							/>
							<Button
								variant="primary"
								type="submit"
								__next40pxDefaultSize
								disabled={!name.trim() || busy}
								accessibleWhenDisabled
								isBusy={busy}
							>
								{__('Add', 'code-block-pro')}
							</Button>
							<Button
								variant="tertiary"
								__next40pxDefaultSize
								onClick={() => setAdding(false)}
							>
								{__('Cancel', 'code-block-pro')}
							</Button>
						</form>
					) : (
						<Button
							variant="secondary"
							className="cbp-manager-add-button"
							__next40pxDefaultSize
							onClick={() => setAdding(true)}
						>
							{__('Add profile', 'code-block-pro')}
						</Button>
					)}
				</Section>
			)}
		</Tabs>
	);
};
