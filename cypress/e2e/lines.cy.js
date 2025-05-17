beforeEach(() => {
    cy.resetDatabase();
    cy.clearBrowserStorage();
    cy.loginUser();
    cy.visitNewPageEditor();
    cy.addBlock('kevinbatdorf/code-block-pro');
    cy.findBlock('code-block-pro').should('exist');

    cy.focusBlock(
        'code-block-pro',
        'textarea.npm__react-simple-code-editor__textarea',
    );
    cy.findBlock(
        'code-block-pro',
        'textarea.npm__react-simple-code-editor__textarea',
    ).should('have.focus');
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
            .should('not.be.checked');
        cy.findBlock('code-block-pro').should(
            'not.have.class',
            'cbp-has-line-numbers',
        );

        cy.get('[data-cy="show-line-numbers"]').check();
        cy.get('[data-cy="show-line-numbers"]').should('be.checked');
        cy.findBlock('code-block-pro').should(
            'have.class',
            'cbp-has-line-numbers',
        );

        cy.get('[data-cy="show-line-numbers"]').uncheck();
        cy.get('[data-cy="show-line-numbers"]').should('not.be.checked');
        cy.findBlock('code-block-pro').should(
            'not.have.class',
            'cbp-has-line-numbers',
        );
    });

    it('Line numbers can start from another value', () => {
        cy.openSideBarPanel('Line Settings');
        cy.findBlock('code-block-pro').should(
            'not.have.attr',
            'style',
            '--cbp-line-number-start',
        );

        cy.get('[data-cy="show-line-numbers"]').uncheck();
        cy.get('[data-cy="show-line-numbers"]').should('exist');
        cy.get('[data-cy="show-line-numbers"]').should('be.not.checked');
        cy.get('[data-cy="show-line-numbers"]').check();
        cy.get('[data-cy="show-line-numbers"]').should('be.checked');

        cy.get('#code-block-pro-line-number-start').type('5');
        cy.findBlock('code-block-pro')
            .parent()
            .invoke('html')
            .should('contain', '--cbp-line-number-start: 5');
    });
});

context('Line highlights', () => {
    it('Line numbers can be highlighted', () => {
        cy.openSideBarPanel('Line Settings');
        cy.get('[data-cy="show-line-numbers"]').check();
        cy.get('[data-cy="show-line-numbers"]').should('be.checked');
        cy.addCode('line 1\nline 2\nline 3\nline 4\nline 5');

        cy.findBlock('code-block-pro', '.cbp-line-highlight').should(
            'not.exist',
        );

        cy.get('[data-cy="enable-highlighting"]').check();
        cy.get('[data-cy="enable-highlighting"]').should('be.checked');
        cy.get('#code-block-pro-show-highlighted-lines').type('2');

        cy.findBlock('code-block-pro', '.cbp-line-highlight').should(
            'have.length',
            1,
        );

        // check ranges too
        cy.get('#code-block-pro-show-highlighted-lines').clear({ force: true });
        cy.get('#code-block-pro-show-highlighted-lines').type('[2,4]', {
            force: true,
        });

        cy.findBlock('code-block-pro', '.cbp-line-highlight').should(
            'have.length',
            3,
        );
    });
    it('Line numbers can be highlighted on hover', () => {
        cy.openSideBarPanel('Line Settings');
        cy.get('[data-cy="show-line-numbers"]').check();
        cy.get('[data-cy="show-line-numbers"]').should('be.checked');
        cy.addCode('line 1\nline 2\nline 3\nline 4\nline 5');

        cy.findBlock('code-block-pro', '.cbp-line-highlight').should(
            'not.exist',
        );

        cy.previewCurrentPage();

        cy.get('.cbp-line-highlighter').should('not.exist');

        cy.go('back');
        cy.focusBlock(
            'code-block-pro',
            'textarea.npm__react-simple-code-editor__textarea',
        );
        cy.findBlock(
            'code-block-pro',
            'textarea.npm__react-simple-code-editor__textarea',
        ).should('have.focus');

        cy.openSideBarPanel('Line Settings');
        cy.get('[data-cy="enable-highlighting-hover"]').check();
        cy.get('[data-cy="enable-highlighting-hover"]').should('be.checked');

        cy.findBlock('code-block-pro', '.cbp-line-highlight').should(
            'not.exist',
        );

        cy.previewCurrentPage();

        cy.get('.cbp-line-highlighter').should('have.length', 5);
    });
});

context('Line blurring', () => {
    it('Line numbers can be blurred', () => {
        cy.openSideBarPanel('Line Settings');
        cy.get('[data-cy="show-line-numbers"]').check();
        cy.get('[data-cy="show-line-numbers"]').should('be.checked');
        cy.addCode('line 1\nline 2\nline 3\nline 4\nline 5');

        cy.findBlock('code-block-pro', '.cbp-no-blur').should('not.exist');
        cy.findBlock('code-block-pro').should(
            'not.have.class',
            'cbp-blur-enabled',
        );

        cy.get('[data-cy="enable-blur"]').check();
        cy.get('[data-cy="enable-blur"]').should('be.checked');
        cy.get('#code-block-pro-show-blurred-lines').type('2');

        cy.findBlock('code-block-pro', '.cbp-no-blur').should('have.length', 1);
        cy.findBlock('code-block-pro').should('have.class', 'cbp-blur-enabled');

        // check ranges too
        cy.get('#code-block-pro-show-blurred-lines').clear();
        cy.get('#code-block-pro-show-blurred-lines').type('[2,4]');

        cy.findBlock('code-block-pro', '.cbp-no-blur').should('have.length', 3);
    });
});
