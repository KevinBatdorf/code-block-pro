beforeEach(() => {
    cy.resetDatabase();
    cy.clearBrowserStorage();
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
context('Line numbers', () => {
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

context('Line highlights', () => {
    it('Line numbers can be highlighted', () => {
        cy.openSideBarPanel('Line Settings');
        cy.get('[data-cy="show-line-numbers"]').check().should('be.checked');
        cy.addCode('line 1\nline 2\nline 3\nline 4\nline 5');

        cy.get('.wp-block[class$="code-block-pro"] .cbp-line-highlight').should(
            'not.exist',
        );

        cy.get('[data-cy="enable-highlighting"]').check().should('be.checked');
        cy.get('#code-block-pro-show-highlighted-lines').type('2');

        cy.get('.wp-block[class$="code-block-pro"] .cbp-line-highlight').should(
            'have.length',
            1,
        );

        // check ranges too
        cy.get('#code-block-pro-show-highlighted-lines').clear().type('[2,4]');

        cy.getPostContent(
            '.wp-block[class$="code-block-pro"] .cbp-line-highlight',
        ).should('have.length', 3);
    });
});

context('Line blurring', () => {
    it('Line numbers can be blurred', () => {
        cy.openSideBarPanel('Line Settings');
        cy.get('[data-cy="show-line-numbers"]').check().should('be.checked');
        cy.addCode('line 1\nline 2\nline 3\nline 4\nline 5');

        cy.get('.wp-block[class$="code-block-pro"] .cbp-no-blur').should(
            'not.exist',
        );
        cy.get('.wp-block[class$="code-block-pro"]').should(
            'not.have.class',
            'cbp-blur-enabled',
        );

        cy.get('[data-cy="enable-blur"]').check().should('be.checked');
        cy.get('#code-block-pro-show-blurred-lines').type('2');

        cy.get('.wp-block[class$="code-block-pro"] .cbp-no-blur').should(
            'have.length',
            1,
        );
        cy.get('.wp-block[class$="code-block-pro"]').should(
            'have.class',
            'cbp-blur-enabled',
        );

        // check ranges too
        cy.get('#code-block-pro-show-blurred-lines').clear().type('[2,4]');

        cy.getPostContent(
            '.wp-block[class$="code-block-pro"] .cbp-no-blur',
        ).should('have.length', 3);
    });
});
