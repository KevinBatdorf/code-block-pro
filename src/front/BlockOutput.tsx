import { RichText, useBlockProps as blockProps } from '@wordpress/block-editor';
import { HeaderType } from '../editor/components/HeaderType';
import { Attributes } from '../types';
import { CopyButton } from './CopyButton';
import './style.css';

export const BlockOutput = ({ attributes }: { attributes: Attributes }) => (
    <div
        {...blockProps.save()}
        data-code-block-pro-font-family={attributes.fontFamily}
        style={{
            fontSize: attributes.fontSize,
            // Tiny check to avoid block invalidation error
            fontFamily: attributes.fontFamily
                ? [
                      attributes.fontFamily,
                      'ui-monospace',
                      'SFMono-Regular',
                      'Menlo',
                      'Monaco',
                      'Consolas',
                      'monospace',
                  ]
                      .filter(Boolean)
                      .join(',')
                : undefined,
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
