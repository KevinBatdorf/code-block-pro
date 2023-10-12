import apiFetch from '@wordpress/api-fetch';
import useSWRImmutable from 'swr/immutable';

const fetcher = (url: string) => apiFetch<boolean>({ path: url });

export const useCanEditHTML = () => {
    const { data } = useSWRImmutable<boolean>(
        '/code-block-pro/v1/can-save-html',
        fetcher,
    );
    // Consider it true until the request completes
    return data;
};
