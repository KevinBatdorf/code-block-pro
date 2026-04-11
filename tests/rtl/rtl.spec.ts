import { expect, test } from '@wordpress/e2e-test-utils-playwright';
import { addCode, getBlock, insertCodeBlock, previewPage } from '../helpers';

test.beforeEach(async ({ requestUtils }) => {
	await requestUtils.login();
});

test.describe('RTL', () => {
	test('Code renders LTR in RTL locale', async ({ admin, page, editor }) => {
		await admin.createNewPost({ title: 'RTL test' });
		await insertCodeBlock(editor);
		await addCode(editor, 'const foo = "bar";');
		// Editor block should have direction: ltr
		const block = getBlock(editor);
		await expect(block).toHaveCSS('direction', 'ltr');
		// Preview and check front-end
		await previewPage(page);
		const frontBlock = page.locator('.wp-block-kevinbatdorf-code-block-pro');
		await expect(frontBlock).toBeVisible();
		await expect(frontBlock).toHaveCSS('direction', 'ltr');
	});
});
