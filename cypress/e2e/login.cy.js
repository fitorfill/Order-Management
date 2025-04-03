/// <reference types="cypress" />

describe('User Login End-to-End Test', () => {
  beforeEach(() => {
    // Visit the login page before each test
    // Assumes the React app runs on localhost:3000
    cy.visit('http://localhost:3000/login');
  });

  it('should allow a registered user to log in successfully', () => {
    // --- Arrange ---
    // Use credentials for a user that exists in your backend DB
    const username = 'testuser'; // Replace with a valid test username if different
    const password = 'password123'; // Replace with the valid password

    // --- Act ---
    // Find input fields (adjust selectors if needed)
    cy.get('input[name="username"]').should('be.visible').type(username);
    cy.get('input[name="password"]').should('be.visible').type(password);

    // Find and click the login button
    cy.get('button[type="submit"]').should('be.visible').click();

    // --- Assert ---
    // Check for successful login indication. Examples:
    // 1. Check if the URL changed to the dashboard
    cy.url().should('include', '/dashboard'); // Adjust '/dashboard' if your redirect path is different

    // OR 2. Check if a specific element only visible after login exists (e.g., logout button)
    // cy.contains('Logout').should('be.visible');

    // Optional: Check if localStorage contains the token (less robust E2E check)
    // cy.window().its('localStorage.token').should('be.a', 'string');
  });

  it('should display an error message for invalid credentials', () => {
    // --- Arrange ---
    const username = 'testuser';
    const invalidPassword = 'wrongpassword';

    // --- Act ---
    cy.get('input[name="username"]').type(username);
    cy.get('input[name="password"]').type(invalidPassword);
    cy.get('button[type="submit"]').click();

    // --- Assert ---
    // Check for URL not changing (staying on /login)
    cy.url().should('include', '/login');

    // Check for an error message display (adjust selector/text based on your implementation)
    cy.contains(/invalid credentials/i).should('be.visible'); // Example error text

    // Check that token is not set
    cy.window().its('localStorage.token').should('be.oneOf', [null, undefined]);
  });

  // Add more tests for other scenarios like empty fields if needed
});
