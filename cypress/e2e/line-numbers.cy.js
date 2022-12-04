before(() => {
    cy.resetDatabase();
    cy.clearBrowserStorage();
    cy.loginUser();
});
beforeEach(() => {
    cy.visitNewPageEditor();
    cy.addBlock('code-block-pro');
    cy.getPostContent('.wp-block[class$="code-block-pro"]').should('exist');

    cy.focusBlock('code-block-pro', 'textarea');
    cy.get('.wp-block[class$="code-block-pro"] textarea').should('have.focus');
});
after(() => {
    cy.saveDraft(); // so we can leave without an alert
    cy.logoutUser();
});
context('Line settings', () => {
    it('Line numbers can be enabled/disabled', () => {
        cy.openSideBarPanel('Line Settings');

        cy.get('[data-cy="show-line-numbers"]')
            .should('exist')
            .should('be.not.checked');
        cy.getPostContent('.wp-block[class$="code-block-pro"]').should(
            'not.have.class',
            'cbp-has-line-numbers',
        );

        cy.get('[data-cy="show-line-numbers"]').check().should('be.checked');
        cy.getPostContent('.wp-block[class$="code-block-pro"]').should(
            'have.class',
            'cbp-has-line-numbers',
        );

        cy.get('[data-cy="show-line-numbers"]')
            .uncheck()
            .should('not.be.checked');
        cy.getPostContent('.wp-block[class$="code-block-pro"]').should(
            'not.have.class',
            'cbp-has-line-numbers',
        );
    });

    it('Line numbers can start from another value', () => {
        cy.openSideBarPanel('Line Settings');
        cy.getPostContent('.wp-block[class$="code-block-pro"]').should(
            'not.have.attr',
            'style',
            '--cbp-line-number-start',
        );

        cy.get('[data-cy="show-line-numbers"]')
            .uncheck()
            .should('exist')
            .should('be.not.checked');
        cy.get('[data-cy="show-line-numbers"]').check().should('be.checked');

        cy.get('#code-block-pro-line-number-start').type('5');
        cy.getPostContent('.wp-block[class$="code-block-pro"]')
            .parent()
            .invoke('html')
            .should('contain', '--cbp-line-number-start:5');
    });
});
