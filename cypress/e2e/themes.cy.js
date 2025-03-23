import themes from '../../src/defaultThemes.json';
import { MORE_THEMES_URL } from '../constants';

beforeEach(() => {
    cy.resetDatabase();
    cy.loginUser();
    cy.visitNewPageEditor();
    cy.addBlock('kevinbatdorf/code-block-pro');
    cy.findBlock('code-block-pro').should('exist');

    cy.focusBlock('code-block-pro', 'textarea');
    cy.findBlock('code-block-pro', 'textarea').should('have.focus');
});
afterEach(() => {
    cy.saveDraft(); // so we can leave without an alert
    cy.logoutUser();
});
context('Theme checks', () => {
    it('Renders properly when switching themes', () => {
        // Nord is the default
        cy.addCode('const foo = "bar";');
        cy.setTheme('nord');
        cy.findBlock('code-block-pro', 'pre')
            .invoke('html')
            .should('contain', '<span style="color: #81A1C1">const</span>');

        cy.setTheme('dracula');
        cy.findBlock('code-block-pro', 'pre')
            .invoke('html')
            .should('contain', '<span style="color: #FF79C6">const</span>');

        cy.setTheme('rose-pine-dawn');
        cy.findBlock('code-block-pro', 'pre')
            .invoke('html')
            .should('contain', '<span style="color: #286983">const</span>');

        cy.setTheme('poimandres');
        cy.findBlock('code-block-pro')
            .invoke('html')
            .should('contain', '<span style="color: #91B4D5">const</span>');
    });

    it('Themes can be disabled and hidden from view', () => {
        cy.openSideBarPanel('Theme');
        cy.get('div[aria-label="Editor settings"] button')
            .contains('Theme')
            .parents('.editor-sidebar')
            .scrollTo('bottom');
        cy.get('#code-block-pro-theme-nord').should('exist');
        cy.get('[data-cy="manage-themes"]').should('exist').click();
        cy.get('.components-modal__header-heading').should(
            'have.text',
            'Manage Themes',
        );
        cy.get('#code-block-pro-theme-manager label').contains('Nord').click();
        cy.get('.code-block-pro-editor [aria-label^="Close"]').click();
        cy.get('#code-block-pro-theme-nord').should('not.exist');
    });

    it('Themes can be filtered via search', () => {
        cy.openSideBarPanel('Theme');
        cy.get('#code-block-pro-theme-monokai').should('exist');
        cy.get('#code-block-pro-search-themes').type('monokai');
        cy.get('#code-block-pro-theme-monokai').should('exist');
        cy.get('#code-block-pro-theme-dracula').should('not.exist');
    });

    it('Themes CTA shows twice in panel and once in modal', () => {
        cy.openSideBarPanel('Theme');
        cy.get(`[href^="${MORE_THEMES_URL}"]`).should('have.length', 2);
        cy.get('[data-cy="manage-themes"]').should('exist').click();
        cy.get(`[href^="${MORE_THEMES_URL}"]`).should('exist');
        cy.get('.code-block-pro-editor [aria-label^="Close"]').click();
    });

    it('Theme CTA "more themes" link can be removed', () => {
        cy.window().then((win) => {
            win.wp.hooks.addFilter(
                'blocks.codeBlockPro.themes',
                'testing-testing',
                () => ({ nord: { name: 'Nord', priority: true } }),
            );
            cy.openSideBarPanel('Theme');
            cy.get(`[href^="${MORE_THEMES_URL}"]`).should('not.exist');
            cy.get('[data-cy="manage-themes"]').should('exist').click();
            cy.get(`[href^="${MORE_THEMES_URL}"]`).should('not.exist');
            cy.get('.code-block-pro-editor [aria-label^="Close"]').click();
        });
    });

    it('Themes render properly', () => {
        Object.keys(themes)
            .sort(() => Math.random() - 0.5)
            .slice(0, 1)
            .forEach((theme) => {
                cy.setTheme(theme);
                cy.get(`#code-block-pro-theme-${theme}`)
                    .should('exist')
                    .should('not.have.text', 'Loading...')
                    .should('not.have.text', 'ssembly');
            });
    });
});
