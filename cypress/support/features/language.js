export const setLanguage = (language) => {
    cy.openBlockSettingsSideBar();
    cy.get('[data-cy-cbp="language-select"]').select(language);
    cy.get('[data-cy-cbp="language-select"]')
        .invoke('val')
        .should('eq', language);
};
