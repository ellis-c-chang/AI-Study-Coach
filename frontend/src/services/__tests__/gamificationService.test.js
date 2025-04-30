import * as gamificationService from '../gamificationService';
import API from '../api';

// Mock axios/API
jest.mock('../api', () => ({
  get: jest.fn(),
  post: jest.fn(),
}));

describe('gamificationService', () => {
  const mockUserId = 1;
  const mockSessionId = 2;
  
  const mockAchievements = [
    {
      id: 1,
      name: 'First Steps',
      description: 'Complete your first study session',
      points: 10,
      badge_image: 'badges/first_steps.png',
      earned_at: new Date().toISOString()
    }
  ];
  
  const mockPoints = {
    user_id: mockUserId,
    total_points: 50,
    level: 1,
    next_level_points: 100,
    progress: 50
  };
  
  const mockTransactions = [
    {
      id: 1,
      amount: 10,
      reason: 'Completed study session: Math',
      created_at: new Date().toISOString()
    }
  ];
  
  const mockLeaderboard = [
    {
      user_id: 1,
      username: 'testuser',
      total_points: 50,
      level: 1
    },
    {
      user_id: 2,
      username: 'user2',
      total_points: 120,
      level: 2
    }
  ];
  
  const mockSessionPoints = {
    points_awarded: 10,
    new_achievements: []
  };

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  test('getUserAchievements calls API with correct endpoint', async () => {
    // Mock API response
    API.get.mockResolvedValueOnce({ data: mockAchievements });
    
    const result = await gamificationService.getUserAchievements(mockUserId);
    
    expect(API.get).toHaveBeenCalledWith(`/gamification/user/${mockUserId}/achievements`);
    expect(result).toEqual(mockAchievements);
  });

  test('getUserPoints calls API with correct endpoint', async () => {
    // Mock API response
    API.get.mockResolvedValueOnce({ data: mockPoints });
    
    const result = await gamificationService.getUserPoints(mockUserId);
    
    expect(API.get).toHaveBeenCalledWith(`/gamification/user/${mockUserId}/points`);
    expect(result).toEqual(mockPoints);
  });

  test('getPointTransactions calls API with correct endpoint', async () => {
    // Mock API response
    API.get.mockResolvedValueOnce({ data: mockTransactions });
    
    const result = await gamificationService.getPointTransactions(mockUserId);
    
    expect(API.get).toHaveBeenCalledWith(`/gamification/user/${mockUserId}/transactions`);
    expect(result).toEqual(mockTransactions);
  });

  test('getLeaderboard calls API with correct endpoint', async () => {
    // Mock API response
    API.get.mockResolvedValueOnce({ data: mockLeaderboard });
    
    const result = await gamificationService.getLeaderboard();
    
    expect(API.get).toHaveBeenCalledWith('/gamification/leaderboard');
    expect(result).toEqual(mockLeaderboard);
  });

  test('awardSessionPoints calls API with correct endpoint and data', async () => {
    // Mock API response
    API.post.mockResolvedValueOnce({ data: mockSessionPoints });
    
    const result = await gamificationService.awardSessionPoints(mockSessionId);
    
    expect(API.post).toHaveBeenCalledWith(`/gamification/award-session-points/${mockSessionId}`);
    expect(result).toEqual(mockSessionPoints);
  });

  test('getUserAchievements handles API error', async () => {
    // Mock API error
    const error = new Error('API error');
    API.get.mockRejectedValueOnce(error);
    
    // Check that the error is propagated
    await expect(gamificationService.getUserAchievements(mockUserId)).rejects.toThrow(error);
  });

  test('getUserPoints handles API error', async () => {
    // Mock API error
    const error = new Error('API error');
    API.get.mockRejectedValueOnce(error);
    
    // Check that the error is propagated
    await expect(gamificationService.getUserPoints(mockUserId)).rejects.toThrow(error);
  });

  test('getPointTransactions handles API error', async () => {
    // Mock API error
    const error = new Error('API error');
    API.get.mockRejectedValueOnce(error);
    
    // Check that the error is propagated
    await expect(gamificationService.getPointTransactions(mockUserId)).rejects.toThrow(error);
  });

  test('getLeaderboard handles API error', async () => {
    // Mock API error
    const error = new Error('API error');
    API.get.mockRejectedValueOnce(error);
    
    // Check that the error is propagated
    await expect(gamificationService.getLeaderboard()).rejects.toThrow(error);
  });

  test('awardSessionPoints handles API error', async () => {
    // Mock API error
    const error = new Error('API error');
    API.post.mockRejectedValueOnce(error);
    
    // Check that the error is propagated
    await expect(gamificationService.awardSessionPoints(mockSessionId)).rejects.toThrow(error);
  });
});