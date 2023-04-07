import { BLOCK_CONTAINER } from '../constants';
import { addCode } from './features/code';
import { setFooter } from './features/footers';
import { setHeader } from './features/headers';
import { setHeightDesign, enableMaxHeight } from './features/height';
import { setLanguage } from './features/language';
import { setTheme } from './features/theme';
import {
    addBlock,
    closeWelcomeGuide,
    openBlockInserter,
    closeBlockInserter,
    openBlockSettingsSideBar,
    openSideBarPanel,
    saveDraft,
    setPostContent,
    wpDataSelect,
    previewCurrentPage,
} from './gutenberg';
import { mockIntersectionObserver } from './helpers';
import { login, logout } from './login-logout';
import {
    visitPageEditor,
    visitPostEditor,
    visitAdminPage,
    visitToLoginPage,
} from './navigate-pages';
import { installPlugin, uninstallPlugin } from './plugins';
import { resetDatabase, updateUserRole } from './wp-cli';

// Port more commands from WP here:
// https://github.com/WordPress/gutenberg/tree/trunk/packages/e2e-test-utils/src

// Getting around
Cypress.Commands.add('visitLoginPage', (query) => visitToLoginPage(query));
Cypress.Commands.add('visitAdminPage', (path, query) =>
    visitAdminPage(path, query),
);
Cypress.Commands.add('visitNewPageEditor', (query) => visitPageEditor(query));
Cypress.Commands.add('visitNewPostEditor', (query) => visitPostEditor(query));

// Login logout
Cypress.Commands.add('loginUser', (username, password) =>
    login(username, password),
);
Cypress.Commands.add('logoutUser', () => logout());

// Gutenberg
Cypress.Commands.add('closeWelcomeGuide', () => closeWelcomeGuide());
Cypress.Commands.add('saveDraft', () => saveDraft());
Cypress.Commands.add('openBlockInserter', () => openBlockInserter());
Cypress.Commands.add('closeBlockInserter', () => closeBlockInserter());
Cypress.Commands.add('openBlockSettingsSideBar', () =>
    openBlockSettingsSideBar(),
);
Cypress.Commands.add('openSideBarPanel', (label) => openSideBarPanel(label));
Cypress.Commands.add('addBlock', (slug) => addBlock(slug));
Cypress.Commands.add('setPostContent', (content) => setPostContent(content));
Cypress.Commands.add('getPostContent', (addon = '') => {
    return cy.get(`${BLOCK_CONTAINER} ${addon}`);
});
Cypress.Commands.add('focusBlock', (blockName, addon = '') => {
    cy.get(
        `${BLOCK_CONTAINER} .wp-block[class$="${blockName}"] ${addon}`,
    ).click();
});
Cypress.Commands.add('getCurrentPostObject', () => {
    cy.wpDataSelect('core/editor', 'getCurrentPost');
});
Cypress.Commands.add('wpDataSelect', (store, selector, ...parameters) =>
    wpDataSelect(store, selector, ...parameters),
);
Cypress.Commands.add('previewCurrentPage', () => previewCurrentPage());

// Mocks
Cypress.Commands.add('mockIntersectionObserver', () =>
    mockIntersectionObserver(),
);

// Server
Cypress.Commands.add('resetDatabase', () => resetDatabase());
Cypress.Commands.add('updateUserRole', (cap) => updateUserRole(cap));

// Manage plugins
Cypress.Commands.add('installPlugin', (slug) => installPlugin(slug));
Cypress.Commands.add('uninstallPlugin', (slug) => uninstallPlugin(slug));

// Features
Cypress.Commands.add('setLanguage', (language) => setLanguage(language));
Cypress.Commands.add('setTheme', (theme) => setTheme(theme));
Cypress.Commands.add('addCode', (code, opts) => addCode(code, opts));
Cypress.Commands.add('setHeader', (header) => setHeader(header));
Cypress.Commands.add('setFooter', (footer) => setFooter(footer));
Cypress.Commands.add('setHeightDesign', (footer) => setHeightDesign(footer));
Cypress.Commands.add('enableMaxHeight', (footer) => enableMaxHeight(footer));
