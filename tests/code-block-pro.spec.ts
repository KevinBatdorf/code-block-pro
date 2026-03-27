import { expect, test } from '@wordpress/e2e-test-utils-playwright';

test.beforeEach(async ({ requestUtils }) => {
	await requestUtils.login();
});

test('Plugin is active and block is registered', async ({
	admin,
	page,
	editor,
}) => {
	await admin.createNewPost({ title: 'Test post' });
	await editor.insertBlock({ name: 'kevinbatdorf/code-block-pro' });
	await expect(
		page.locator('[data-type="kevinbatdorf/code-block-pro"]'),
	).toBeVisible();
});

test('Code editor accepts input', async ({ admin, page, editor }) => {
	await admin.createNewPost({ title: 'Code input test' });
	await editor.insertBlock({ name: 'kevinbatdorf/code-block-pro' });

	const block = page.locator('[data-type="kevinbatdorf/code-block-pro"]');
	await expect(block).toBeVisible();

	const textarea = block.locator(
		'textarea.npm__react-simple-code-editor__textarea',
	);
	await textarea.click();
	await textarea.fill('const hello = "world";');
	await expect(textarea).toHaveValue('const hello = "world";');
});
