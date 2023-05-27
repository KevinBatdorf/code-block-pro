export const closeWelcomeGuide = () => {
    cy.window().then((win) => {
        // If it's not open, open it first
        cy.waitUntil(() => {
            if (
                win.wp.data
                    .select('core/edit-post')
                    .isFeatureActive('welcomeGuide')
            ) {
                return true;
            }
            cy.wrap(
                win.wp.data
                    .dispatch('core/edit-post')
                    .toggleFeature('welcomeGuide'),
            );
            return false;
        });
        const className = '[aria-label="Welcome to the block editor"]';
        // It's important we open it then wait for the animation to finish
        cy.get(className).should('be.visible');
        // Then close it
        cy.waitUntil(() => {
            if (
                !win.wp.data
                    .select('core/edit-post')
                    .isFeatureActive('welcomeGuide')
            ) {
                return true;
            }
            cy.wrap(
                win.wp.data
                    .dispatch('core/edit-post')
                    .toggleFeature('welcomeGuide'),
            );
        });
        // And wait again for the animation to finish
        cy.get(className).should('not.exist');
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
            cy.get('button[aria-label="Toggle block inserter"]').click({
                force: true,
            });
        }
    });
};
export const closeBlockInserter = () => {
    cy.get('button[aria-label="Toggle block inserter"]').then((button) => {
        if (button.attr('aria-pressed') === 'true') {
            cy.get('button[aria-label="Toggle block inserter"]').click();
        }
    });
};
export const openBlockSettingsSideBar = () => {
    cy.get('button[aria-label="Settings"]').then((button) => {
        if (button.attr('aria-pressed') === 'false') {
            button.trigger('click');
            cy.get('button[aria-label="Settings"]').should(
                'have.attr',
                'aria-pressed',
                'true',
            );
        }
    });
};
export const openSideBarPanel = (label) => {
    cy.openBlockSettingsSideBar();
    cy.get('div[aria-label="Editor settings"] button')
        .contains(label)
        .then((button) => {
            if (button.attr('aria-expanded') === 'false') {
                button.trigger('click');
                cy.get('div[aria-label="Editor settings"] button')
                    .contains(label)
                    .should('have.attr', 'aria-expanded', 'true');
            }
        });
};
export const addBlock = (slug) => {
    cy.window().then((win) => {
        const block = win.wp.blocks.createBlock(slug);
        win.wp.data.dispatch('core/block-editor').insertBlock(block);
    });
};
export const wpDataSelect = (store, selector, ...parameters) => {
    cy.window().then((win) => {
        return win.wp.data.select(store)[selector](...parameters);
    });
};

export const previewCurrentPage = () => {
    cy.saveDraft();
    cy.url().then((url) => {
        const page = url.split('post=')[1].split('&')[0];
        cy.visit(`/?page_id=${page}&preview=true`);
    });
    cy.get('body').should('not.be.empty');
};
