import { expect, test } from '@wordpress/e2e-test-utils-playwright';
import { insertCodeBlock, openPanel } from '../helpers';

const notice = '[data-cy="updates-paused"]';
// The panel is empty until the settings store hydrates, so wait before calling a notice absent.
const panelReady = '[data-cy="manage-themes"]';

test.beforeEach(async ({ requestUtils }) => {
	await requestUtils.login();
});

test.describe('Updates paused notice', () => {
	test('Shows when the server cannot highlight', async ({
		admin,
		editor,
		page,
	}) => {
		await admin.visitAdminPage('post-new.php', 'cbp_no_mbregex=1');
		await insertCodeBlock(editor);
		await openPanel(page, 'Theme');

		await expect(page.locator(notice)).toBeVisible();
	});

	test('Stays away when the server can highlight', async ({
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
