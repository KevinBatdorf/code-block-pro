import {BaseControl, Button, TextControl,} from '@wordpress/components';
import {useRef} from '@wordpress/element';
import {__} from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import useSWR, { mutate } from "swr";

interface GitHubRepositoryControlProps {
    value: string;
    onChange: (value: string) => void;
    onCodeFetched: (data: any) => void;
}

const fetcher = async (url: string) => {
    const response = await apiFetch({
        path: `code-block-pro/v1/code?url=${encodeURIComponent(url)}`,
        method: 'GET',
    });

    return response.code;
};

export const GitHubRepositoryControl = ({value, onChange, onCodeFetched}: GitHubRepositoryControlProps) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const { data, error } = useSWR(isValidUrl(value) ? value : null, fetcher);

    if (data && !error) {
        if (value.indexOf("#L")) {
            onCodeFetched({ code: data, lineNumbers: extractLineNumbers(value) });
        } else {
            onCodeFetched({ code: data });
        }
    }

    if (isValidUrl(value)) {
        inputRef.current?.classList.remove('cbp-input-error');
    } else {
        inputRef.current?.classList.add('cbp-input-error');
    }

    return (
        <BaseControl id="code-block-pro-remote-repository">
            <TextControl
                ref={inputRef}
                spellCheck={false}
                autoComplete="off"
                type="text"
                data-cy="github-repository-link"
                label={__('Github Repository Link', 'code-block-pro')}
                help={__(
                    'The link to your file. Supports github.com links, gists, and raw content links.',
                    'code-block-pro',
                )}
                value={value}
                onChange={onChange}
            />
            {isValidUrl(value) && (
                <Button
                    data-cy="manage-themes"
                    variant="secondary"
                    isSmall
                    onClick={() => mutate(value)}>
                    {__('Fetch Code', 'code-block-pro')}
                </Button>
            )}
        </BaseControl>
    );
};

function isValidUrl(str: string) {
    try {
        const url = new URL(str);

        return url.host === 'raw.githubusercontent.com' ||
            url.host === 'gist.githubusercontent.com' ||
            url.host === 'github.com';
    } catch (e) {
        return false;
    }
}

function extractLineNumbers(url) {
    const hashIndex = url.indexOf("#L");
    if (hashIndex === -1) {
        return null;
    }

    const strAfterHash = url.substring(hashIndex + 1);
    const strSplitByDash = strAfterHash.split('-');
    const lineNumbers = strSplitByDash.map(getLineNumberFromToken);

    const isFirstNumberValid = lineNumbers[0] > 0;
    const isSecondNumberValid = lineNumbers[1] > 0;
    if (!isFirstNumberValid) {
        return null;
    }

    return {
        startLine: lineNumbers[0],
        endLine: isSecondNumberValid ? lineNumbers[1] : lineNumbers[0],
    };
}

function getLineNumberFromToken(token: string) {
    const splitByColumn = token.split('C');
    const lineNumber = splitByColumn[0].substring(1);

    return parseInt(lineNumber);
}

async function fetchFile(url: string) {
    const response = await apiFetch({
        path: `code-block-pro/v1/code?url=${encodeURIComponent(url)}`,
        method: 'GET',
    });

    return response.code;
}
