import {
    BaseControl,
    ToggleControl,
    ExternalLink,
    Button,
    TextControl,
    Modal,
} from '@wordpress/components';
import { useState } from '@wordpress/element';
import { applyFilters } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';
import classNames from 'classnames';
import { useSettingsStore } from '../../state/settings';
import {
    getCustomThemes,
    getNormalThemes,
    getPriorityThemes,
} from '../../util/themes';

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
                    <div className="-mt-4 mb-4 flex flex-wrap gap-2">
                        <Button
                            data-cy="manage-themes"
                            variant="secondary"
                            isSmall
                            onClick={openModal}>
                            {__('Manage themes', 'code-block-pro')}
                        </Button>
                        {
                            applyFilters(
                                'blocks.codeBlockPro.themesPanelButtons',
                                null,
                            ) as JSX.Element | null
                        }
                    </div>
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
    const priorityThemes = getPriorityThemes();
    return (
        <Modal
            title={__('Manage Themes', 'code-block-pro')}
            onRequestClose={closeModal}
            className="code-block-pro-editor">
            <div
                id="code-block-pro-theme-manager"
                className="flex flex-col gap-4 mt-2">
                {priorityThemes?.length > 0 ? (
                    <div className="flex flex-col gap-4 bg-gray-100 p-4">
                        <h2 className="m-0 my-2 text-center">
                            {__('Priority themes', 'code-block-pro')}
                        </h2>
                        <div className="md:grid gap-3 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {[...getCustomThemes(), ...priorityThemes].map(
                                ({ name, slug }) => (
                                    <ToggleControl
                                        key={slug}
                                        checked={!hiddenThemes.includes(slug)}
                                        label={name}
                                        onChange={() => toggleHiddenTheme(slug)}
                                    />
                                ),
                            )}
                        </div>
                    </div>
                ) : null}
                <div
                    className={classNames(
                        'md:grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3',
                        {
                            'p-4': priorityThemes?.length > 0,
                        },
                    )}>
                    {getNormalThemes().map(({ name, slug }) => (
                        <ToggleControl
                            key={slug}
                            checked={!hiddenThemes.includes(slug)}
                            label={name}
                            onChange={() => toggleHiddenTheme(slug)}
                        />
                    ))}
                </div>
                {priorityThemes?.length > 0 ? null : (
                    <div className="font-semibold text-base">
                        <ExternalLink href="https://code-block-pro.com/themes?utm_campaign=notice&utm_source=manage-themes">
                            {__('Get 25+ more themes here', 'code-block-pro')}
                        </ExternalLink>
                    </div>
                )}
            </div>
        </Modal>
    );
};
