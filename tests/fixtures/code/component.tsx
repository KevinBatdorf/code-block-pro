import { useMemo, useState } from 'react';

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const Badge = ({ label, count }: { label: string; count: number }) => {
	const [open, setOpen] = useState(false);
	const title = useMemo(() => `${label}: ${count} item${count === 1 ? '' : 's'}`, [label, count]);
	if (!SLUG.test(label)) return null;
	return (
		<button type="button" onClick={() => setOpen(!open)} title={title}>
			<span className={open ? 'badge badge--open' : 'badge'}>{count}</span>
			{open ? <em>{label}</em> : null}
		</button>
	);
};
