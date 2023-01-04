import {
    BaseControl,
    ToggleControl,
    Button,
    TextControl,
    Modal,
} from '@wordpress/components';
import { useState } from '@wordpress/element';
import { applyFilters } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';
import defaultThemes from '../../defaultThemes.json';
import { useSettingsStore } from '../../state/settings';

export const ThemeFilter = ({
    search,
    setSearch,
}: {
    search: string;
    setSearch: (search: string) => void;
}) => {
    const [modalOpen, setModalOpen] = useState<boolean>(false);
    const closeModal = () => setModalOpen(false);
    const openModal = () => setModalOpen(true);
    return (
        <>
            <div className="code-block-pro-editor">
                <BaseControl id="code-block-pro-filter-themes">
                    <TextControl
                        id="code-block-pro-search-themes"
                        spellCheck={false}
                        autoComplete="off"
                        label={__('Search themes', 'code-block-pro')}
                        onChange={setSearch}
                        value={search}
                    />
                    <Button
                        className="block -mt-4 mb-4"
                        data-cy="manage-themes"
                        variant="link"
                        onClick={openModal}>
                        {__('Manage themes', 'code-block-pro')}
                    </Button>
                </BaseControl>
            </div>
            {modalOpen && <ThemeVisibilitySelector closeModal={closeModal} />}
        </>
    );
};

const ThemeVisibilitySelector = ({
    closeModal,
}: {
    closeModal: () => void;
}) => {
    const { hiddenThemes, toggleHiddenTheme } = useSettingsStore();
    const themes = applyFilters(
        'blocks.codeBlockPro.themes',
        defaultThemes,
    ) as Record<string, { name: string; priority?: boolean }>;
    const themesNormalized = Object.entries(themes).map(
        ([slug, { name, priority }]) => ({ name, slug, priority }),
    );
    const themesPriority = themesNormalized.filter(({ priority }) => priority);
    const themesNormal = themesNormalized.filter(({ priority }) => !priority);
    return (
        <Modal
            title={__('Manage Themes', 'code-block-pro')}
            onRequestClose={closeModal}
            className="code-block-pro-editor">
            <div
                id="code-block-pro-theme-manager"
                className="flex flex-col gap-4">
                {themesPriority?.length > 0 ? (
                    <div className="flex flex-col gap-4 bg-gray-100 p-4">
                        <h2 className="m-0 my-2 text-center">
                            {__('Priority themes', 'code-block-pro')}
                        </h2>
                        <div className="md:grid gap-3 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {themesPriority.map(({ name, slug }) => (
                                <ToggleControl
                                    key={slug}
                                    checked={!hiddenThemes.includes(slug)}
                                    label={name}
                                    onChange={() => toggleHiddenTheme(slug)}
                                />
                            ))}
                        </div>
                    </div>
                ) : null}
                <div className="md:grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 p-4">
                    {themesNormal.map(({ name, slug }) => (
                        <ToggleControl
                            key={slug}
                            checked={!hiddenThemes.includes(slug)}
                            label={name}
                            onChange={() => toggleHiddenTheme(slug)}
                        />
                    ))}
                </div>
            </div>
        </Modal>
    );
};
