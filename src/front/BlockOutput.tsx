import { RichText, useBlockProps as blockProps } from '@wordpress/block-editor';
import { HeaderType } from '../editor/components/HeaderType';
import { Attributes } from '../types';
import { CopyButton } from './CopyButton';
import './style.css';

export const BlockOutput = ({ attributes }: { attributes: Attributes }) => (
    <div
        {...blockProps.save()}
        style={{
            fontSize: attributes.fontSize,
            lineHeight: attributes.lineHeight,
        }}>
        {attributes.code?.length > 0 ? (
            <>
                <HeaderType {...attributes} />
                {attributes.copyButton && (
                    <CopyButton attributes={attributes} />
                )}
                <RichText.Content value={attributes.codeHTML} />
            </>
        ) : null}
    </div>
);
