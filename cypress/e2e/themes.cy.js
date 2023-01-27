import themes from '../../src/defaultThemes.json';

beforeEach(() => {
    cy.resetDatabase();
    cy.loginUser();
    cy.visitNewPageEditor();
    cy.addBlock('kevinbatdorf/code-block-pro');
    cy.getPostContent('.wp-block[class$="code-block-pro"]').should('exist');

    cy.focusBlock('code-block-pro', 'textarea');
    cy.get('.wp-block[class$="code-block-pro"] textarea').should('have.focus');
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
        cy.getPostContent('.wp-block[class$="code-block-pro"] pre')
            .invoke('html')
            .should('contain', '<span style="color: #81A1C1">const</span>');

        cy.setTheme('dracula');
        cy.getPostContent('.wp-block[class$="code-block-pro"] pre')
            .invoke('html')
            .should('contain', '<span style="color: #FF79C6">const</span>');

        cy.setTheme('rose-pine-dawn');
        cy.getPostContent('.wp-block[class$="code-block-pro"] pre')
            .invoke('html')
            .should('contain', '<span style="color: #286983">const</span>');

        cy.setTheme('poimandres');
        cy.getPostContent('.wp-block[class$="code-block-pro"]')
            .invoke('html')
            .should('contain', '<span style="color: #91B4D5">const</span>');
    });

    it('Themes can be disabled and hidden from view', () => {
        cy.openSideBarPanel('Themes');
        cy.get('div[aria-label="Editor settings"] button')
            .contains('Themes')
            .parents('.interface-interface-skeleton__sidebar')
            .scrollTo('bottom');
        cy.get('#code-block-pro-theme-nord').should('exist');
        cy.get('[data-cy="manage-themes"]').should('exist').click();
        cy.get('.components-modal__header-heading').should(
            'have.text',
            'Manage Themes',
        );
        cy.get('#code-block-pro-theme-manager label').contains('Nord').click();
        cy.get('[aria-label="Close dialog"]').click();
        cy.get('#code-block-pro-theme-nord').should('not.exist');
    });

    it('Themes can be filtered via search', () => {
        cy.openSideBarPanel('Themes');
        cy.get('#code-block-pro-theme-monokai').should('exist');
        cy.get('#code-block-pro-search-themes').type('monokai');
        cy.get('#code-block-pro-theme-monokai').should('exist');
        cy.get('#code-block-pro-theme-dracula').should('not.exist');
    });

    it('Themes render properly', () => {
        cy.mockIntersectionObserver();
        cy.openSideBarPanel('Themes');
        Object.keys(themes)
            .sort(() => Math.random() - 0.5)
            .forEach((theme) => {
                cy.setTheme(theme);
                cy.get(`#code-block-pro-theme-${theme}`)
                    .should('exist')
                    .should('not.have.text', 'Loading...')
                    .should('not.have.text', 'ssembly');
            });
    });
});
