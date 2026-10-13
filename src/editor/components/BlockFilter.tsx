import {
	BlockControls,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';
import { ToolbarButton, ToolbarGroup } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import blockConfig from '../../block.json';
import { blockIcon } from '../../icons';
import { useLanguageStore } from '../../state/language';
import { getMainAlias } from '../../util/languages';

export const BlockFilter = (CurrentMenuItems: any, props: any) => {
	const { attributes, clientId } = props;
	const { previousLanguage } = useLanguageStore();
	const showMenu = useSelect(
		(select) => {
			const currentBlock = select(blockEditorStore).getBlock(clientId);
			return ['core/code', 'syntaxhighlighter/code'].includes(
				currentBlock?.name ?? '',
			);
		},
		[clientId],
	);

	const { replaceBlock } = useDispatch(blockEditorStore);

	const decode = (value: string) => {
		const txt = document.createElement('textarea');
		txt.innerHTML = value;
		return txt.value;
	};

	const convertBlock = () => {
		const blockData = createBlock(blockConfig.name, {
			code: attributes?.content ? decode(attributes.content) : undefined,
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
