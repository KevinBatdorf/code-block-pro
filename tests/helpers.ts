import type { Page } from '@playwright/test';
import type { Admin } from '@wordpress/e2e-test-utils-playwright';

/** createNewPost's preference dispatch intermittently throws RangeError. */
export const newPost = async (admin: Admin, title: string) => {
	await admin.visitAdminPage(
		'post-new.php',
		new URLSearchParams({ post_title: title }).toString(),
	);
};

/** A REST request from an editor page, as its user. requestUtils.rest finds the site through WP_BASE_URL, not the project's port. */
export const apiFetch = <T>(
	page: Page,
	options: { path: string; method?: string; data?: unknown },
) =>
	page.evaluate(
		(request) =>
			(
				window as unknown as {
					wp: { apiFetch: (request: unknown) => Promise<unknown> };
				}
			).wp.apiFetch(request),
		options,
	) as Promise<T>;
