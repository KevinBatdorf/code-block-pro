import { expect, test } from '@wordpress/e2e-test-utils-playwright';
import { insertCodeBlock, openPanel } from '../helpers';

const notice = '[data-cy="updates-paused"]';
// The panel is empty until the settings store hydrates, so wait before calling a notice absent.
const panelReady = '[data-cy="manage-themes"]';

test.beforeEach(async ({ requestUtils }) => {
	await requestUtils.login();
});

test.describe('Updates paused notice', () => {
	test('Names mbregex when only mbregex is missing', async ({
		admin,
		editor,
		page,
	}) => {
		await admin.visitAdminPage('post-new.php', 'cbp_no_mbregex=1');
		await insertCodeBlock(editor);
		await openPanel(page, 'Theme');

		await expect(page.locator(notice)).toContainText('mbregex');
		await expect(page.locator(notice)).not.toContainText('PHP 8.2');
	});

	test('Names the PHP version when only PHP is too old', async ({
		admin,
		editor,
		page,
	}) => {
		await admin.visitAdminPage('post-new.php', 'cbp_old_php=1');
		await insertCodeBlock(editor);
		await openPanel(page, 'Theme');

		await expect(page.locator(notice)).toContainText('PHP 8.2 or newer');
		await expect(page.locator(notice)).not.toContainText('mbregex');
	});

	test('Names both when the server has neither', async ({
		admin,
		editor,
		page,
	}) => {
		await admin.visitAdminPage(
			'post-new.php',
			'cbp_no_mbregex=1&cbp_old_php=1',
		);
		await insertCodeBlock(editor);
		await openPanel(page, 'Theme');

		await expect(page.locator(notice)).toContainText('PHP 8.2 or newer');
		await expect(page.locator(notice)).toContainText('mbregex');
	});

	test('Stays away when the server meets both', async ({
		admin,
		editor,
		page,
	}) => {
		await admin.visitAdminPage('post-new.php', '');
		await insertCodeBlock(editor);
		await openPanel(page, 'Theme');
		await expect(page.locator(panelReady)).toBeVisible();

		await expect(page.locator(notice)).toHaveCount(0);
	});
});
