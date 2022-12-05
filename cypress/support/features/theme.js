export const setTheme = (theme) => {
    cy.openBlockSettingsSideBar();
    cy.openSideBarPanel('Themes');
    cy.get('div[aria-label="Editor settings"] button')
        .contains('Themes')
        .parents('.interface-interface-skeleton__sidebar')
        .scrollTo('bottom');
    cy.get(`#code-block-pro-theme-${theme}`).should('exist');
    cy.get(`#code-block-pro-theme-${theme}`).click();
};
