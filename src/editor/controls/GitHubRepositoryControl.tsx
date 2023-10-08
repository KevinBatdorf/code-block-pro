import {BaseControl, Button, TextControl,} from '@wordpress/components';
import {useEffect, useRef} from '@wordpress/element';
import {__} from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';

interface GitHubRepositoryControlProps {
    value: string;
    onChange: (value: string) => void;
}

export const GitHubRepositoryControl = ({value, onChange, onCodeFetched}: GitHubRepositoryControlProps) => {
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isValidUrl(value)) {
            fetchFile(value).then(onCodeFetched);

            inputRef.current
                ?.querySelector('input')
                ?.classList.remove('cbp-input-error');
        } else {
            inputRef.current
                ?.querySelector('input')
                ?.classList.add('cbp-input-error');
        }
    }, [value]);
    return (
        <BaseControl id="code-block-pro-show-highlighting">
            <div ref={inputRef}>
                <TextControl
                    spellCheck={false}
                    autoComplete="off"
                    type="text"
                    data-cy="github-repository-link"
                    label={__('Github Repository Link', 'code-block-pro')}
                    help={__(
                        'The link to your file. Supports raw.githubusercontent.com links.',
                        'code-block-pro',
                    )}
                    value={value}
                    onChange={onChange}
                />
            </div>
            {
                isValidUrl(value) ?
                    <Button
                        data-cy="manage-themes"
                        variant="secondary"
                        isSmall
                        onClick={() => fetchFile(value).then(onCodeFetched)}>
                        {__('Fetch Code', 'code-block-pro')}
                    </Button> :
                    null
            }
        </BaseControl>
    );
};

function isValidUrl(str: string) {
    try {
        const url = new URL(str);

        if (url.host !== 'raw.githubusercontent.com') {
            return false;
        }
    } catch (e) {
        return false;
    }

    return true;
}

async function fetchFile(url: string) {
    const response = await apiFetch({
        path: 'code-block-pro/v1/code',
        method: 'POST',
        data: {url},
    });

    return response.code;
}
