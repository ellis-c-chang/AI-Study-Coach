// src/mocks/handlers.js
import { rest } from 'msw';

// Base URL for API endpoints
const API_URL = 'https://ai-study-coach.onrender.com';

export const handlers = [
  // Auth endpoints
  rest.post(`${API_URL}/auth/register`, (req, res, ctx) => {
    return res(
      ctx.status(201),
      ctx.json({
        message: 'User registered successfully!'
      })
    );
  }),

  rest.post(`${API_URL}/auth/login`, (req, res, ctx) => {
    const { email, password } = req.body;
    
    // Simple validation for test
    if (email === 'test@example.com' && password === 'password123') {
      return res(
        ctx.status(200),
        ctx.json({
          message: 'Login successful!',
          user_id: 1,
          username: 'testuser',
          token: 'fake-jwt-token'
        })
      );
    }
    
    return res(
      ctx.status(401),
      ctx.json({
        error: 'Invalid email or password'
      })
    );
  }),

  // Study Sessions endpoints
  rest.get(`${API_URL}/study_sessions/:userId`, (req, res, ctx) => {
    const userId = req.params.userId;
    
    return res(
      ctx.status(200),
      ctx.json([
        {
          id: 1,
          subject: 'Math',
          duration: 60,
          scheduled_time: new Date(Date.now() + 86400000).toISOString(),
          start_time: new Date().toISOString(),
          completed: false
        },
        {
          id: 2,
          subject: 'Science',
          duration: 45,
          scheduled_time: new Date(Date.now() - 86400000).toISOString(),
          start_time: new Date(Date.now() - 86400000).toISOString(),
          completed: true
        }
      ])
    );
  }),

  rest.post(`${API_URL}/study_sessions/`, (req, res, ctx) => {
    return res(
      ctx.status(201),
      ctx.json({
        message: 'Study session created successfully',
        id: 3
      })
    );
  }),

  rest.put(`${API_URL}/study_sessions/:sessionId`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        message: 'Session updated successfully'
      })
    );
  }),

  rest.put(`${API_URL}/study_sessions/complete/:sessionId`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        message: 'Session marked as completed'
      })
    );
  }),

  rest.delete(`${API_URL}/study_sessions/:sessionId`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        message: 'Session deleted successfully'
      })
    );
  }),

  // Kanban endpoints
  rest.get(`${API_URL}/kanban/`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json([
        {
          id: 1,
          title: 'Complete math homework',
          status: 'todo',
          user_id: 1,
          created_at: new Date().toISOString()
        },
        {
          id: 2,
          title: 'Read science chapter',
          status: 'inProgress',
          user_id: 1,
          created_at: new Date().toISOString()
        },
        {
          id: 3,
          title: 'Submit essay',
          status: 'done',
          user_id: 1,
          created_at: new Date().toISOString()
        }
      ])
    );
  }),

  rest.get(`${API_URL}/kanban/user/:userId`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json([
        {
          id: 1,
          title: 'Complete math homework',
          status: 'todo',
          user_id: parseInt(req.params.userId),
          created_at: new Date().toISOString()
        },
        {
          id: 2,
          title: 'Read science chapter',
          status: 'inProgress',
          user_id: parseInt(req.params.userId),
          created_at: new Date().toISOString()
        }
      ])
    );
  }),

  rest.post(`${API_URL}/kanban/`, (req, res, ctx) => {
    const { title, status, user_id } = req.body;
    
    return res(
      ctx.status(201),
      ctx.json({
        id: 4,
        title,
        status,
        user_id,
        created_at: new Date().toISOString()
      })
    );
  }),

  rest.put(`${API_URL}/kanban/:taskId`, (req, res, ctx) => {
    const { title, status } = req.body;
    const taskId = parseInt(req.params.taskId);
    
    return res(
      ctx.status(200),
      ctx.json({
        id: taskId,
        title,
        status,
        user_id: 1,
        created_at: new Date().toISOString()
      })
    );
  }),

  rest.delete(`${API_URL}/kanban/:taskId`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        message: 'Deleted'
      })
    );
  }),

  // Chatbot endpoints
  rest.post(`${API_URL}/chat/`, (req, res, ctx) => {
    const { message, system } = req.body;
    
    // If extracting schedule
    if (system && system.includes('extractstructuredstudyplans')) {
      return res(
        ctx.status(200),
        ctx.json({
          response: JSON.stringify({
            subject: 'Exam Preparation',
            sessions: [
              { date: '2025-05-02', start: '18:00', duration: 60 },
              { date: '2025-05-03', start: '14:00', duration: 90 }
            ]
          })
        })
      );
    }
    
    return res(
      ctx.status(200),
      ctx.json({
        response: `AI response to: "${message}"`
      })
    );
  }),

  // Gamification endpoints
  rest.get(`${API_URL}/gamification/achievements`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json([
        {
          id: 1,
          name: 'First Steps',
          description: 'Complete your first study session',
          points: 10,
          badge_image: 'badges/first_steps.png'
        },
        {
          id: 2,
          name: 'Study Streak',
          description: 'Complete study sessions for 3 days in a row',
          points: 30,
          badge_image: 'badges/streak.png'
        }
      ])
    );
  }),

  rest.get(`${API_URL}/gamification/user/:userId/achievements`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json([
        {
          id: 1,
          name: 'First Steps',
          description: 'Complete your first study session',
          points: 10,
          badge_image: 'badges/first_steps.png',
          earned_at: new Date().toISOString()
        }
      ])
    );
  }),

  rest.get(`${API_URL}/gamification/user/:userId/points`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        user_id: parseInt(req.params.userId),
        total_points: 50,
        level: 1,
        next_level_points: 100,
        progress: 50
      })
    );
  }),

  rest.get(`${API_URL}/gamification/user/:userId/transactions`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json([
        {
          id: 1,
          amount: 10,
          reason: 'Completed study session: Math',
          created_at: new Date().toISOString()
        },
        {
          id: 2,
          amount: 30,
          reason: 'Achievement: First Steps',
          created_at: new Date().toISOString()
        }
      ])
    );
  }),

  rest.get(`${API_URL}/gamification/leaderboard`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json([
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
        },
        {
          user_id: 3,
          username: 'user3',
          total_points: 80,
          level: 1
        }
      ])
    );
  }),

  rest.post(`${API_URL}/gamification/award-session-points/:sessionId`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        points_awarded: 10,
        new_achievements: []
      })
    );
  }),

  // Onboarding endpoints
  rest.post(`${API_URL}/onboarding/profile`, (req, res, ctx) => {
    return res(
      ctx.status(201),
      ctx.json({
        message: 'Profile created successfully',
        profile_id: 1
      })
    );
  }),

  rest.get(`${API_URL}/onboarding/profile/:userId`, (req, res, ctx) => {
    const userId = parseInt(req.params.userId);
    
    // If testing for nonexistent profile
    if (userId === 999) {
      return res(
        ctx.status(404),
        ctx.json({
          error: 'Profile not found'
        })
      );
    }
    
    return res(
      ctx.status(200),
      ctx.json({
        id: 1,
        user_id: userId,
        study_style: 'Visual',
        preferred_study_time: 'morning',
        grade_level: 'undergraduate',
        subjects: ['Mathematics', 'Computer Science'],
        goals: 'Improve my grades and study more consistently',
        quiz_responses: {
          environment: 'Quiet room',
          learning_preference: 'Reading',
          time_management: 'I plan everything in advance',
          note_taking: 'Digital/typed notes',
          review_method: 'Practice tests'
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    );
  }),

  rest.put(`${API_URL}/onboarding/profile/:userId`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        message: 'Profile updated successfully'
      })
    );
  }),

  // Study Groups endpoints
  rest.get(`${API_URL}/groups/my`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json([
        {
          group_id: 1,
          name: 'Python Study Group',
          description: 'A group for studying Python programming',
          join_code: 'PY123'
        },
        {
          group_id: 2,
          name: 'Math Study Group',
          description: 'A group for studying Mathematics',
          join_code: 'MATH456'
        }
      ])
    );
  }),

  rest.post(`${API_URL}/groups`, (req, res, ctx) => {
    const { name, description } = req.body;
    
    return res(
      ctx.status(201),
      ctx.json({
        group_id: 3,
        name,
        description,
        join_code: 'NEW789'
      })
    );
  }),

  rest.post(`${API_URL}/groups/join`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        message: 'Successfully joined',
        group_id: 4
      })
    );
  }),

  rest.post(`${API_URL}/groups/leave`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        message: 'Successfully left the group.'
      })
    );
  }),

  rest.get(`${API_URL}/groups/:groupId/members`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json([
        {
          user_id: 1,
          username: 'testuser',
          email: 'test@example.com'
        },
        {
          user_id: 2,
          username: 'user2',
          email: 'user2@example.com'
        }
      ])
    );
  }),

  rest.get(`${API_URL}/groups/:groupId/sessions`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json([
        {
          id: 1,
          subject: 'Group Python Study',
          scheduled_time: new Date(Date.now() + 86400000).toISOString(),
          duration: 90
        },
        {
          id: 2,
          subject: 'Group Project Planning',
          scheduled_time: new Date(Date.now() + 172800000).toISOString(),
          duration: 60
        }
      ])
    );
  }),

  rest.post(`${API_URL}/groups/:groupId/sessions`, (req, res, ctx) => {
    return res(
      ctx.status(201),
      ctx.json({
        message: 'Group session added and synced to all members'
      })
    );
  })
];