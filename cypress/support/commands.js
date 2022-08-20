import { BLOCK_CONTAINER } from '../constants';
import {
    addBlock,
    closeWelcomeGuide,
    openBlockInserter,
    closeBlockInserter,
    saveDraft,
    setPostContent,
    wpDataSelect,
} from './gutenberg';
import { login, logout } from './login-logout';
import {
    visitPageEditor,
    visitAdminPage,
    visitToLoginPage,
} from './navigate-pages';
import { installPlugin, uninstallPlugin } from './plugins';

// Port more commands from WP here:
// https://github.com/WordPress/gutenberg/tree/trunk/packages/e2e-test-utils/src

// Getting around
Cypress.Commands.add('visitLoginPage', (query) => visitToLoginPage(query));
Cypress.Commands.add('visitAdminPage', (path, query) =>
    visitAdminPage(path, query),
);
Cypress.Commands.add('visitNewPageEditor', (query, skipWelcomeGuide) =>
    visitPageEditor(query, skipWelcomeGuide),
);

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
Cypress.Commands.add('addBlock', (slug) => addBlock(slug));
Cypress.Commands.add('setPostContent', (content) => setPostContent(content));
Cypress.Commands.add('getPostContent', (addon = '') => {
    return cy.get(`${BLOCK_CONTAINER} ${addon}`);
});
Cypress.Commands.add('getCurrentPostObject', () => {
    cy.wpDataSelect('core/editor', 'getCurrentPost');
});
Cypress.Commands.add('wpDataSelect', (store, selector, ...parameters) =>
    wpDataSelect(store, selector, ...parameters),
);

// Manage plugins
Cypress.Commands.add('installPlugin', (slug) => installPlugin(slug));
Cypress.Commands.add('uninstallPlugin', (slug) => uninstallPlugin(slug));
