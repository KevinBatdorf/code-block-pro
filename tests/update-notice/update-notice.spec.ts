import { expect, test } from '@wordpress/e2e-test-utils-playwright';
import { insertCodeBlock } from '../helpers';

const notice = '[data-cy="updates-paused"]';
// The inspector renders empty first, so wait on a panel before calling a notice absent.
const inspectorReady = 'button:has-text("Line Settings")';

test.beforeEach(async ({ requestUtils }) => {
	await requestUtils.login();
});

test.describe('Updates paused notice', () => {
	test('Names mbregex when the server was built without it', async ({
		admin,
		editor,
		page,
	}) => {
		await admin.visitAdminPage('post-new.php', 'cbp_no_mbregex=1');
		await insertCodeBlock(editor);

		await expect(page.locator(notice)).toContainText('mbregex');
	});

	test('Stays away when the server has it', async ({ admin, editor, page }) => {
		await admin.visitAdminPage('post-new.php', '');
		await insertCodeBlock(editor);
		await expect(page.locator(inspectorReady)).toBeVisible();

		await expect(page.locator(notice)).toHaveCount(0);
	});
});
