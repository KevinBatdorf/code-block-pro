import type { Admin } from '@wordpress/e2e-test-utils-playwright';

/** createNewPost's preference dispatch intermittently throws RangeError. */
export const newPost = async (admin: Admin, title: string) => {
	await admin.visitAdminPage(
		'post-new.php',
		new URLSearchParams({ post_title: title }).toString(),
	);
};
