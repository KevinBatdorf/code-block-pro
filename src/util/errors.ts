import { subscribe } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

export const debounce = <T extends (...args: unknown[]) => void>(
    fn: T,
    delay: number,
) => {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    return (...args: Parameters<T>) => {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => fn(...args), delay);
    };
};

export const handleValidationErrors = () => {
    const debouncedUnsub = debounce(() => unsub(), 5000);
    const unsub = subscribe(() => {
        const editor = document.querySelector(
            '#editor, iframe[name="editor-canvas"]',
        );
        const blockError = editor?.querySelector(
            '.wp-block-kevinbatdorf-code-block-pro .block-editor-warning',
        );
        if (blockError) unsub();
        const message = blockError?.querySelector(
            '.block-editor-warning__message',
        );
        if (!message) return;
        message.textContent = __(
            'This block has been updated. Press update to refresh.',
            'code-block-pro',
        );
        const button = blockError?.querySelector(
            '.block-editor-warning__action button',
        );
        if (!button) return;
        button.textContent = __('Update', 'code-block-pro');

        debouncedUnsub();
    });
};
