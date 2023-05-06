import { InspectorControls } from '@wordpress/block-editor';
import {
    PanelBody,
    TextControl,
    BaseControl,
    SelectControl,
    Button,
    CheckboxControl,
} from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore-next-line - store is not typed
import { store as editPostStore } from '@wordpress/edit-post';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useLanguage } from '../../hooks/useLanguage';
import { useGlobalStore } from '../../state/global';
import { useLanguageStore } from '../../state/language';
import { useThemeStore } from '../../state/theme';
import { AttributesPropsAndSetter } from '../../types';
import { languages } from '../../util/languages';
import {
    FontSizeSelect,
    FontLineHeightSelect,
    FontFamilySelect,
} from '../components/FontSelect';
import { FooterSelect } from '../components/FooterSelect';
import { HeaderSelect } from '../components/HeaderSelect';
import { HeightPanel } from '../components/HeightPanel';
import { ThemesPanel } from '../components/ThemesPanel';
import { MissingPermissionsTip } from '../components/misc/MissingPermissions';
import { BlurControl } from './BlurControl';
import { HighlightingControl } from './HighlightingControl';

export const SidebarControls = ({
    attributes,
    setAttributes,
    canEdit,
}: AttributesPropsAndSetter & { canEdit: boolean }) => {
    const [language, setLanguage] = useLanguage({ attributes, setAttributes });
    const { recentLanguages } = useLanguageStore();
    const { updateThemeHistory } = useThemeStore();
    const { setPreviousSettings, bringAttentionToPanel } = useGlobalStore();
    const { headerType, footerType } = attributes;
    const languagesSorted = new Map(
        Object.entries(languages).sort((a, b) => a[1].localeCompare(b[1])),
    );

    const footersNeedingLinks = ['simpleStringEnd', 'simpleStringStart'];

    const showHeaderTextEdit = ['simpleString'].includes(headerType);
    const showFooterTextEdit = footersNeedingLinks.includes(footerType);
    const showFooterLinkEdit = footersNeedingLinks.includes(footerType);
    const showFooterLinkTargetEdit = footersNeedingLinks.includes(footerType);
    const [bringAttention, setBringAttention] = useState<string | false>(false);
    const { openGeneralSidebar, closeGeneralSidebar } =
        useDispatch(editPostStore);

    useEffect(() => {
        if (!bringAttentionToPanel) return;
        closeGeneralSidebar('edit-post/block').then(() => {
            setBringAttention(bringAttentionToPanel);
            openGeneralSidebar('edit-post/block');
        });
    }, [bringAttentionToPanel, closeGeneralSidebar, openGeneralSidebar]);

    return (
        <InspectorControls>
            {canEdit ? null : <MissingPermissionsTip />}
            <PanelBody
                title={__('Language', 'code-block-pro')}
                initialOpen={bringAttention === 'language-select'}>
                <div className="code-block-pro-editor">
                    <BaseControl id="code-block-pro-language">
                        <SelectControl
                            id="code-block-pro-language"
                            label={__('Code Language', 'code-block-pro')}
                            data-cy-cbp="language-select"
                            value={language}
                            onChange={setLanguage}
                            help={
                                language === 'ansi'
                                    ? __(
                                          'Some code themes may not render ANSI correctly. Control sequences render only on the front.',
                                          'code-block-pro',
                                      )
                                    : null
                            }
                            options={[...languagesSorted.entries()].map(
                                ([value, label]) => ({
                                    label: label.replace(
                                        'ANSI',
                                        'ANSI (experimental)',
                                    ),
                                    value,
                                }),
                            )}
                        />
                        {recentLanguages?.length > 0 ? (
                            <>
                                <span className="mb-2 block">
                                    {__('Recently Used', 'code-block-pro')}
                                </span>
                                <div className="flex gap-1">
                                    {recentLanguages?.map((lang) => (
                                        <Button
                                            key={lang}
                                            className="bg-gray-100 text-black no-underline p-1 px-2 "
                                            variant="link"
                                            onClick={() => setLanguage(lang)}>
                                            {languages[lang] ?? lang}
                                        </Button>
                                    ))}
                                </div>
                            </>
                        ) : null}
                    </BaseControl>
                </div>
            </PanelBody>
            <PanelBody
                title={__('Line Settings', 'code-block-pro')}
                initialOpen={false}>
                <div className="code-block-pro-editor">
                    <BaseControl id="code-block-pro-show-line-numbers">
                        <CheckboxControl
                            data-cy="show-line-numbers"
                            label={__('Line numbers', 'code-block-pro')}
                            help={__(
                                'Enable line numbers and set a starting number.',
                                'code-block-pro',
                            )}
                            checked={attributes.lineNumbers}
                            onChange={(lineNumbers) => {
                                setAttributes({ lineNumbers });
                                updateThemeHistory({
                                    ...attributes,
                                    lineNumbers,
                                });
                            }}
                        />
                        {attributes.lineNumbers && (
                            <BaseControl id="code-block-pro-line-number-start">
                                <TextControl
                                    id="code-block-pro-line-number-start"
                                    spellCheck={false}
                                    autoComplete="off"
                                    label={__('Start from', 'code-block-pro')}
                                    onChange={(startingLineNumber) => {
                                        setAttributes({ startingLineNumber });
                                    }}
                                    value={attributes.startingLineNumber}
                                />
                            </BaseControl>
                        )}
                    </BaseControl>
                    <HighlightingControl
                        attributes={attributes}
                        setAttributes={setAttributes}
                    />
                    <BlurControl
                        attributes={attributes}
                        setAttributes={setAttributes}
                    />
                </div>
            </PanelBody>
            <PanelBody
                title={__('Header Type', 'code-block-pro')}
                initialOpen={false}>
                {showHeaderTextEdit && (
                    <BaseControl id="code-block-pro-header-text">
                        <TextControl
                            id="code-block-pro-header-text"
                            spellCheck={false}
                            autoComplete="off"
                            label={__('Header Text', 'code-block-pro')}
                            placeholder={languages[language]}
                            onChange={(headerString) => {
                                setAttributes({ headerString });
                            }}
                            value={attributes.headerString ?? ''}
                        />
                    </BaseControl>
                )}
                <HeaderSelect
                    attributes={attributes}
                    onClick={(headerType) => {
                        setAttributes({ headerType });
                        updateThemeHistory({ ...attributes, headerType });
                    }}
                />
            </PanelBody>
            <PanelBody
                title={__('Footer Type', 'code-block-pro')}
                initialOpen={false}>
                {showFooterTextEdit && (
                    <BaseControl id="code-block-pro-footer-text">
                        <TextControl
                            id="code-block-pro-footer-text"
                            spellCheck={false}
                            autoComplete="off"
                            label={__('Footer Text', 'code-block-pro')}
                            placeholder={languages[language]}
                            onChange={(footerString) => {
                                setAttributes({ footerString });
                            }}
                            value={attributes.footerString ?? ''}
                        />
                    </BaseControl>
                )}
                {showFooterLinkEdit && (
                    <BaseControl id="code-block-pro-footer-link">
                        <TextControl
                            id="code-block-pro-footer-link"
                            spellCheck={false}
                            type="url"
                            autoComplete="off"
                            label={__('Footer Link', 'code-block-pro')}
                            placeholder="https://example.com"
                            help={__(
                                'Leave blank to disable',
                                'code-block-pro',
                            )}
                            onChange={(footerLink) => {
                                setAttributes({ footerLink });
                            }}
                            value={attributes.footerLink ?? ''}
                        />
                    </BaseControl>
                )}
                {showFooterLinkTargetEdit && (
                    <BaseControl id="code-block-pro-footer-link-target">
                        <CheckboxControl
                            id="code-block-pro-footer-link-target"
                            label={__('Open in new tab?', 'code-block-pro')}
                            checked={attributes.footerLinkTarget}
                            onChange={(footerLinkTarget) => {
                                setAttributes({ footerLinkTarget });
                                updateThemeHistory({
                                    ...attributes,
                                    footerLinkTarget,
                                });
                            }}
                        />
                    </BaseControl>
                )}
                <FooterSelect
                    attributes={attributes}
                    onClick={(footerType) => {
                        setAttributes({ footerType });
                        updateThemeHistory({ ...attributes, footerType });
                    }}
                />
            </PanelBody>
            <ThemesPanel
                bringAttentionToThemes={bringAttention === 'theme-select'}
                attributes={attributes}
                setAttributes={setAttributes}
            />
            <PanelBody
                title={__('Styling', 'code-block-pro')}
                initialOpen={false}>
                <div
                    className="code-block-pro-editor"
                    data-cy="font-size-select">
                    <h2 className="m-0">{__('Font Size', 'code-block-pro')}</h2>
                    <FontSizeSelect
                        value={attributes.fontSize}
                        onChange={(fontSize) => {
                            setAttributes({ fontSize });
                            updateThemeHistory({ ...attributes, fontSize });
                        }}
                    />
                </div>
                <div
                    className="code-block-pro-editor"
                    data-cy="font-line-height-select">
                    <h2 className="m-0">
                        {__('Line Height', 'code-block-pro')}
                    </h2>
                    <FontLineHeightSelect
                        value={attributes.lineHeight}
                        onChange={(lineHeight) => {
                            setAttributes({ lineHeight });
                            updateThemeHistory({
                                ...attributes,
                                lineHeight,
                            });
                        }}
                    />
                </div>
                <div
                    className="code-block-pro-editor"
                    data-cy="font-family-select">
                    <FontFamilySelect
                        value={attributes.fontFamily}
                        onChange={(fontFamily) => {
                            setAttributes({ fontFamily });
                            updateThemeHistory({
                                ...attributes,
                                fontFamily,
                            });
                        }}
                    />
                </div>
                <div className="code-block-pro-editor" data-cy="clamp-fonts">
                    <div className="mt-6">
                        <CheckboxControl
                            label={__('Clamp Values', 'code-block-pro')}
                            help={__(
                                'Check this if your font sizes are unusually large or tiny.',
                                'code-block-pro',
                            )}
                            checked={attributes.clampFonts}
                            onChange={(clampFonts) => {
                                setAttributes({ clampFonts });
                                updateThemeHistory({
                                    ...attributes,
                                    clampFonts,
                                });
                            }}
                        />
                    </div>
                </div>
            </PanelBody>
            <HeightPanel
                attributes={attributes}
                setAttributes={setAttributes}
            />
            <PanelBody
                title={__('Extra Settings', 'code-block-pro')}
                initialOpen={false}>
                <BaseControl id="code-block-pro-show-copy-button">
                    <CheckboxControl
                        data-cy="copy-button"
                        label={__('Copy Button', 'code-block-pro')}
                        help={__(
                            'If checked, users will be able to copy your code snippet to their clipboard.',
                            'code-block-pro',
                        )}
                        checked={attributes.copyButton}
                        onChange={(value) => {
                            setPreviousSettings({ copyButton: value });
                            setAttributes({ copyButton: value });
                        }}
                    />
                </BaseControl>
                <BaseControl id="code-block-pro-disable-padding">
                    <CheckboxControl
                        data-cy="disable-padding"
                        label={__('Disable Padding', 'code-block-pro')}
                        help={__(
                            'This is useful if you pick a theme that matches your background color, and want the code to line up to the edge of your content. You maybe need to add your own padding with CSS.',
                            'code-block-pro',
                        )}
                        checked={attributes.disablePadding}
                        onChange={(disablePadding) => {
                            setAttributes({ disablePadding });
                            updateThemeHistory({
                                ...attributes,
                                disablePadding,
                            });
                        }}
                    />
                </BaseControl>
            </PanelBody>
        </InspectorControls>
    );
};
