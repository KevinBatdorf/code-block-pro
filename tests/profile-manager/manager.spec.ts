import { readFile } from 'node:fs/promises';
import type { Page } from '@playwright/test';
import {
	type Editor,
	expect,
	test,
} from '@wordpress/e2e-test-utils-playwright';
import { apiFetch, newPost } from '../helpers';

test.beforeEach(async ({ requestUtils }) => {
	await requestUtils.login();
});

const openFromToolbar = async (
	page: Page,
	editor: Editor,
	item: 'Edit profile' | 'Manage profiles',
) => {
	await editor.showBlockToolbar();
	await page
		.getByRole('toolbar', { name: 'Block tools' })
		.getByRole('button', { name: 'Profile' })
		.click();
	await page.getByRole('menuitem', { name: item }).click();
	return page.locator('.cbp-manager-modal');
};

test('a block’s profile is edited from its toolbar, and the block shows the saved change', async ({
	page,
	admin,
	editor,
}) => {
	await newPost(admin, 'manager');
	await editor.insertBlock({ name: 'kevinbatdorf/code-block-pro' });
	await page.keyboard.type('const a = 1;');
	const block = editor.canvas.locator('.cbp-block');
	await expect(block).not.toHaveClass(/\bcbp-numbers\b/);

	const modal = await openFromToolbar(page, editor, 'Edit profile');
	await expect(modal.locator('.cbp-manager-impact-title')).toHaveText(
		'Default',
	);
	await expect(modal.getByRole('tab', { name: 'General' })).toHaveAttribute(
		'aria-selected',
		'true',
	);
	const save = modal.getByRole('button', { name: 'Save' });
	await expect(save).toBeDisabled();
	await modal.getByRole('tab', { name: 'Line numbers' }).click();
	await modal.getByRole('checkbox', { name: 'Show line numbers' }).check();
	await save.click();

	await expect(
		page.locator('.components-snackbar', { hasText: 'Profile updated.' }),
	).toBeVisible();
	await expect(save).toBeDisabled();
	await expect(block).toHaveClass(/\bcbp-numbers\b/);
});

test('closing with unsaved changes asks first, and nothing is saved', async ({
	page,
	admin,
	editor,
}) => {
	await newPost(admin, 'manager close');
	await editor.insertBlock({ name: 'kevinbatdorf/code-block-pro' });
	await page.keyboard.type('a');
	const modal = await openFromToolbar(page, editor, 'Edit profile');
	await modal.getByRole('tab', { name: 'Line numbers' }).click();
	const box = modal.getByRole('checkbox', { name: 'Highlight lines on hover' });
	const before = await box.isChecked();
	await box.setChecked(!before);

	await modal.getByRole('button', { name: 'Close', exact: true }).click();
	await page.getByRole('button', { name: 'Keep editing' }).click();
	await expect(box).toBeChecked({ checked: !before });
	await modal.getByRole('button', { name: 'Close', exact: true }).click();
	await page.getByRole('button', { name: 'Close without saving' }).click();

	await expect(modal).toBeHidden();
	const { profiles } = await apiFetch<{
		profiles: {
			slug: string;
			data: { settings: { highlightingHover: boolean } };
		}[];
	}>(page, { path: '/code-block-pro/v1/manage/profiles' });
	expect(
		profiles.find(({ slug }) => slug === 'default')?.data.settings
			.highlightingHover,
	).toBe(before);
});

test('closing Manage blocks returns to the profile, over the same overlay', async ({
	page,
	admin,
	editor,
}) => {
	await newPost(admin, 'manager blocks');
	await editor.insertBlock({ name: 'kevinbatdorf/code-block-pro' });
	await page.keyboard.type('a');
	const modal = await openFromToolbar(page, editor, 'Edit profile');
	await modal
		.locator('.cbp-manager-footer')
		.getByRole('button', { name: 'View stats' })
		.click();
	await modal.getByRole('button', { name: 'Manage blocks' }).click();
	await expect(modal).toHaveCount(2);
	await expect(page.locator('.cbp-manager-stacked')).toHaveCSS(
		'background-color',
		'rgba(0, 0, 0, 0)',
	);

	await modal
		.last()
		.getByRole('button', { name: 'Close', exact: true })
		.click();

	await expect(modal).toHaveCount(1);
	await expect(modal.getByRole('tab', { name: 'Stats' })).toHaveAttribute(
		'aria-selected',
		'true',
	);
});

test('a profile added in the list can be renamed and picked for the block', async ({
	page,
	admin,
	editor,
}) => {
	await newPost(admin, 'manager add');
	await editor.insertBlock({ name: 'kevinbatdorf/code-block-pro' });
	await page.keyboard.type('a');
	const modal = await openFromToolbar(page, editor, 'Manage profiles');
	await modal.getByRole('button', { name: 'Add profile' }).click();
	await modal.getByRole('textbox', { name: 'Name' }).fill('Docs');
	await modal.getByRole('button', { name: 'Add', exact: true }).click();
	await expect(modal.locator('.cbp-manager-impact-title')).toHaveText('Docs');
	await modal
		.getByRole('textbox', { name: 'Profile Name' })
		.fill('Docs and guides');
	await modal.getByRole('button', { name: 'Save' }).click();
	await expect(
		page.locator('.components-snackbar', { hasText: 'Profile updated.' }),
	).toBeVisible();
	await modal.getByRole('button', { name: 'Close', exact: true }).click();
	await expect(modal).toBeHidden();

	await editor.showBlockToolbar();
	await page
		.getByRole('toolbar', { name: 'Block tools' })
		.getByRole('button', { name: 'Profile' })
		.click();
	await page.getByRole('menuitemradio', { name: 'Docs and guides' }).click();
	await expect(editor.canvas.locator('.cbp-block')).toHaveClass(
		/\bcbp-profile-docs\b/,
	);
});

test('a button moves from the rail into the block and back out', async ({
	page,
	admin,
	editor,
}) => {
	await newPost(admin, 'manager buttons');
	await editor.insertBlock({ name: 'kevinbatdorf/code-block-pro' });
	await page.keyboard.type('a');
	const modal = await openFromToolbar(page, editor, 'Manage profiles');
	await modal.getByRole('button', { name: 'Add profile' }).click();
	await modal.getByRole('textbox', { name: 'Name' }).fill('Buttons');
	await modal.getByRole('button', { name: 'Add', exact: true }).click();
	await modal.getByRole('tab', { name: 'Buttons' }).click();
	const rail = modal.getByRole('group', { name: 'Buttons to add' });
	const copy = modal.locator('.cbp-manager-buttons-block .cbp-copy');
	await expect(
		rail.getByRole('button', { name: 'Theme switch' }),
	).toBeDisabled();

	await rail.getByRole('button', { name: 'Copy' }).click();
	await modal.getByRole('button', { name: 'Put in the block' }).click();
	await expect(copy).toBeVisible();
	await expect(rail.getByRole('button', { name: 'Copy' })).toHaveCount(0);
	await expect(
		modal.getByRole('textbox', { name: 'After copying' }),
	).toBeVisible();

	await modal.getByRole('button', { name: 'Take out of the block' }).click();
	await expect(copy).toHaveCount(0);
	await expect(rail.getByRole('button', { name: 'Copy' })).toBeVisible();
});

test('an exported profile imports as a new profile, and other files are refused', async ({
	page,
	admin,
	editor,
}) => {
	await newPost(admin, 'manager export');
	await editor.insertBlock({ name: 'kevinbatdorf/code-block-pro' });
	await page.keyboard.type('a');
	const modal = await openFromToolbar(page, editor, 'Edit profile');
	const downloading = page.waitForEvent('download');
	await modal.getByRole('button', { name: 'Export' }).click();
	const download = await downloading;
	const path = await download.path();

	expect(download.suggestedFilename()).toBe('code-block-pro-default.json');
	expect(JSON.parse(await readFile(path, 'utf8'))).toMatchObject({
		type: 'code-block-pro-profile',
		version: 1,
		title: 'Default',
	});

	await modal.getByRole('button', { name: 'Back to profiles' }).click();
	const picker = modal.locator('input[type="file"]');
	await picker.setInputFiles({
		name: 'notes.json',
		mimeType: 'application/json',
		buffer: Buffer.from('{"title":"Notes"}'),
	});
	await expect(
		modal.getByText('That file is not a Code Block Pro profile.'),
	).toBeVisible();

	await picker.setInputFiles(path);
	await expect(modal.getByRole('tab', { name: 'General' })).toHaveAttribute(
		'aria-selected',
		'true',
	);
	const { profiles } = await apiFetch<{
		profiles: { slug: string; title: string }[];
	}>(page, { path: '/code-block-pro/v1/manage/profiles' });
	expect(profiles.map(({ slug, title }) => [slug, title])).toContainEqual([
		'default-2',
		'Default',
	]);
});
