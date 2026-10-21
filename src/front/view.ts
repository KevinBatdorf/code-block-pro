type States = [string, string][];

const panesOf = (block: Element) =>
	Array.from(block.querySelectorAll<HTMLElement>(':scope > .cbp-pane'));

const activePane = (block: Element) =>
	panesOf(block).find((pane) => pane.classList.contains('cbp-active')) ??
	panesOf(block)[0];

// textContent, not innerText, which doubles the newline inside each line.
const codeOf = (pane: Element | undefined) =>
	Array.from(pane?.querySelectorAll('pre > code > .line:not(.cbp-del)') ?? [])
		.map((line) => (line.textContent ?? '').replace(/\n$/, ''))
		.join('\n');

const themeClasses = (pane: HTMLElement) =>
	(pane.dataset.cbpTheme ?? '').split(' ').filter(Boolean);

const selectTab = (tab: HTMLElement, { focus = false } = {}) => {
	const block = tab.closest('.cbp-block');
	if (!block) return;
	const before = activePane(block);
	const tabs = Array.from(block.querySelectorAll<HTMLElement>('.cbp-tab'));
	const panes = panesOf(block);
	tabs.forEach((each, i) => {
		const selected = each === tab;
		each.setAttribute('aria-selected', String(selected));
		each.tabIndex = selected ? 0 : -1;
		panes[i]?.classList.toggle('cbp-active', selected);
	});
	if (focus) tab.focus();
	// The header and footer take the colors of the pane on show.
	const after = activePane(block);
	if (!before || !after || before === after) return;
	for (const el of block.querySelectorAll(
		':scope > .cbp-header, :scope > .cbp-footer',
	)) {
		el.classList.remove(...themeClasses(before));
		el.classList.add(...themeClasses(after));
	}
};

const writeClipboard = async (text: string) => {
	try {
		await navigator.clipboard.writeText(text);
		return true;
	} catch {
		// A page served over plain http has no clipboard API.
		const area = document.createElement('textarea');
		area.value = text;
		area.setAttribute('readonly', '');
		area.style.position = 'fixed';
		area.style.opacity = '0';
		document.body.append(area);
		area.select();
		const done = document.execCommand('copy');
		area.remove();
		return done;
	}
};

const announce = (block: Element, message: string) => {
	const status = block.querySelector('.cbp-status');
	if (!status) return;
	status.textContent = message;
	setTimeout(() => {
		if (status.textContent === message) status.textContent = '';
	}, 2000);
};

const timers = new WeakMap<HTMLElement, number>();

const copy = async (button: HTMLElement) => {
	const block = button.closest('.cbp-block');
	if (!block) return;
	// Listeners may rewrite detail.text, or cancel the copy.
	const detail = { text: codeOf(activePane(block)), block };
	const event = new CustomEvent('code-block-pro:copy', {
		bubbles: true,
		cancelable: true,
		detail,
	});
	if (!button.dispatchEvent(event)) return;
	if (!(await writeClipboard(detail.text))) return;
	const copied = button.dataset.cbpCopied ?? '';
	const label = button.querySelector('.cbp-button-text');
	// Read once, or a second click inside two seconds would save "Copied!" as the label.
	button.dataset.cbpLabel ??= label?.textContent ?? '';
	button.classList.add('cbp-copied');
	if (label && copied) label.textContent = copied;
	announce(block, copied);
	window.clearTimeout(timers.get(button));
	timers.set(
		button,
		window.setTimeout(() => {
			button.classList.remove('cbp-copied');
			if (label) label.textContent = button.dataset.cbpLabel ?? '';
		}, 2000),
	);
};

type Scope = 'block' | 'page' | 'site';

const statesOf = (toggle: HTMLElement): States =>
	JSON.parse(toggle.dataset.cbpStates ?? '[]');

// Light and Dark carry across profiles; the Theme Pack's states name conditions of one profile.
const isLightDark = (block: HTMLElement) => block.dataset.cbpDark !== undefined;

const showState = (block: HTMLElement, state: string) => {
	const condition =
		state === 'light' && isLightDark(block)
			? block.dataset.cbpLight
			: state === 'dark' && isLightDark(block)
				? block.dataset.cbpDark
				: state;
	if (state) block.dataset.cbpState = state;
	else delete block.dataset.cbpState;
	if (condition) block.dataset.cbpCondition = condition;
	else delete block.dataset.cbpCondition;
	for (const toggle of block.querySelectorAll<HTMLElement>('.cbp-toggle')) {
		const name = statesOf(toggle).find(([id]) => id === state)?.[1];
		const label = toggle.querySelector('.cbp-toggle-state');
		if (label && name !== undefined) label.textContent = name;
	}
};

const reach = (block: HTMLElement, scope: Scope) => {
	if (scope === 'block') return [block];
	const selector = isLightDark(block)
		? '.cbp-block[data-cbp-dark]'
		: `.cbp-block[data-cbp-profile="${CSS.escape(block.dataset.cbpProfile ?? '')}"]`;
	return Array.from(document.querySelectorAll<HTMLElement>(selector));
};

const storageKey = (block: HTMLElement, scope: Scope) => {
	const owner = isLightDark(block) ? '' : `:${block.dataset.cbpProfile}`;
	const key = `code-block-pro-switch${owner}`;
	if (scope === 'site') return key;
	if (scope === 'page') return `${key}:${location.pathname}`;
	const index = Array.from(document.querySelectorAll('.cbp-block')).indexOf(
		block,
	);
	return `${key}:${location.pathname}:${block.id || index}`;
};

const toggle = (button: HTMLElement) => {
	const block = button.closest<HTMLElement>('.cbp-block');
	if (!block) return;
	const scope = (button.dataset.cbpScope ?? 'page') as Scope;
	const states = statesOf(button);
	const current = states.findIndex(
		([id]) => id === (block.dataset.cbpState ?? ''),
	);
	const [next, name] = states[(current + 1) % states.length] ?? ['', ''];
	for (const each of reach(block, scope)) showState(each, next);
	announce(block, name);
	if (button.dataset.cbpRemember !== '1') return;
	try {
		if (next) localStorage.setItem(storageKey(block, scope), next);
		else localStorage.removeItem(storageKey(block, scope));
	} catch {
		// With storage off, the choice lasts until the page reloads.
	}
};

// A page or block choice counts only while a switch still remembers it; the site's applies everywhere.
const remembers = (block: HTMLElement, scope: Scope) => {
	if (scope === 'site') return true;
	const within = scope === 'block' ? [block] : reach(block, 'page');
	return within.some((each) =>
		each.querySelector(
			`.cbp-toggle[data-cbp-scope="${scope}"][data-cbp-remember="1"]`,
		),
	);
};

const offers = (block: HTMLElement, state: string) =>
	isLightDark(block)
		? state === 'light' || state === 'dark'
		: reach(block, 'page').some((each) =>
				Array.from(each.querySelectorAll<HTMLElement>('.cbp-toggle')).some(
					(toggle) => statesOf(toggle).some(([id]) => id === state),
				),
			);

const restoreSwitches = () => {
	const blocks = document.querySelectorAll<HTMLElement>(
		'.cbp-block[data-cbp-profile]',
	);
	// Broadest first, so a choice made for one page or one block wins over the site's.
	for (const scope of ['site', 'page', 'block'] as Scope[]) {
		for (const block of blocks) {
			try {
				const key = storageKey(block, scope);
				const saved = localStorage.getItem(key);
				if (saved === null) continue;
				if (!remembers(block, scope) || !offers(block, saved)) {
					if (scope !== 'site') localStorage.removeItem(key);
					continue;
				}
				showState(block, saved);
			} catch {
				// With storage off, every page starts on the profile's own triggers.
			}
		}
	}
};

const seeMore = (button: HTMLElement, { instant = false } = {}) => {
	const pane = button.closest<HTMLElement>('.cbp-pane');
	if (!pane) return;
	const expanded = button.getAttribute('aria-expanded') === 'true';
	const { cbpExpand: expand = '', cbpCollapse: collapse } = button.dataset;
	const pre = pane.querySelector<HTMLElement>(':scope > pre');
	const animate = !instant && pane.closest('.cbp-more-transition') !== null;
	// max-height can't animate to none, so the transition runs to the measured height.
	if (pre && animate) {
		pre.style.maxHeight = expanded ? '' : `${pre.scrollHeight}px`;
	}
	pane.classList.toggle('cbp-expanded', !expanded);
	button.setAttribute('aria-expanded', String(!expanded));
	if (!expanded && !collapse) {
		// Without a collapse label, expanding is one-way, as in 1.x.
		if (!instant) pre?.focus();
		button.closest('.cbp-more')?.remove();
		return;
	}
	button.textContent = expanded ? expand : (collapse ?? '');
	if (!expanded) return;
	// Collapsing moves the button up; wait for the code to shrink before bringing it back into view.
	const show = () => button.scrollIntoView({ block: 'nearest' });
	if (pre && animate)
		pre.addEventListener('transitionend', show, { once: true });
	else show();
};

const revealTarget = () => {
	let line: HTMLElement | null = null;
	try {
		line = document.getElementById(
			decodeURIComponent(window.location.hash.slice(1)),
		);
	} catch {
		return;
	}
	const pane = line?.classList.contains('line')
		? line.closest<HTMLElement>('.cbp-pane')
		: null;
	if (!line || !pane) return;
	const tab = pane.id
		? document.querySelector<HTMLElement>(
				`.cbp-tab[aria-controls="${CSS.escape(pane.id)}"]`,
			)
		: null;
	if (tab && !pane.classList.contains('cbp-active')) selectTab(tab);
	const more = pane.querySelector<HTMLElement>('.cbp-more-button');
	if (more?.getAttribute('aria-expanded') === 'false') {
		seeMore(more, { instant: true });
	}
	line.scrollIntoView({ block: 'center' });
};

const custom = (button: HTMLElement) => {
	const block = button.closest('.cbp-block');
	const pane = block ? activePane(block) : undefined;
	button.dispatchEvent(
		new CustomEvent('code-block-pro:button', {
			bubbles: true,
			detail: { id: button.dataset.cbpButton, block, pane, code: codeOf(pane) },
		}),
	);
};

document.addEventListener('click', (event) => {
	const button = (event.target as Element | null)?.closest<HTMLElement>(
		'.cbp-block :is(.cbp-tab, .cbp-button, .cbp-more-button)',
	);
	if (!button) return;
	const { classList } = button;
	if (classList.contains('cbp-tab')) selectTab(button);
	if (classList.contains('cbp-copy')) void copy(button);
	if (classList.contains('cbp-toggle')) toggle(button);
	if (classList.contains('cbp-custom')) custom(button);
	if (classList.contains('cbp-more-button')) seeMore(button);
});

document.addEventListener('keydown', (event) => {
	const tab = (event.target as Element | null)?.closest<HTMLElement>(
		'.cbp-block .cbp-tab',
	);
	if (!tab?.parentElement || event.altKey || event.ctrlKey || event.metaKey)
		return;
	const tabs = Array.from(
		tab.parentElement.querySelectorAll<HTMLElement>('.cbp-tab'),
	);
	const at = tabs.indexOf(tab);
	const next: HTMLElement | undefined = {
		ArrowLeft: tabs[(at - 1 + tabs.length) % tabs.length],
		ArrowRight: tabs[(at + 1) % tabs.length],
		Home: tabs[0],
		End: tabs[tabs.length - 1],
	}[event.key];
	if (!next) return;
	event.preventDefault();
	selectTab(next, { focus: true });
});

window.addEventListener('hashchange', revealTarget);

for (const block of document.querySelectorAll('.cbp-block')) {
	block.classList.add('cbp-js');
}
restoreSwitches();
revealTarget();
