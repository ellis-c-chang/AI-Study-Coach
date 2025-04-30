import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import LoginForm from '../LoginForm';
import * as authService from '../../services/authService';

// Mock the auth service functions
jest.mock('../../services/authService', () => ({
  login: jest.fn(),
  register: jest.fn()
}));

describe('LoginForm Component', () => {
  const mockSetUser = jest.fn();

  beforeEach(() => {
    // Clear mock call history before each test
    jest.clearAllMocks();
  });

  test('renders login form by default', () => {
    render(<LoginForm setUser={mockSetUser} />);
    
    // Check that login form elements are present
    expect(screen.getByText('Welcome Back')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    expect(screen.getByText('New user? Click here to register!')).toBeInTheDocument();
    
    // Check that register form elements are not present
    expect(screen.queryByPlaceholderText('Username')).not.toBeInTheDocument();
    expect(screen.queryByText('Create an Account')).not.toBeInTheDocument();
  });

  test('switches to register form when register link is clicked', () => {
    render(<LoginForm setUser={mockSetUser} />);
    
    // Click register link
    fireEvent.click(screen.getByText('New user? Click here to register!'));
    
    // Check that register form elements are present
    expect(screen.getByText('Create an Account')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Username')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument();
    expect(screen.getByText('Already have an account? Login')).toBeInTheDocument();
    
    // Check that login form elements are not present
    expect(screen.queryByText('Welcome Back')).not.toBeInTheDocument();
  });

  test('handles login form submission', async () => {
    // Mock successful login response
    authService.login.mockResolvedValue({
      user_id: 1,
      username: 'testuser',
      token: 'fake-jwt-token'
    });
    
    render(<LoginForm setUser={mockSetUser} />);
    
    // Fill in login form
    fireEvent.change(screen.getByPlaceholderText('Email'), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'password123' }
    });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    
    // Check that login function was called with correct arguments
    expect(authService.login).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123'
    });
    
    // Check that setUser was called with the response data
    await waitFor(() => {
      expect(mockSetUser).toHaveBeenCalledWith({
        user_id: 1,
        username: 'testuser',
        token: 'fake-jwt-token'
      });
    });
  });

  test('handles register form submission', async () => {
    // Mock successful register response
    authService.register.mockResolvedValue({});
    
    // Mock successful login response after registration
    authService.login.mockResolvedValue({
      user_id: 1,
      username: 'newuser',
      token: 'fake-jwt-token'
    });
    
    render(<LoginForm setUser={mockSetUser} />);
    
    // Switch to register form
    fireEvent.click(screen.getByText('New user? Click here to register!'));
    
    // Fill in register form
    fireEvent.change(screen.getByPlaceholderText('Username'), {
      target: { value: 'newuser' }
    });
    fireEvent.change(screen.getByPlaceholderText('Email'), {
      target: { value: 'newuser@example.com' }
    });
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'newpassword123' }
    });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /register/i }));
    
    // Check that register function was called with correct arguments
    expect(authService.register).toHaveBeenCalledWith({
      username: 'newuser',
      email: 'newuser@example.com',
      password: 'newpassword123'
    });
    
    // Check that login function was called after successful registration
    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith({
        email: 'newuser@example.com',
        password: 'newpassword123'
      });
    });
    
    // Check that setUser was called with the response data and isNewUser flag
    await waitFor(() => {
      expect(mockSetUser).toHaveBeenCalledWith({
        user_id: 1,
        username: 'newuser',
        token: 'fake-jwt-token',
        isNewUser: true
      });
    });
  });

  test('handles login error', async () => {
    // Mock failed login
    authService.login.mockRejectedValue(new Error('Authentication failed'));
    
    // Spy on console.error and window.alert
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    window.alert = jest.fn();
    
    render(<LoginForm setUser={mockSetUser} />);
    
    // Fill in login form
    fireEvent.change(screen.getByPlaceholderText('Email'), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'wrong-password' }
    });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    
    // Check that error was logged
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
    
    // Separate waitFor for alert check
    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Authentication failed, please check your credentials.');
    });
    
    // Check that setUser was not called
    expect(mockSetUser).not.toHaveBeenCalled();
    
    // Restore the original console.error
    consoleErrorSpy.mockRestore();
  });
});