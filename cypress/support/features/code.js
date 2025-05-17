export const addCode = (code, opts) => {
    cy.focusBlock(
        'code-block-pro',
        'textarea.npm__react-simple-code-editor__textarea',
    );
    cy.findBlock(
        'code-block-pro',
        'textarea.npm__react-simple-code-editor__textarea',
    )
        .should('have.focus')
        .type(code, opts);
    cy.findBlock(
        'code-block-pro',
        'textarea.npm__react-simple-code-editor__textarea',
    ).clear();
    cy.findBlock(
        'code-block-pro',
        'textarea.npm__react-simple-code-editor__textarea',
    ).type(code, opts);
    cy.findBlock(
        'code-block-pro',
        'textarea.npm__react-simple-code-editor__textarea',
    ).should('have.value', opts?.codeOutput ?? code);
};
