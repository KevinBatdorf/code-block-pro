import { BlockControls } from '@wordpress/block-editor';
import {
	Button,
	Dropdown,
	Spinner,
	ToolbarButton,
	ToolbarGroup,
} from '@wordpress/components';
import { useEffect, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import type { Issue } from './preview';

// A quick reply would only flicker; the spinner shows once the wait is long enough to notice.
const SPINNER_DELAY = 300;

type Props = {
	waiting: boolean;
	issues: Issue[];
	error: string;
	retry: () => void;
};

/** The block toolbar's word on the preview: a spinner while it is slow, a warning when the server reported a problem. */
export const Status = ({ waiting, issues, error, retry }: Props) => {
	const [slow, setSlow] = useState(false);

	useEffect(() => {
		if (!waiting) {
			setSlow(false);
			return undefined;
		}
		const timer = window.setTimeout(() => setSlow(true), SPINNER_DELAY);
		return () => window.clearTimeout(timer);
	}, [waiting]);

	const problems = issues.length > 0 || error !== '';
	if (!problems && !(slow && waiting)) return null;

	return (
		<BlockControls group="other">
			<ToolbarGroup>
				{slow && waiting && !error && (
					<div
						className="cbp-status-spinner"
						style={{ display: 'flex', alignItems: 'center', padding: '0 6px' }}
					>
						<Spinner style={{ margin: 0 }} />
					</div>
				)}
				{problems && (
					<Dropdown
						popoverProps={{ placement: 'bottom-start' }}
						renderToggle={({ isOpen, onToggle }) => (
							<ToolbarButton
								icon="warning"
								label={__('Problems with this code', 'code-block-pro')}
								aria-expanded={isOpen}
								onClick={onToggle}
							/>
						)}
						renderContent={() => (
							<div style={{ padding: 16, width: 280 }}>
								{issues.map((issue) => (
									<p
										key={`${issue.code}:${issue.message}`}
										style={{ marginTop: 0 }}
									>
										{issue.message}
									</p>
								))}
								{error && (
									<p style={{ margin: 0 }}>
										{sprintf(
											/* translators: %s: the error the server or browser gave. */
											__('The preview could not update: %s', 'code-block-pro'),
											error,
										)}{' '}
										<Button variant="link" onClick={retry}>
											{__('Try again', 'code-block-pro')}
										</Button>
									</p>
								)}
							</div>
						)}
					/>
				)}
			</ToolbarGroup>
		</BlockControls>
	);
};
