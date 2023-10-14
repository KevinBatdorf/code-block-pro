import apiFetch from '@wordpress/api-fetch';
import useSWR, { mutate } from "swr";
import { isValidUrl } from "../util/urls";

const fetcher = async (url: string) => {
    const response = await apiFetch({
        path: `code-block-pro/v1/code?url=${ encodeURIComponent(url) }`,
        method: 'GET',
    });

    return response.code;
};

export function useRemoteCodeFetching(url: string) {
    const { data, isLoading, error } = useSWR(isValidUrl(url) ? url : null, fetcher);

    return { code: data, isLoading, error, mutate };
}
