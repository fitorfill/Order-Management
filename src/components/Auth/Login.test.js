import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom'; // For extra matchers like .toBeInTheDocument()
import { BrowserRouter } from 'react-router-dom'; // Needed if Login uses Link or useNavigate
import Login from './Login';
import { AuthProvider } from '../../context/AuthContext'; // Assuming Login uses AuthContext

// Mock AuthContext if needed, especially the login function
// For a simple component test, we might not need to mock the submission logic yet.
// jest.mock('../../context/AuthContext', () => ({
//   useAuth: () => ({
//     login: jest.fn(),
//     error: null,
//     loading: false,
//   }),
//   AuthProvider: ({ children }) => <div>{children}</div> // Simple mock provider
// }));


// Helper function to render with necessary providers
const renderLoginComponent = () => {
  return render(
    <BrowserRouter> {/* Wrap with BrowserRouter if Link/useNavigate is used */}
      <AuthProvider> {/* Wrap with AuthProvider if useAuth is used */}
        <Login />
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('Login Component', () => {
  test('renders login form elements', () => {
    renderLoginComponent();

    // Check for form elements by label text or placeholder
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  test('allows user to type into username and password fields', () => {
    renderLoginComponent();

    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);

    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    expect(usernameInput.value).toBe('testuser');
    expect(passwordInput.value).toBe('password123');
  });

  // Add more tests later for:
  // - Form submission (might require mocking useAuth().login)
  // - Displaying error messages
  // - Handling loading state
});
