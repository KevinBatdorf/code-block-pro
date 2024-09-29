beforeEach(() => {
    cy.resetDatabase();
    cy.loginUser();
    cy.visitNewPageEditor();
    cy.addBlock('kevinbatdorf/code-block-pro');
    cy.getPostContent('.wp-block[class*="code-block-pro"]').should('exist');

    cy.focusBlock('code-block-pro', 'textarea');
    cy.get('.wp-block[class*="code-block-pro"] textarea').should('have.focus');
});
afterEach(() => {
    cy.saveDraft(); // so we can leave without an alert
    cy.logoutUser();
});
context('Styling', () => {
    it('Font size can be changed', () => {
        cy.openSideBarPanel('Styling');

        cy.getPostContent('.wp-block[class*="code-block-pro"]')
            .invoke('attr', 'style')
            .should('contain', 'font-size: 0.875rem');

        cy.get('[data-cy="font-size-select"] [aria-label="Small"]').should(
            'have.attr',
            'aria-checked',
            'true',
        );
        cy.get('[data-cy="font-size-select"] [aria-label="Normal"]').should(
            'have.attr',
            'aria-checked',
            'false',
        );
        cy.get('[data-cy="font-size-select"] [aria-label="Normal"]').click();
        cy.get('[data-cy="font-size-select"] [aria-label="Normal"]').should(
            'have.attr',
            'aria-checked',
            'true',
        );

        cy.getPostContent('.wp-block[class*="code-block-pro"]')
            .invoke('attr', 'style')
            .should('contain', 'font-size: 1rem');
    });

    it('Line height can be changed', () => {
        cy.openSideBarPanel('Styling');

        cy.getPostContent('.wp-block[class*="code-block-pro"]')
            .invoke('attr', 'style')
            .should('contain', 'line-height: 1.25rem');

        cy.get(
            '[data-cy="font-line-height-select"] [aria-label="Tight"]',
        ).should('have.attr', 'aria-checked', 'true');
        cy.get(
            '[data-cy="font-line-height-select"] [aria-label="Normal"]',
        ).should('have.attr', 'aria-checked', 'false');
        cy.get(
            '[data-cy="font-line-height-select"] [aria-label="Normal"]',
        ).click();
        cy.get(
            '[data-cy="font-line-height-select"] [aria-label="Normal"]',
        ).should('have.attr', 'aria-checked', 'true');

        cy.getPostContent('.wp-block[class*="code-block-pro"]')
            .invoke('attr', 'style')
            .should('contain', 'line-height: 1.5rem');
    });

    it('Font family can be changed', () => {
        cy.addCode('const foo = "bar";');
        cy.openSideBarPanel('Styling');

        cy.getPostContent('.wp-block[class*="code-block-pro"]')
            .invoke('attr', 'style')
            .should('contain', 'Code-Pro-JetBrains-Mono');

        cy.get('#code-block-pro-font-family').select('Fira Code');
        cy.get('#code-block-pro-font-family').should(
            'have.value',
            'Code-Pro-Fira-Code',
        );

        cy.previewCurrentPage();

        cy.get('.wp-block-kevinbatdorf-code-block-pro')
            .invoke('attr', 'style')
            .should('contain', 'font-family:Code-Pro-Fira-Code');

        cy.go('back');

        cy.focusBlock('code-block-pro', 'textarea');
        cy.get('.wp-block[class*="code-block-pro"] textarea').should(
            'have.focus',
        );

        cy.openSideBarPanel('Styling');

        cy.get('#code-block-pro-font-family').select('JetBrains Mono');
        cy.get('#code-block-pro-font-family').should(
            'have.value',
            'Code-Pro-JetBrains-Mono',
        );
        cy.get('#code-block-pro-font-family').select('System Default');
        cy.get('#code-block-pro-font-family').should('have.value', '');

        cy.previewCurrentPage();

        cy.get('.wp-block-kevinbatdorf-code-block-pro')
            .invoke('attr', 'style')
            .should('not.contain', 'font-family');
    });
});
