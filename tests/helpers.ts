import type { Admin, Editor, Page } from '@wordpress/e2e-test-utils-playwright';
import { expect } from '@wordpress/e2e-test-utils-playwright';

/** Get the block locator within the editor canvas */
export function getBlock(editor: Editor) {
	return editor.canvas.locator('[data-type="kevinbatdorf/code-block-pro"]');
}

/** Get the code pre element (excludes the hidden copy-button pre) */
export function getCodePre(editor: Editor) {
	return getBlock(editor).locator('pre:not(.code-block-pro-copy-button-pre)');
}

/** Get the textarea locator within the block */
export function getTextarea(editor: Editor) {
	return getBlock(editor).locator(
		'textarea.npm__react-simple-code-editor__textarea',
	);
}

/** Insert a code block and wait for it to be visible */
export async function insertCodeBlock(editor: Editor) {
	await editor.insertBlock({ name: 'kevinbatdorf/code-block-pro' });
	await expect(getBlock(editor)).toBeVisible();
}

/** Focus the textarea and type code into it */
export async function addCode(editor: Editor, code: string) {
	const textarea = getTextarea(editor);
	await textarea.click();
	await textarea.fill(code);
}

/** Ensure the block settings sidebar is open */
export async function openBlockSettings(page: Page) {
	const settingsButton = page.getByRole('button', {
		name: 'Settings',
		exact: true,
	});
	const isPressed = await settingsButton.getAttribute('aria-pressed');
	if (isPressed !== 'true') {
		await settingsButton.click();
	}
	// Make sure Block tab is selected
	const blockTab = page.getByRole('tab', { name: 'Block' });
	if ((await blockTab.getAttribute('aria-selected')) !== 'true') {
		await blockTab.click();
	}
}

/** Open a specific sidebar panel by its title */
export async function openPanel(page: Page, panelTitle: string) {
	await openBlockSettings(page);
	const panelButton = page.getByRole('button', {
		name: panelTitle,
		exact: true,
	});
	const isExpanded = await panelButton.getAttribute('aria-expanded');
	if (isExpanded !== 'true') {
		await panelButton.click();
	}
}

/** Set the theme by clicking its button (use button tag to avoid duplicate ID with loading span) */
export async function setTheme(page: Page, theme: string) {
	await openPanel(page, 'Theme');
	const themeButton = page.locator(`button#code-block-pro-theme-${theme}`);
	await themeButton.scrollIntoViewIfNeeded();
	await themeButton.click();
}

/** Set the language via the select dropdown */
export async function setLanguage(page: Page, language: string) {
	await openPanel(page, 'Language');
	await page.locator('#code-block-pro-language').selectOption(language);
}

/** Set header type by clicking its button */
export async function setHeader(page: Page, header: string) {
	await openPanel(page, 'Header Type');
	const btn = page.locator(`#code-block-pro-header-${header}`);
	await btn.scrollIntoViewIfNeeded();
	await btn.click();
}

/** Set footer type by clicking its button */
export async function setFooter(page: Page, footer: string) {
	await openPanel(page, 'Footer Type');
	const btn = page.locator(`#code-block-pro-footer-${footer}`);
	await btn.scrollIntoViewIfNeeded();
	await btn.click();
}

/** Enable the max height feature */
export async function enableMaxHeight(page: Page) {
	await openPanel(page, 'Max Height');
	const checkbox = page.locator('[data-cy="enable-max-height"]');
	if (!(await checkbox.isChecked())) {
		await checkbox.check();
	}
}

/** Set the height expand/collapse design */
export async function setHeightDesign(page: Page, design: string) {
	await openPanel(page, 'Max Height');
	const btn = page.locator(`#code-block-pro-see-more-${design}`);
	await btn.scrollIntoViewIfNeeded();
	await btn.click();
}

/** Check or uncheck a checkbox by data-cy attribute */
export async function setCheckbox(
	page: Page,
	dataCy: string,
	checked: boolean,
) {
	const checkbox = page.locator(`[data-cy="${dataCy}"]`);
	if (checked) {
		await checkbox.check();
	} else {
		await checkbox.uncheck();
	}
}

/** Save draft and navigate to front-end preview */
export async function previewPage(page: Page) {
	// Save the draft
	await page.getByRole('button', { name: 'Save draft' }).click();
	// Wait for saved state
	await expect(page.locator('.editor-post-saved-state.is-saved')).toBeVisible({
		timeout: 10000,
	});
	// Extract post ID from URL (createNewPost makes a post, not a page)
	const url = page.url();
	const postId = new URL(url).searchParams.get('post');
	// Navigate to preview — use ?p= for posts
	await page.goto(`/?p=${postId}&preview=true`);
	await page.waitForLoadState('networkidle');
}

/** Standard setup: login, create post, insert block, focus textarea */
export async function setupCodeBlock({
	admin,
	editor,
	requestUtils,
}: {
	admin: Admin;
	editor: Editor;
	page: Page;
	requestUtils: { login: () => Promise<void> };
}) {
	await requestUtils.login();
	await admin.createNewPost({ title: 'Test post' });
	await insertCodeBlock(editor);
	await getTextarea(editor).click();
}
