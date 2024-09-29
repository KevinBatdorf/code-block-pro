export const setHeader = (header) => {
    cy.openBlockSettingsSideBar();
    cy.openSideBarPanel('Header Type');
    cy.get('div[aria-label="Editor settings"] button')
        .contains('Header Type')
        .parents('.editor-sidebar')
        .scrollTo('bottom');
    cy.get(`#code-block-pro-header-${header}`).should('exist');
    cy.get(`#code-block-pro-header-${header}`).click();
};
