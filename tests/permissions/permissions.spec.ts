import { expect, test } from '@wordpress/e2e-test-utils-playwright';
import { insertCodeBlock, newPost } from '../helpers';

test.beforeEach(async ({ admin, page, requestUtils }) => {
	await requestUtils.login();
	// Intercept the REST API to simulate missing unfiltered_html capability
	await page.route('**/code-block-pro/v1/can-save-html**', (route) =>
		route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: 'false',
		}),
	);
	await newPost(admin, 'Permissions test');
});

test.describe('Permissions', () => {
	test('Warning shows when unfiltered_html is missing', async ({
		page,
		editor,
	}) => {
		await insertCodeBlock(editor);
		// Wait for the REST API call to be intercepted
		await page.waitForTimeout(1000);
		// The missing permissions tip should show
		const sidebar = page.locator('.block-editor-block-inspector');
		await expect(sidebar).toContainText('capability');
	});

	test('UI is locked down when capability is missing', async ({
		page,
		editor,
	}) => {
		await insertCodeBlock(editor);
		await page.waitForTimeout(1000);
		// Line numbers checkbox should not exist
		await expect(
			page.locator('[data-cy="show-line-numbers"]'),
		).not.toBeVisible();
	});
});
