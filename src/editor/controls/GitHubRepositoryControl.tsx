import { BaseControl, Button, TextControl, } from '@wordpress/components';
import { useEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useRemoteCodeFetching } from "../../hooks/useRemoteCodeFetching";
import { extractLineNumbers, isValidUrl } from "../../util/urls";

interface GitHubRepositoryControlProps {
    remoteCodeRepositoryUrl: string;
    setAttributes: (attributes: { [key: string]: any }) => void;
}

export const GitHubRepositoryControl = ({
    remoteCodeRepositoryUrl,
    setAttributes,
}: GitHubRepositoryControlProps) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const { code, loading, error, mutate } = useRemoteCodeFetching(remoteCodeRepositoryUrl);

    // Determines line highlighting from the URL
    useEffect(() => {
        if (remoteCodeRepositoryUrl.indexOf('#L')) {
            const lineNumbers = extractLineNumbers(remoteCodeRepositoryUrl);

            if (lineNumbers) {
                setAttributes({
                    enableHighlighting: true,
                    lineHighlights: `[${lineNumbers.startLine},${lineNumbers.endLine}]`
                });
            } else {
                setAttributes({ enableHighlighting: false, lineHighlights: '' });
            }
        }
    }, [remoteCodeRepositoryUrl]);

    // Sets the code to the remotely fetched code
    useEffect(() => {
        if (loading || error || !code) return;

        setAttributes({ code });
    }, [code, loading, error]);

    return (
        <BaseControl id="code-block-pro-remote-repository">
            <TextControl
                ref={inputRef}
                spellCheck={false}
                autoComplete="off"
                type="text"
                data-cy="github-repository-link"
                label={__('Github', 'code-block-pro')}
                help={
                    error ?
                        <p style={{ color: 'red'}}>{__(error, 'code-block-pro')}</p> :
                        <p>{__('Supports GitHub file links and Gists.', 'code-block-pro')}</p>
                }
                value={remoteCodeRepositoryUrl}
                onChange={(value) => setAttributes({ remoteCodeRepositoryUrl: value })}
            />
            {isValidUrl(remoteCodeRepositoryUrl) && (
                <Button
                    data-cy="manage-themes"
                    variant="secondary"
                    isSmall
                    onClick={() => mutate(remoteCodeRepositoryUrl)}>
                    {__('Save', 'code-block-pro')}
                </Button>
            )}
        </BaseControl>
    );
};
