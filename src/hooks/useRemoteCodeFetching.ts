import apiFetch from '@wordpress/api-fetch';
import useSWR, { mutate } from "swr";
import { isValidUrl } from "../util/urls";

const fetcher = async (url: string) => {
    const response = await apiFetch({
        path: `code-block-pro/v1/code?url=${encodeURIComponent(url)}`,
        method: 'GET',
    });

    return response.code;
};

export function useRemoteCodeFetching(url: string) {
    const { data, isLoading, error } = useSWR(isValidUrl(url) ? url : null, fetcher);

    let errorMessage = null;
    if (!isValidUrl(url)) {
        errorMessage = 'Please enter a valid URL';
    } else if (error) {
        errorMessage = error.message;
    }


    return { code: data, loading: isLoading, error: errorMessage, mutate };
}
