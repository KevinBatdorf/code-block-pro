import { Button, SelectControl } from '@wordpress/components';
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
	onTitle: (title: string) => void;
	onSample: (sample: Sample | null) => void;
};

export const GeneralPage = ({
	profile,
	themes,
	defaultSample,
	onTitle,
	onSample,
}: Props) => {
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

	return (
		<>
			<Section title={__('Name', 'code-block-pro')} hideTitle>
				<CommitText
					label={__('Name', 'code-block-pro')}
					value={profile.title}
					required
					onCommit={onTitle}
				/>
			</Section>
			<Section
				title={__('Code sample', 'code-block-pro')}
				description={__(
					'Used for previewing the profile throughout',
					'code-block-pro',
				)}
			>
				<div className="cbp-manager-sample-editor">
					<SelectControl
						__nextHasNoMarginBottom
						__next40pxDefaultSize
						label={__('Language', 'code-block-pro')}
						value={sample.language}
						options={LANGUAGE_OPTIONS}
						onChange={(language) => set({ ...sample, language })}
					/>
					<div className="cbp-manager-editor-field">
						<label
							className="cbp-manager-editor-label"
							htmlFor={`${profile.slug}-sample`}
						>
							{__('Code', 'code-block-pro')}
						</label>
						<div
							className={`cbp-manager-editor${html ? ' is-fresh' : ''}`}
							style={{
								background: light?.background ?? '#fff',
								color: light?.foreground ?? '#1e1e1e',
								caretColor: light?.foreground ?? '#1e1e1e',
							}}
						>
							<textarea
								id={`${profile.slug}-sample`}
								value={sample.code}
								rows={Math.max(6, sample.code.split('\n').length)}
								spellCheck={false}
								autoCapitalize="off"
								autoComplete="off"
								onChange={(event) =>
									set({ ...sample, code: event.target.value })
								}
							/>
							{html && (
								<div
									className="cbp-manager-editor-colors"
									aria-hidden="true"
									dangerouslySetInnerHTML={{ __html: html }}
								/>
							)}
						</div>
					</div>
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
		</>
	);
};
