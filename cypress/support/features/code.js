export const addCode = (code) => {
    cy.focusBlock('code-block-pro', 'textarea');
    cy.get('.wp-block[class$="code-block-pro"] textarea')
        .should('have.focus')
        .type(code);
    cy.get('.wp-block[class$="code-block-pro"] textarea').clear().type(code);
    cy.get('.wp-block[class$="code-block-pro"] textarea').should(
        'have.value',
        code,
    );
};
