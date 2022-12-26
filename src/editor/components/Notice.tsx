import { __ } from '@wordpress/i18n';
import { useSettingsStore, useSettingsStoreReady } from '../../state/settings';

export const Notice = ({
    message,
    callback,
    href,
    seenKey,
}: {
    message: string;
    callback?: () => void;
    href: string;
    seenKey: string;
}) => {
    const { seenNotices, setSeenNotice } = useSettingsStore();
    const ready = useSettingsStoreReady();

    return null;
    if (!ready) return null;
    if (seenNotices.includes(seenKey)) return null;

    return (
        <div className="relative bg-gray-100 hover:bg-blue-100">
            <button
                className="absolute top-0 right-0 border-0 mt-1 mr-2 leading-none p-0 bg-transparent cursor-pointer"
                title={__('Dismiss', 'code-block-pro')}
                type="button"
                onClick={() => setSeenNotice(seenKey)}>
                x
            </button>

            <a
                className="block p-4 underline caret-pink-600 m-0 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-teal-500 text-left text-base leading-5 font-medium cursor-pointer border-0"
                href={href}
                target="_blank"
                rel="noreferrer"
                title={__('Press here', 'code-block-pro')}
                onClick={callback}>
                {message}
            </a>
        </div>
    );
};
