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
import { useLanguageStore } from '../../state/language';
import { getMainAlias } from '../../util/languages';

export const BlockFilter = (
    // eslint-disable-next-line
    CurrentMenuItems: any,
    // eslint-disable-next-line
    props: any,
) => {
    // eslint-disable-next-line
    const { attributes, clientId } = props;
    const { previousLanguage } = useLanguageStore();
    const showMenu = useSelect(
        (select) => {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore-next-line - getBlock not added as a type?
            const currentBlock = select(blockEditorStore).getBlock(clientId);
            return ['core/code', 'syntaxhighlighter/code'].includes(
                currentBlock.name,
            );
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

    const convertBlock = () => {
        const blockData = createBlock(blockConfig.name, {
            // eslint-disable-next-line
            code: attributes?.content ? decode(attributes.content) : undefined,
            // eslint-disable-next-line
            language: getMainAlias(attributes?.language) ?? previousLanguage,
        });
        replaceBlock(clientId, [blockData]);
    };

    if (!showMenu) {
        return <CurrentMenuItems {...props} />;
    }

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
