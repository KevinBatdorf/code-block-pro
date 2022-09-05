import { BLOCK_CONTAINER } from '../constants';
import {
    addBlock,
    closeWelcomeGuide,
    openBlockInserter,
    closeBlockInserter,
    openBlockSettingsSideBar,
    openThemesPanel,
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
Cypress.Commands.add('openBlockSettingsSideBar', () =>
    openBlockSettingsSideBar(),
);
Cypress.Commands.add('openThemesPanel', () => openThemesPanel());
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

// Manage plugins
Cypress.Commands.add('installPlugin', (slug) => installPlugin(slug));
Cypress.Commands.add('uninstallPlugin', (slug) => uninstallPlugin(slug));

// Language
Cypress.Commands.add('setLanguage', (language) => {
    cy.openBlockSettingsSideBar();
    cy.get('[data-cy-cbp="language-select"]').select(language);
    cy.get('[data-cy-cbp="language-select"]')
        .invoke('val')
        .should('eq', language);
});
Cypress.Commands.add('setTheme', (theme) => {
    cy.openBlockSettingsSideBar();
    cy.openThemesPanel();
    cy.get('div[aria-label="Editor settings"] button')
        .contains('Themes')
        .parents('.interface-interface-skeleton__sidebar')
        .scrollTo('bottom');
    cy.get(`#code-block-pro-theme-${theme}`).should('exist');
    cy.get(`#code-block-pro-theme-${theme}`).click();
});
Cypress.Commands.add('addCode', (code) => {
    cy.focusBlock('code-block-pro', 'textarea');
    cy.get('.wp-block[class$="code-block-pro"] textarea')
        .should('have.focus')
        .type(code);
    cy.get('.wp-block[class$="code-block-pro"] textarea').clear().type(code);
    cy.get('.wp-block[class$="code-block-pro"] textarea').should(
        'have.value',
        code,
    );
});
