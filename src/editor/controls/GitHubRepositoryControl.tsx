import {BaseControl, Button, TextControl,} from '@wordpress/components';
import {useRef} from '@wordpress/element';
import {__} from '@wordpress/i18n';
import {useRemoteCodeFetching} from "../../hooks/useRemoteCodeFetching";
import {extractLineNumbers, isValidUrl} from "../../util/urls";

interface GitHubRepositoryControlProps {
    value: string;
    onChange: (value: string) => void;
    onCodeFetched: (data: any) => void;
}

export const GitHubRepositoryControl = ({value, onChange, onCodeFetched}: GitHubRepositoryControlProps) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const { data, error, mutate } = useRemoteCodeFetching(value);

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
                    'The link to your file. Supports GitHub links and gists.',
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
