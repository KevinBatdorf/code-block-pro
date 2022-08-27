import {
    store as blockEditorStore,
    BlockControls,
} from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';
import { ToolbarGroup, ToolbarButton } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import blockConfig from '../../block.json';
import { blockIcon } from '../../icons';

export const BlockFilter = (
    // eslint-disable-next-line
    CurrentMenuItems: any,
    // eslint-disable-next-line
    props: any,
) => {
    // eslint-disable-next-line
    const { attributes, clientId } = props;
    const showMenu = useSelect(
        (select) => {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore-next-line - getBlock not added as a type?
            const currentBlock = select(blockEditorStore).getBlock(clientId);
            return ['core/code'].includes(currentBlock.name);
        },
        [clientId],
    );

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore-next-line - replaceBlock not added as a type?
    const { replaceBlock } = useDispatch(blockEditorStore);

    const decode = (value: string) => {
        const txt = document.createElement('textarea');
        txt.innerHTML = value;
        return txt.value;
    };

    if (!showMenu) {
        return <CurrentMenuItems {...props} />;
    }
    const convertBlock = () => {
        const blockData = createBlock(blockConfig.name, {
            // eslint-disable-next-line
            code: attributes?.content ? decode(attributes.content) : '',
        });
        replaceBlock(clientId, [blockData]);
    };
    return (
        <>
            {CurrentMenuItems && <CurrentMenuItems {...props} />}
            <BlockControls>
                <ToolbarGroup>
                    <ToolbarButton
                        icon={blockIcon}
                        label={__('Convert to Code Pro', 'code-block-pro')}
                        onClick={convertBlock}
                    />
                </ToolbarGroup>
            </BlockControls>
        </>
    );
};
