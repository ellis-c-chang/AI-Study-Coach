import axios from 'axios';
import API from '../api';

// Mock axios
jest.mock('axios', () => ({
  create: jest.fn().mockReturnValue({
    interceptors: {
      request: {
        use: jest.fn(),
      },
      response: {
        use: jest.fn(),
      },
    },
  }),
}));

describe('API utility', () => {
  test('creates axios instance with correct configuration', () => {
    expect(axios.create).toHaveBeenCalledWith({
      baseURL: 'https://ai-study-coach.onrender.com',
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json'
      },
    });
  });

  test('adds request interceptor', () => {
    const axiosInstance = axios.create();
    expect(axiosInstance.interceptors.request.use).toHaveBeenCalled();
  });

  test('adds response interceptor', () => {
    const axiosInstance = axios.create();
    expect(axiosInstance.interceptors.response.use).toHaveBeenCalled();
  });

  test('request interceptor adds authorization header when token exists', () => {
    // Get the request interceptor function
    const axiosInstance = axios.create();
    const requestInterceptor = axiosInstance.interceptors.request.use.mock.calls[0][0];
    
    // Mock localStorage.getItem to return a token
    const originalGetItem = localStorage.getItem;
    localStorage.getItem = jest.fn().mockReturnValue('fake-jwt-token');
    
    // Mock config object
    const config = { headers: {} };
    
    // Call the interceptor
    const result = requestInterceptor(config);
    
    // Check that Authorization header was added
    expect(result.headers.Authorization).toBe('Bearer fake-jwt-token');
    
    // Restore original localStorage.getItem
    localStorage.getItem = originalGetItem;
  });

  test('request interceptor does not add authorization header when token does not exist', () => {
    // Get the request interceptor function
    const axiosInstance = axios.create();
    const requestInterceptor = axiosInstance.interceptors.request.use.mock.calls[0][0];
    
    // Mock localStorage.getItem to return null
    const originalGetItem = localStorage.getItem;
    localStorage.getItem = jest.fn().mockReturnValue(null);
    
    // Mock config object
    const config = { headers: {} };
    
    // Call the interceptor
    const result = requestInterceptor(config);
    
    // Check that Authorization header was not added
    expect(result.headers.Authorization).toBeUndefined();
    
    // Restore original localStorage.getItem
    localStorage.getItem = originalGetItem;
  });

  test('response interceptor retries once on resource error', async () => {
    // Get the response interceptor function
    const axiosInstance = axios.create();
    const responseInterceptor = axiosInstance.interceptors.response.use.mock.calls[0][1];
    
    // Mock retry function for this test
    const mockRetryFn = jest.fn().mockResolvedValue('success');
    axiosInstance.mockImplementation(() => mockRetryFn());
    
    // Create a network error
    const error = new Error('Network Error');
    error.config = { method: 'get', url: '/test', _retry: false };
    
    // Mock setTimeout to execute immediately
    jest.useFakeTimers();
    const originalSetTimeout = global.setTimeout;
    global.setTimeout = (fn) => fn();
    
    // Use a flag to track if we reached the expected point
    let caughtError = false;
    
    // Call the interceptor with try/catch to handle the expected rejection
    try {
      await responseInterceptor(error);
    } catch (e) {
      // Don't do conditional expect here
      caughtError = true;
    }
    
    // Now do the expect outside of the try/catch
    expect(caughtError).toBe(false);
    expect(error.config._retry).toBe(true);
    
    // Restore setTimeout
    global.setTimeout = originalSetTimeout;
    jest.useRealTimers();
  });

  test('response interceptor does not retry if already retried', async () => {
    // Get the response interceptor function
    const axiosInstance = axios.create();
    const responseInterceptor = axiosInstance.interceptors.response.use.mock.calls[0][1];
    
    // Create a network error with retry flag already set
    const error = new Error('Network Error');
    error.config = { method: 'get', url: '/test', _retry: true };
    
    // Create a promise that we can test against
    const promise = responseInterceptor(error);
    
    // Use a more direct approach to verify rejection
    await expect(promise).rejects.toThrow('Network Error');
  });
});