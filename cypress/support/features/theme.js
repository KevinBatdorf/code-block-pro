export const setTheme = (theme) => {
    cy.openBlockSettingsSideBar();
    cy.openSideBarPanel('Themes');
    cy.get('div[aria-label="Editor settings"] button')
        .contains('Themes')
        .parents('.interface-interface-skeleton__sidebar')
        .scrollTo('bottom', {
            duration: 300,
        });
    cy.get(`#code-block-pro-theme-${theme}`).should('exist');
    cy.get('div[aria-label="Editor settings"] button')
        .contains('Themes')
        .parents('.interface-interface-skeleton__sidebar')
        .scrollTo('top', {
            duration: 300,
        });
    cy.get(`#code-block-pro-theme-${theme}`).click();
};
