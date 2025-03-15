export const addCode = (code, opts) => {
    cy.focusBlock('code-block-pro', 'textarea');
    cy.findBlock('code-block-pro', 'textarea')
        .should('have.focus')
        .type(code, opts);
    cy.findBlock('code-block-pro', 'textarea').clear();
    cy.findBlock('code-block-pro', 'textarea').type(code, opts);
    cy.findBlock('code-block-pro', 'textarea').should(
        'have.value',
        opts?.codeOutput ?? code,
    );
};
