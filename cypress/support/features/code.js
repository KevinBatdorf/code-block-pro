export const addCode = (code, opts) => {
    cy.focusBlock('code-block-pro', 'textarea');
    cy.get('.wp-block[class*="code-block-pro"] textarea')
        .should('have.focus')
        .type(code, opts);
    cy.get('.wp-block[class*="code-block-pro"] textarea').clear();
    cy.get('.wp-block[class*="code-block-pro"] textarea').type(code, opts);
    cy.get('.wp-block[class*="code-block-pro"] textarea').should(
        'have.value',
        opts?.codeOutput ?? code,
    );
};
