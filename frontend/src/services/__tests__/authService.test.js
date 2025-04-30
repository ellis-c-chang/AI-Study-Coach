import * as authService from '../authService';
import API from '../api';

// Mock axios/API
jest.mock('../api', () => ({
  post: jest.fn(),
}));

describe('authService', () => {
  const mockToken = 'fake-jwt-token';
  const mockUserData = {
    email: 'test@example.com',
    password: 'password123',
    username: 'testuser'
  };
  const mockResponseData = {
    message: 'Login successful!',
    user_id: 1,
    username: 'testuser',
    token: mockToken
  };

  beforeEach(() => {
    // Clear all mocks and localStorage before each test
    jest.clearAllMocks();
    localStorage.clear();
    
    // Mock API.post to return a successful response
    API.post.mockImplementation(() => Promise.resolve({ 
      data: mockResponseData,
      status: 200
    }));
  });

  test('register calls API with correct data', async () => {
    await authService.register(mockUserData);
    
    expect(API.post).toHaveBeenCalledWith('/auth/register', mockUserData);
  });

  test('login calls API with correct data and sets token', async () => {
    const loginData = {
      email: mockUserData.email,
      password: mockUserData.password
    };
    
    const result = await authService.login(loginData);
    
    expect(API.post).toHaveBeenCalledWith('/auth/login', loginData);
    expect(result).toEqual(mockResponseData);
    expect(localStorage.getItem('token')).toBe(mockToken);
  });

  test('logout removes token from localStorage', () => {
    // Set a token first
    localStorage.setItem('token', mockToken);
    
    // Call logout
    const result = authService.logout();
    
    // Check that token was removed and true was returned
    expect(localStorage.getItem('token')).toBeNull();
    expect(result).toBe(true);
  });

  test('isAuthenticated returns true when token exists', () => {
    // Set a token
    localStorage.setItem('token', mockToken);
    
    // Check that isAuthenticated returns true
    expect(authService.isAuthenticated()).toBe(true);
  });

  test('isAuthenticated returns false when token does not exist', () => {
    // Ensure no token exists
    localStorage.removeItem('token');
    
    // Check that isAuthenticated returns false
    expect(authService.isAuthenticated()).toBe(false);
  });

  test('getToken returns token from localStorage', () => {
    // Set a token
    localStorage.setItem('token', mockToken);
    
    // Check that getToken returns the token
    expect(authService.getToken()).toBe(mockToken);
  });

  test('removeToken removes token from localStorage', () => {
    // Set a token first
    localStorage.setItem('token', mockToken);
    
    // Call removeToken
    authService.removeToken();
    
    // Check that token was removed
    expect(localStorage.getItem('token')).toBeNull();
  });

  test('register handles API error', async () => {
    // Mock API error
    const error = new Error('Registration failed');
    API.post.mockRejectedValueOnce(error);
    
    // Check that the error is propagated
    await expect(authService.register(mockUserData)).rejects.toThrow(error);
  });

  test('login handles API error', async () => {
    // Mock API error
    const error = new Error('Login failed');
    API.post.mockRejectedValueOnce(error);
    
    const loginData = {
      email: mockUserData.email,
      password: mockUserData.password
    };
    
    // Check that the error is propagated
    await expect(authService.login(loginData)).rejects.toThrow(error);
    
    // Check that token was not set
    expect(localStorage.getItem('token')).toBeNull();
  });
});