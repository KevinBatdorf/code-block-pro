import { expect, test } from '@wordpress/e2e-test-utils-playwright';
import { newPost } from '../helpers';

test.beforeEach(async ({ requestUtils }) => {
	await requestUtils.login();
});

test('a 1.x block is locked, shown as saved, with the reason and the way back to 1.x', async ({
	admin,
	editor,
	page,
}) => {
	await admin.visitAdminPage('edit.php');
	const id = await page.evaluate(async () => {
		const [post] = await window.wp.apiFetch({
			path: '/wp/v2/posts?slug=a-1x-block&_fields=id',
		});
		return post.id as number;
	});
	await admin.visitAdminPage('post.php', `post=${id}&action=edit`);
	const block = editor.canvas.locator(
		'[data-type="kevinbatdorf/code-block-pro"]',
	);
	await expect(block.locator('pre.shiki')).toContainText('export');
	await expect(block.locator('textarea')).toHaveCount(0);

	await editor.openDocumentSettingsSidebar();
	await block.click();
	const notice = page.locator(
		'.block-editor-block-inspector .components-notice',
	);
	await expect(notice).toContainText('mbregex');
	await expect(
		notice.getByRole('link', { name: /Download Code Block Pro 1\.x/ }),
	).toHaveAttribute(
		'href',
		'https://wordpress.org/plugins/code-block-pro/advanced/',
	);

	await expect
		.poll(() =>
			block.evaluate((el) =>
				el.ownerDocument.fonts
					.load('16px Code-Pro-JetBrains-Mono')
					.then((faces) => faces.length),
			),
		)
		.toBe(1);
});

test('the inserter offers no code block', async ({ admin, page }) => {
	await newPost(admin, 'no mbregex');
	await page.getByRole('button', { name: 'Block Inserter' }).click();
	await page.getByRole('searchbox', { name: /Search/ }).fill('Code');

	// The same search lists the block where mbregex is present (tests/editor).
	await expect(
		page.getByRole('option', { name: 'Code', exact: true }),
	).toBeVisible();
	await expect(page.getByRole('option', { name: 'Code Pro' })).toHaveCount(0);
});

test('the Plugins screen says why', async ({ admin, page }) => {
	await admin.visitAdminPage('plugins.php');
	await expect(
		page.locator('tr.plugin-update-tr').filter({ hasText: 'mbregex' }),
	).toBeVisible();
});
