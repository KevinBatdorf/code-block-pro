import { select, subscribe } from '@wordpress/data';
import { useSyncExternalStore } from '@wordpress/element';
import { addAction } from '@wordpress/hooks';
import { registerPlugin } from '@wordpress/plugins';
import { OPEN_PROFILES } from '../editor/actions';
import { markUsed } from './api';
import { type ManagerProps, ProfileManager } from './manager';
import './manager.css';

type Open = Omit<ManagerProps, 'onClose'> | null;
let open: Open = null;
const listeners = new Set<() => void>();
const setOpen = (next: Open) => {
	open = next;
	for (const listener of listeners) listener();
};

const Manager = () => {
	const current = useSyncExternalStore(
		(listener) => {
			listeners.add(listener);
			return () => {
				listeners.delete(listener);
			};
		},
		() => open,
	);
	if (!current) return null;
	return (
		<ProfileManager
			slug={current.slug}
			view={current.view}
			onClose={() => setOpen(null)}
		/>
	);
};

addAction(
	OPEN_PROFILES,
	'code-block-pro/profiles',
	({ slug, view }: { slug: string; view: 'edit' | 'manage' }) => {
		markUsed(slug);
		setOpen({ slug, view });
	},
);

type Block = {
	clientId: string;
	name: string;
	attributes: { profile?: string };
};

// A profile counts as used when the selected block switches to it.
let last: { clientId: string; slug: string } | null = null;
subscribe(() => {
	const block = (
		select('core/block-editor') as unknown as {
			getSelectedBlock: () => Block | null;
		}
	).getSelectedBlock();
	if (block?.name !== 'kevinbatdorf/code-block-pro') return;
	const slug = block.attributes.profile ?? 'default';
	if (last?.clientId === block.clientId && last.slug !== slug) markUsed(slug);
	last = { clientId: block.clientId, slug };
});

registerPlugin('code-block-pro-profiles', { render: Manager });
