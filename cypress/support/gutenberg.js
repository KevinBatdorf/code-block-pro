export const closeWelcomeGuide = () => {
    cy.window().then((win) => {
        if (
            win.wp.data.select('core/edit-post').isFeatureActive('welcomeGuide')
        ) {
            win.wp.data
                .dispatch('core/edit-post')
                .toggleFeature('welcomeGuide');
        }
    });
};

export const saveDraft = () => {
    cy.get('body').then((body) => {
        if (body.find('.editor-post-save-draft').length > 0) {
            cy.get('.editor-post-save-draft').click();
            cy.get('.editor-post-saved-state.is-saved');
        }
    });
};

export const setPostContent = (content) => {
    cy.window().then((win) => {
        const { dispatch } = win.wp.data;
        const blocks = win.wp.blocks.parse(content);
        dispatch('core/block-editor').resetBlocks(blocks);
    });
};
export const openBlockInserter = () => {
    cy.get('button[aria-label="Toggle block inserter"]').then((button) => {
        if (button.attr('aria-pressed') === 'false') {
            button.click();
        }
    });
};
export const closeBlockInserter = () => {
    cy.get('button[aria-label="Toggle block inserter"]').then((button) => {
        if (button.attr('aria-pressed') === 'true') {
            button.click();
        }
    });
};
export const addBlock = (slug) => {
    cy.openBlockInserter();
    cy.get(`button[class*="${slug}"]`).click();
};
export const wpDataSelect = (store, selector, ...parameters) => {
    cy.window().then((win) => {
        return win.wp.data.select(store)[selector](...parameters);
    });
};
