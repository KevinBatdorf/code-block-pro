import { expect, test } from '@wordpress/e2e-test-utils-playwright';
import { newPost } from './helpers';

test.beforeEach(async ({ requestUtils }) => {
	await requestUtils.login();
});

test('Plugin is active and block is registered', async ({ admin, editor }) => {
	await newPost(admin, 'Test post');
	await editor.insertBlock({ name: 'kevinbatdorf/code-block-pro' });
	await expect(
		editor.canvas.locator('[data-type="kevinbatdorf/code-block-pro"]'),
	).toBeVisible();
});

test('Code editor accepts input', async ({ admin, editor }) => {
	await newPost(admin, 'Code input test');
	await editor.insertBlock({ name: 'kevinbatdorf/code-block-pro' });

	const block = editor.canvas.locator(
		'[data-type="kevinbatdorf/code-block-pro"]',
	);
	await expect(block).toBeVisible();

	const textarea = block.locator(
		'textarea.npm__react-simple-code-editor__textarea',
	);
	await textarea.click();
	await textarea.fill('const hello = "world";');
	await expect(textarea).toHaveValue('const hello = "world";');
});
