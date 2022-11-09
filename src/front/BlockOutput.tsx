import { RichText, useBlockProps as blockProps } from '@wordpress/block-editor';
import { HeaderType } from '../editor/components/HeaderSelect';
import { Attributes } from '../types';
import { fontFamilyLong, maybeClamp } from '../util/fonts';
import { CopyButton } from './CopyButton';
import './style.css';

// todo:
// - add inline styling on code or pre only if the setting is there (should avoid block invalidation)
// - in editor, Calculate the line width of the last line number for the overlay padding (left only?)
// - get dynamic color of the line numbers (in attributes already)

export const BlockOutput = ({ attributes }: { attributes: Attributes }) => (
    <div
        {...blockProps.save({
            className: attributes.disablePadding
                ? 'padding-disabled'
                : undefined,
        })}
        data-code-block-pro-font-family={attributes.fontFamily}
        style={{
            fontSize: maybeClamp(attributes.fontSize, attributes.clampFonts),
            // Tiny check to avoid block invalidation error
            fontFamily: fontFamilyLong(attributes.fontFamily),
            lineHeight: maybeClamp(
                attributes.lineHeight,
                attributes.clampFonts,
            ),
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
