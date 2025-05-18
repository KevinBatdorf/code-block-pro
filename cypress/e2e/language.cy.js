beforeEach(() => {
    cy.resetDatabase();
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
context('Language checks', () => {
    it('Renders properly when switching languages', () => {
        cy.addCode('const foo = "bar";');
        cy.setTheme('nord');
        cy.findBlock('code-block-pro')
            .invoke('html')
            .should('contain', '<span style="color: #81A1C1">const</span>');

        // TODO - pro only
        // const lorem = 'Ut laboris anim culpa fugiat sit anim dolor cillum';
        // cy.addCode(lorem);
        cy.setLanguage('plaintext');
        cy.findBlock('code-block-pro')
            .invoke('html')
            .should(
                'contain',
                'padding: 16px 0px 16px 16px;">const foo = "bar";</textarea>',
            );
    });
});
