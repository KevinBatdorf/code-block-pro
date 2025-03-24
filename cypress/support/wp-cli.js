export const resetDatabase = () => {
    cy.exec('wp-env clean all');
    cy.exec(
        'wp-env run cli wp user meta add 1 wp_persisted_preferences \'{"core/edit-post":{"welcomeGuide":false,"core/edit-post/pattern-modal":false,"pattern-modal":false,"edit-post/pattern-modal":false,"patternModal":false},"core":{"enableChoosePatternModal":false},"_modified":"2025-03-23T02:16:33.561Z"}\' --format=json',
    );
};

export const switchWpLanguage = (language) => {
    // install first
    cy.exec(`wp-env run cli wp language core install ${language}`);
    cy.exec(`wp-env run cli wp site switch-language ${language}`);
};
