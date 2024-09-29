export const setFooter = (footer) => {
    cy.openBlockSettingsSideBar();
    cy.openSideBarPanel('Footer Type');
    cy.get('div[aria-label="Editor settings"] button')
        .contains('Footer Type')
        .parents('.editor-sidebar')
        .scrollTo('bottom');
    cy.get(`#code-block-pro-footer-${footer}`).should('exist');
    cy.get(`#code-block-pro-footer-${footer}`).click();
};
