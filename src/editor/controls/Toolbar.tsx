import { BlockControls } from '@wordpress/block-editor';
import { ToolbarGroup } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Attributes } from '../../types';

type ToolbarProps = { attributes: Attributes };
export const ToolbarControls = ({ attributes }: ToolbarProps) => {
    return (
        <BlockControls>
            <ToolbarGroup className="code-block-pro-editor">
                <div
                    className="flex justify-center items-center p-1"
                    title={__('Update in sidebar', 'code-block-pro')}>
                    {attributes?.language}
                </div>
            </ToolbarGroup>
        </BlockControls>
    );
};
