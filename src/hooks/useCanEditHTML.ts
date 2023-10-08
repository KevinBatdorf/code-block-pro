import useSWRImmutable from 'swr/immutable';
import apiFetch from '@wordpress/api-fetch';

const fetcher = (url: string) => apiFetch({ path: url });

export const useCanEditHTML = () => {
    const { data } = useSWRImmutable(
        '/code-block-pro/v1/can-save-html',
        fetcher,
    );
    return data;
};
