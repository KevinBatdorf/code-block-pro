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
context('Footers', () => {
    it('Renders no footer on insert and can swap', () => {
        cy.getPostContent('.wp-block[class$="code-block-pro"] > div')
            .siblings()
            .should('have.length', 2);
        cy.setFooter('simpleStringEnd');
        cy.getPostContent('.wp-block[class$="code-block-pro"] > div')
            .siblings()
            .should('have.length', 3);
        cy.setFooter('none');
        cy.getPostContent('.wp-block[class$="code-block-pro"] > div')
            .siblings()
            .should('have.length', 2);
    });

    it('Can accept text inputs on some footers', () => {
        // Remove the header/footer if there
        cy.setHeader('none');
        cy.setFooter('none');
        cy.getPostContent('.wp-block[class$="code-block-pro"]')
            .invoke('html')
            .should('not.contain', 'JavaScript');
        cy.setFooter('simpleStringEnd');
        cy.getPostContent('.wp-block[class$="code-block-pro"]')
            .invoke('html')
            .should('contain', 'JavaScript');
        cy.setLanguage('ruby');
        cy.getPostContent('.wp-block[class$="code-block-pro"]')
            .invoke('html')
            .should('contain', 'Ruby');
        cy.openSideBarPanel('Settings');
        cy.get('#code-block-pro-footer-text')
            .should('exist')
            .should('have.value', '')
            .type('foo-bar-baz-lets-go');
        cy.getPostContent('.wp-block[class$="code-block-pro"]')
            .invoke('html')
            .should('contain', 'foo-bar-baz-lets-go')
            .should('not.contain', 'Ruby')
            .should('not.contain', 'JavaScript');
    });

    it('Some footers can expand height', () => {
        // Remove the header/footer if there
        cy.setHeader('none');
        cy.setFooter('none');
        cy.getPostContent('.wp-block[class$="code-block-pro"]')
            .invoke('html')
            .should('not.contain', 'Expand');
        cy.setFooter('seeMoreLeft');
        cy.getPostContent('.wp-block[class$="code-block-pro"]')
            .invoke('html')
            .should('contain', 'Expand');

        cy.openSideBarPanel('Settings');
        cy.get('[data-cy="see-more-text"]')
            .should('exist')
            .should('have.value', '')
            .type('foo-bar-baz-lets-go');

        cy.getPostContent('.wp-block[class$="code-block-pro"]')
            .invoke('html')
            .should('contain', 'foo-bar-baz-lets-go')
            .should('not.contain', 'Expand');

        cy.addCode(
            'const foo = "1";\nconst foo = "2";\nconst foo = "3";\nconst foo = "4";\nconst foo = "5";',
        );

        cy.previewCurrentPage();

        cy.get('.wp-block-kevinbatdorf-code-block-pro').should(
            'contain',
            'foo = "5"',
        );

        cy.go('back');

        cy.focusBlock('code-block-pro', 'textarea');
        cy.get('.wp-block[class$="code-block-pro"] textarea').should(
            'have.focus',
        );

        cy.get('[data-cy="see-more-line"]')
            .should('exist')
            .should('have.value', '')
            .type('3');

        cy.previewCurrentPage();

        cy.contains('foo = "5"').should('not.be.visible');

        cy.get('.cbp-see-more-simple-btn').click();

        cy.contains('foo = "5"').should('be.visible');

        cy.get('.cbp-see-more-simple-btn').should('not.exist');
    });
});
