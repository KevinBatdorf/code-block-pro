import { Button, SelectControl } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import LANGUAGES from '../languages.json';
import { type Profile, type Sample, type Theme, useSamples } from './api';
import { CommitText, Section } from './ui';

const LANGUAGE_OPTIONS = Object.entries(LANGUAGES)
	.filter(
		([key, label], i, all) =>
			all.findIndex(([, l]) => l === label) === i || key === 'typescript',
	)
	.map(([value, label]) => ({ value, label }))
	.toSorted((a, b) => a.label.localeCompare(b.label));

type Props = {
	profile: Profile;
	themes: Theme[];
	defaultSample: Sample;
	blocks: number;
	dirty: boolean;
	onTitle: (title: string) => void;
	onSample: (sample: Sample | null) => void;
	onStats: () => void;
	onDuplicate: () => Promise<void>;
};

const CodePreview = ({
	profile,
	themes,
	defaultSample,
	onSample,
}: Pick<Props, 'profile' | 'themes' | 'defaultSample' | 'onSample'>) => {
	const { samples, fresh } = useSamples(profile.sample);
	const light = themes.find((t) => t.slug === profile.data.conditions[0].theme);
	const sample = profile.sample ?? defaultSample;
	// Empty while the colored copy of the current code is on its way.
	const html = fresh && light ? (samples[light.slug] ?? '') : '';
	const set = (next: Sample) =>
		onSample(
			next.code === defaultSample.code &&
				next.language === defaultSample.language
				? null
				: next,
		);
	const title = __('Code Preview', 'code-block-pro');

	return (
		<Section title={title}>
			<div className="cbp-manager-sample-editor">
				<div
					className={`cbp-manager-editor${html ? ' is-fresh' : ''}`}
					style={{
						background: light?.background ?? '#fff',
						color: light?.foreground ?? '#1e1e1e',
						caretColor: light?.foreground ?? '#1e1e1e',
					}}
				>
					<textarea
						aria-label={title}
						value={sample.code}
						rows={Math.max(6, sample.code.split('\n').length)}
						spellCheck={false}
						autoCapitalize="off"
						autoComplete="off"
						onChange={(event) => set({ ...sample, code: event.target.value })}
					/>
					{html && (
						<div
							className="cbp-manager-editor-colors"
							aria-hidden="true"
							dangerouslySetInnerHTML={{ __html: html }}
						/>
					)}
				</div>
				<SelectControl
					__nextHasNoMarginBottom
					__next40pxDefaultSize
					label={__('Language', 'code-block-pro')}
					value={sample.language}
					options={LANGUAGE_OPTIONS}
					onChange={(language) => set({ ...sample, language })}
				/>
				{profile.sample && (
					<Button
						variant="secondary"
						__next40pxDefaultSize
						onClick={() => onSample(null)}
					>
						{__('Use the default sample', 'code-block-pro')}
					</Button>
				)}
			</div>
		</Section>
	);
};

export const GeneralPage = ({
	profile,
	themes,
	defaultSample,
	blocks,
	dirty,
	onTitle,
	onSample,
	onStats,
	onDuplicate,
}: Props) => {
	const [duplicating, setDuplicating] = useState(false);
	const duplicate = async () => {
		setDuplicating(true);
		try {
			await onDuplicate();
		} finally {
			setDuplicating(false);
		}
	};

	return (
		<>
			<Section title={__('Profile Name', 'code-block-pro')} hideTitle>
				<CommitText
					label={__('Profile Name', 'code-block-pro')}
					value={profile.title}
					required
					onCommit={onTitle}
				/>
			</Section>
			<CodePreview
				profile={profile}
				themes={themes}
				defaultSample={defaultSample}
				onSample={onSample}
			/>
			<Section title={__('Delete or duplicate', 'code-block-pro')} hideTitle>
				<p className="cbp-manager-hint">
					{__(
						'You can only delete a profile if no other blocks are using it',
						'code-block-pro',
					)}
					{blocks > 0 && (
						<>
							{' '}
							<Button variant="link" onClick={onStats}>
								{__('View stats', 'code-block-pro')}
							</Button>
						</>
					)}
				</p>
				<div className="cbp-manager-actions">
					<Button
						variant="secondary"
						isDestructive
						__next40pxDefaultSize
						disabled
						accessibleWhenDisabled
					>
						{__('Delete', 'code-block-pro')}
					</Button>
					<Button
						variant="secondary"
						__next40pxDefaultSize
						disabled={dirty || duplicating}
						accessibleWhenDisabled
						isBusy={duplicating}
						onClick={() => void duplicate()}
					>
						{__('Duplicate', 'code-block-pro')}
					</Button>
					{dirty && (
						<span className="cbp-manager-hint">
							{__('Save your changes before duplicating.', 'code-block-pro')}
						</span>
					)}
				</div>
			</Section>
		</>
	);
};
