describe('Desktop Layout Functional Test Automation Suite', () => {
  beforeEach(() => {
    cy.setDesktopViewport();
    cy.visit('/profile');
  });

  it('TC-008: Header and Navigation Layout on Desktop Viewport', () => {
    // Verify desktop page structure
    cy.get('body').should('be.visible');
    
    // Check header bar presence and brand visibility
    cy.get('header').should('be.visible');

    // Verify main navigation bar buttons exist
    cy.get('nav').should('exist');
  });

  it('TC-009: Profile Settings Gear Button and Drawer Behavior on Desktop', () => {
    // Locate Profile Settings gear button in header
    cy.get('#header-profile-menu-btn').should('be.visible');

    // Verify gear icon styling - black icon without heavy background shadow
    cy.get('#header-profile-menu-btn')
      .should('have.class', 'text-black')
      .should('not.have.class', 'shadow-md')
      .should('not.have.class', 'bg-[#FF5C00]');

    // Click gear icon to open Profile Settings drawer
    cy.get('#header-profile-menu-btn').click();

    // Verify drawer appears
    cy.contains('Profile Settings', { timeout: 5000 }).should('be.visible');

    // Close settings drawer
    cy.get('#close-profile-settings-btn').click();
  });

  it('TC-010: Circle View Search Button Styling and Modal on Desktop', () => {
    // Navigate to Social / Circle tab
    cy.get('#nav-social-tab').click({ force: true });

    // Verify Circle view search button styling
    cy.get('#circle-search-btn').should('be.visible');
    cy.get('#circle-search-btn')
      .should('have.class', 'text-black')
      .should('not.have.class', 'shadow-md')
      .should('not.have.class', 'bg-[#FF5C00]');

    // Click search button
    cy.get('#circle-search-btn').click({ force: true });

    // Verify search modal pops up
    cy.get('#search-modal-root', { timeout: 5000 }).should('be.visible');
    cy.get('#search-recipes-query').should('be.visible');

    // Close modal
    cy.get('#close-search-btn').click({ force: true });
  });

  it('TC-014: Session Persistence on Desktop Page Reload', () => {
    // Reload page to verify session cookies and layout persist
    cy.reload();
    cy.get('header').should('be.visible');
    cy.get('#header-profile-menu-btn').should('be.visible');
  });
});
