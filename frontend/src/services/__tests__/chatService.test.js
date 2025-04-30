import * as chatService from '../chatService';
import API from '../api';

// Mock axios/API
jest.mock('../api', () => ({
  post: jest.fn(),
}));

describe('chatService', () => {
  const mockMessage = 'Hello AI';
  const mockResponse = {
    response: 'This is a test response from the AI.'
  };
  
  const mockPlan = JSON.stringify({
    subject: 'Mathematics',
    sessions: [
      { date: '2025-05-01', start: '14:00', duration: 60 },
      { date: '2025-05-03', start: '10:00', duration: 90 }
    ]
  });

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Mock API.post to return a successful response
    API.post.mockImplementation(() => Promise.resolve({ 
      data: mockResponse,
      status: 200
    }));
  });

  test('askAI calls API with correct data', async () => {
    const result = await chatService.askAI({ message: mockMessage });
    
    expect(API.post).toHaveBeenCalledWith('/chat/', { message: mockMessage });
    expect(result).toEqual(mockResponse);
  });

  test('extractSchedulePlan calls API with correct data and system prompt', async () => {
    // Override the default mock for this specific test
    API.post.mockImplementationOnce(() => Promise.resolve({ 
      data: { response: mockPlan },
      status: 200
    }));
    
    const result = await chatService.extractSchedulePlan(mockMessage);
    
    expect(API.post).toHaveBeenCalledWith('/chat/', {
      message: mockMessage,
      system: expect.stringContaining('extractstructuredstudyplans')
    });
    expect(result).toEqual(mockPlan);
  });

  test('askAI handles API error', async () => {
    // Mock API error
    const error = new Error('API error');
    API.post.mockRejectedValueOnce(error);
    
    // Check that the error is propagated
    await expect(chatService.askAI({ message: mockMessage })).rejects.toThrow(error);
  });

  test('extractSchedulePlan handles API error', async () => {
    // Mock API error
    const error = new Error('API error');
    API.post.mockRejectedValueOnce(error);
    
    // Check that the error is propagated
    await expect(chatService.extractSchedulePlan(mockMessage)).rejects.toThrow(error);
  });

  test('extractSchedulePlan includes current date in system prompt', async () => {
    // Override the default mock for this specific test
    API.post.mockImplementationOnce(() => Promise.resolve({ 
      data: { response: mockPlan },
      status: 200
    }));
    
    await chatService.extractSchedulePlan(mockMessage);
    
    // Get the system prompt from the API call
    const apiCallArgs = API.post.mock.calls[0][1];
    const systemPrompt = apiCallArgs.system;
    
    // Check that the system prompt includes today's date
    const today = new Date().toISOString().split("T")[0];
    expect(systemPrompt).toContain(`Today is ${today}`);
  });
});