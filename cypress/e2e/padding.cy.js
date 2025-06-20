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

    cy.openSideBarPanel('Extra Settings');
    cy.get('[data-cy="disable-padding"')
        .should('exist')
        .should('be.not.checked');
});
afterEach(() => {
    cy.saveDraft(); // so we can leave without an alert
    cy.logoutUser();
});
context('Line numbers', () => {
    it('Line numbers disabled, padding enabled', () => {
        cy.findBlock('code-block-pro', '> div > div > pre').should(
            'have.css',
            'padding',
            '16px 0px 16px 16px',
        );
        cy.findBlock(
            'code-block-pro',
            'textarea.npm__react-simple-code-editor__textarea',
        ).should('have.css', 'padding', '16px 0px 16px 16px');

        cy.addCode('line 1\nline 2\nline 3');
        cy.previewCurrentPage();

        cy.get('.wp-block-kevinbatdorf-code-block-pro pre.shiki')
            .should('exist')
            .should('have.css', 'padding', '16px 0px 16px 16px');
    });

    it('Line numbers disabled, padding disabled', () => {
        cy.findBlock('code-block-pro', '> div > div > pre').should(
            'have.css',
            'padding',
            '16px 0px 16px 16px',
        );
        cy.findBlock(
            'code-block-pro',
            'textarea.npm__react-simple-code-editor__textarea',
        ).should('have.css', 'padding', '16px 0px 16px 16px');

        cy.addCode('line 1\nline 2\nline 3');

        cy.get('[data-cy="disable-padding"').check();
        cy.get('[data-cy="disable-padding"').should('be.checked');

        cy.findBlock('code-block-pro', '> div > div > pre').should(
            'have.css',
            'padding',
            '0px',
        );
        cy.findBlock(
            'code-block-pro',
            'textarea.npm__react-simple-code-editor__textarea',
        ).should('have.css', 'padding', '0px');

        cy.previewCurrentPage();

        cy.get('.wp-block-kevinbatdorf-code-block-pro pre.shiki')
            .should('exist')
            .should('have.css', 'padding', '0px');
    });

    it('Line numbers enabled, padding enabled', () => {
        cy.addCode('line 1\nline 2\nline 3');

        cy.openSideBarPanel('Line Settings');
        cy.get('[data-cy="show-line-numbers"]').should('exist');
        cy.get('[data-cy="show-line-numbers"]').should('be.not.checked');
        cy.get('[data-cy="show-line-numbers"]').check();
        cy.get('[data-cy="show-line-numbers"]').should('be.checked');

        cy.findBlock('code-block-pro').invoke('html').should(
            'not.include',
            '0px 0px 0px 4', // more like 40.4375px but varies
        );

        cy.previewCurrentPage();

        cy.get('.wp-block-kevinbatdorf-code-block-pro pre.shiki')
            .should('exist')
            .should('have.css', 'padding', '16px 0px 16px 16px');
    });

    it('Line numbers enabled, padding disabled', () => {
        cy.get('[data-cy="disable-padding"').check();
        cy.get('[data-cy="disable-padding"').should('be.checked');
        cy.addCode('line 1\nline 2\nline 3');

        cy.openSideBarPanel('Line Settings');
        cy.get('[data-cy="show-line-numbers"]').should('exist');
        cy.get('[data-cy="show-line-numbers"]').should('be.not.checked');
        cy.get('[data-cy="show-line-numbers"]').check();
        cy.get('[data-cy="show-line-numbers"]').should('be.checked');

        cy.findBlock('code-block-pro').invoke('html').should(
            'include',
            '0px 0px 0px 2', // more like 24.4375px but varies
        );

        // Tests that the padding expands as the line number width grows
        cy.addCode('1\n2\n3\n4\n5\n6\n7\n8\n9\n10');

        cy.findBlock('code-block-pro')
            .invoke('html')
            .should(
                'not.include',
                '0px 0px 0px 2', // more like 32.8594px but varies
            )
            .should(
                'include',
                '0px 0px 0px 3', // more like 32.8594px but varies
            );

        cy.previewCurrentPage();

        cy.get('.wp-block-kevinbatdorf-code-block-pro pre.shiki')
            .should('exist')
            .should('have.css', 'padding', '0px');
    });
});
