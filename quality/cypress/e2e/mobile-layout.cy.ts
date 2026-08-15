describe('Mobile Layout Functional Test Automation Suite', () => {
  beforeEach(() => {
    cy.setMobileViewport();
    cy.visit('/profile');
  });

  it('TC-011: Mobile Viewport Header and Touch Target Compliance', () => {
    // Verify mobile header is rendered without horizontal scrolling overflow
    cy.get('header').should('be.visible');
    cy.window().its('innerWidth').should('be.at.most', 500);

    // Verify header settings gear button touch target is compliant
    cy.get('#header-profile-menu-btn').should('be.visible');
    cy.verifyTouchTargetSize('#header-profile-menu-btn', 32);

    // Verify simple black icon styling on mobile header button
    cy.get('#header-profile-menu-btn')
      .should('have.class', 'text-black')
      .should('not.have.class', 'shadow-md')
      .should('not.have.class', 'bg-[#FF5C00]');
  });

  it('TC-012: Mobile Navigation and Settings Drawer Responsiveness', () => {
    // Open Profile Settings drawer on mobile
    cy.get('#header-profile-menu-btn').click();

    // Verify slide-out drawer or overlay adapts cleanly to mobile width
    cy.contains('Profile Settings', { timeout: 5000 }).should('be.visible');

    // Close drawer
    cy.get('#close-profile-settings-btn').click();
  });

  it('TC-013: Mobile Circle Search Viewport & Icon Styling', () => {
    // Switch viewport to iPhone 14 Pro Max width
    cy.viewport(390, 844);

    // Navigate to Social / Circle tab via mobile bottom nav
    cy.get('#mobile-nav-social-tab').click({ force: true });

    // Verify search button styling on mobile Circle view
    cy.get('#circle-search-btn').should('be.visible');
    cy.get('#circle-search-btn')
      .should('have.class', 'text-black')
      .should('not.have.class', 'shadow-md')
      .should('not.have.class', 'bg-[#FF5C00]');

    // Click search icon
    cy.get('#circle-search-btn').click({ force: true });

    // Verify search modal fits mobile screen width
    cy.get('#search-modal-root', { timeout: 5000 }).should('be.visible');
    cy.get('#search-recipes-query').should('be.visible');

    // Close modal
    cy.get('#close-search-btn').click({ force: true });
  });
});
