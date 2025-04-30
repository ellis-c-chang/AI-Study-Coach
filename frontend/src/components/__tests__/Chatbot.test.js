import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Chatbot from '../Chatbot';
import * as chatService from '../../services/chatService';
import * as sessionService from '../../services/sessionService';

// Mock the service functions
jest.mock('../../services/chatService', () => ({
  askAI: jest.fn(),
  extractSchedulePlan: jest.fn()
}));

jest.mock('../../services/sessionService', () => ({
  createStudySession: jest.fn()
}));

describe('Chatbot Component', () => {
  const mockUser = { user_id: 1, username: 'testuser' };
  
  beforeEach(() => {
    // Clear mock call history and localStorage before each test
    jest.clearAllMocks();
    localStorage.clear();
    
    // Mock speech synthesis
    window.speechSynthesis.speak = jest.fn();
  });

  test('renders chatbot with welcome message', () => {
    render(<Chatbot user={mockUser} />);
    
    // Check that chatbot UI elements are rendered
    expect(screen.getByText('AI Chat Assistant')).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Ask me anything...")).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /voice/i })).toBeInTheDocument();
    
    // Check that welcome message is shown
    expect(screen.getByText('Coach')).toBeInTheDocument();
    expect(screen.getByText(/I'm your AI Study Assistant/)).toBeInTheDocument();
  });

  test('handles sending a message and receiving a response', async () => {
    // Mock successful response from AI
    chatService.askAI.mockResolvedValue({ response: 'This is a test response from the AI.' });
    
    render(<Chatbot user={mockUser} />);
    
    // Type a message
    fireEvent.change(screen.getByPlaceholderText("Ask me anything..."), {
      target: { value: 'Hello AI' }
    });
    
    // Send the message
    fireEvent.click(screen.getByRole('button', { name: /send/i }));
    
    // Check that user message appears in chat
    expect(screen.getByText('You')).toBeInTheDocument();
    expect(screen.getByText('Hello AI')).toBeInTheDocument();
    
    // Check that askAI was called with correct message
    expect(chatService.askAI).toHaveBeenCalledWith({ message: 'Hello AI' });
    
    // Wait for Coach label (AI response)
    await waitFor(() => {
      expect(screen.getAllByText('Coach').length).toBeGreaterThan(1);
    });
    
    // Check AI response content in separate waitFor
    await waitFor(() => {
      expect(screen.getByText('This is a test response from the AI.')).toBeInTheDocument();
    });
    
    // Check that text-to-speech was called
    expect(window.speechSynthesis.speak).toHaveBeenCalled();
  });

  test('handles study planning requests', async () => {
    // Mock successful extraction of study plan
    const mockPlan = JSON.stringify({
      subject: 'Mathematics',
      sessions: [
        { date: '2025-05-01', start: '14:00', duration: 60 },
        { date: '2025-05-03', start: '10:00', duration: 90 }
      ]
    });
    
    chatService.extractSchedulePlan.mockResolvedValue(mockPlan);
    
    render(<Chatbot user={mockUser} />);
    
    // Type a planning message
    fireEvent.change(screen.getByPlaceholderText("Ask me anything..."), {
      target: { value: 'I have a math exam next week, can you help me create a study schedule?' }
    });
    
    // Send the message
    fireEvent.click(screen.getByRole('button', { name: /send/i }));
    
    // Check that extractSchedulePlan was called
    expect(chatService.extractSchedulePlan).toHaveBeenCalledWith(
      'I have a math exam next week, can you help me create a study schedule?'
    );
    
    // Wait for plan preview to appear - check for subject first
    await waitFor(() => {
      expect(screen.getByText(/Based on your input, I generated a study plan/)).toBeInTheDocument();
    });
    
    // Check dates in separate waitFor
    await waitFor(() => {
      expect(screen.getByText(/Mathematics/)).toBeInTheDocument();
    });
    
    await waitFor(() => {
      expect(screen.getByText(/2025-05-01/)).toBeInTheDocument();
    });
    
    await waitFor(() => {
      expect(screen.getByText(/type "confirm"/i)).toBeInTheDocument();
    });
    
    // Confirm the plan
    fireEvent.change(screen.getByPlaceholderText("Ask me anything..."), {
      target: { value: 'Confirm' }
    });
    
    fireEvent.click(screen.getByRole('button', { name: /send/i }));
    
    // Check that first session was created
    await waitFor(() => {
      expect(sessionService.createStudySession).toHaveBeenCalledWith({
        user_id: 1,
        subject: 'Mathematics',
        scheduled_time: '2025-05-01T14:00',
        duration: 60
      });
    });
    
    // Check that second session was created
    await waitFor(() => {
      expect(sessionService.createStudySession).toHaveBeenCalledWith({
        user_id: 1,
        subject: 'Mathematics',
        scheduled_time: '2025-05-03T10:00',
        duration: 90
      });
    });
    
    // Check confirmation message
    await waitFor(() => {
      expect(screen.getByText(/Schedule added to your calendar!/)).toBeInTheDocument();
    });
  });

  test('handles cancellation of study plan', async () => {
    // Mock successful extraction of study plan
    const mockPlan = JSON.stringify({
      subject: 'Physics',
      sessions: [
        { date: '2025-05-05', start: '16:00', duration: 60 }
      ]
    });
    
    chatService.extractSchedulePlan.mockResolvedValue(mockPlan);
    
    render(<Chatbot user={mockUser} />);
    
    // Type a planning message
    fireEvent.change(screen.getByPlaceholderText("Ask me anything..."), {
      target: { value: 'Help me prepare for my physics exam' }
    });
    
    // Send the message
    fireEvent.click(screen.getByRole('button', { name: /send/i }));
    
    // Wait for plan preview to appear
    await waitFor(() => {
      expect(screen.getByText(/Based on your input, I generated a study plan/)).toBeInTheDocument();
    });
    
    // Cancel the plan
    fireEvent.change(screen.getByPlaceholderText("Ask me anything..."), {
      target: { value: 'Cancel' }
    });
    
    fireEvent.click(screen.getByRole('button', { name: /send/i }));
    
    // Check that no sessions were created
    expect(sessionService.createStudySession).not.toHaveBeenCalled();
    
    // Check cancellation message
    await waitFor(() => {
      expect(screen.getByText(/The schedule has been discarded/)).toBeInTheDocument();
    });
  });

  test('handles voice input when available', () => {
    render(<Chatbot user={mockUser} />);
    
    // Click voice button
    fireEvent.click(screen.getByRole('button', { name: /voice/i }));
    
    // Check that recognition was started
    expect(window.webkitSpeechRecognition.mock.instances[0].start).toHaveBeenCalled();
    
    // Simulate recognition result
    const recognitionInstance = window.webkitSpeechRecognition.mock.instances[0];
    const mockTranscript = 'This is a voice message';
    const mockEvent = {
      results: [
        [
          { transcript: mockTranscript }
        ]
      ]
    };
    
    recognitionInstance.onresult(mockEvent);
    
    // Check that the input field was updated
    expect(screen.getByDisplayValue(mockTranscript)).toBeInTheDocument();
  });

  test('handles error in AI response', async () => {
    // Mock failed response from AI
    chatService.askAI.mockRejectedValue(new Error('Network error'));
    
    // Spy on console.error
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    render(<Chatbot user={mockUser} />);
    
    // Type a message
    fireEvent.change(screen.getByPlaceholderText("Ask me anything..."), {
      target: { value: 'Hello AI' }
    });
    
    // Send the message
    fireEvent.click(screen.getByRole('button', { name: /send/i }));
    
    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText(/Error: Failed to get response from the AI/)).toBeInTheDocument();
    });
    
    // Check that error was logged
    expect(consoleErrorSpy).toHaveBeenCalled();
    
    // Restore console.error
    consoleErrorSpy.mockRestore();
  });

  test('handles plan modification request', async () => {
    // Mock initial plan extraction
    const initialPlan = JSON.stringify({
      subject: 'Chemistry',
      sessions: [
        { date: '2025-05-10', start: '14:00', duration: 60 }
      ]
    });
    
    // Mock modified plan extraction
    const modifiedPlan = JSON.stringify({
      subject: 'Chemistry',
      sessions: [
        { date: '2025-05-12', start: '16:00', duration: 90 }
      ]
    });
    
    chatService.extractSchedulePlan.mockResolvedValueOnce(initialPlan);
    chatService.extractSchedulePlan.mockResolvedValueOnce(modifiedPlan);
    
    render(<Chatbot user={mockUser} />);
    
    // Type a planning message
    fireEvent.change(screen.getByPlaceholderText("Ask me anything..."), {
      target: { value: 'I need to study chemistry' }
    });
    
    // Send the message
    fireEvent.click(screen.getByRole('button', { name: /send/i }));
    
    // Wait for plan preview to appear
    await waitFor(() => {
      expect(screen.getByText(/Based on your input, I generated a study plan/)).toBeInTheDocument();
    });
    
    // Request modification
    fireEvent.change(screen.getByPlaceholderText("Ask me anything..."), {
      target: { value: 'Can we move it to Monday at 4pm and make it 90 minutes?' }
    });
    
    fireEvent.click(screen.getByRole('button', { name: /send/i }));
    
    // Check that extractSchedulePlan was called again
    expect(chatService.extractSchedulePlan).toHaveBeenCalledTimes(2);
    
    // Wait for modified plan to appear - check updated text first
    await waitFor(() => {
      expect(screen.getByText(/Based on your input, I updated the study plan/)).toBeInTheDocument();
    });
    
    // Check date in separate waitFor
    await waitFor(() => {
      expect(screen.getByText(/2025-05-12/)).toBeInTheDocument();
    });
    
    // Check time in separate waitFor
    await waitFor(() => {
      expect(screen.getByText(/16:00/)).toBeInTheDocument();
    });
    
    // Check duration in separate waitFor
    await waitFor(() => {
      expect(screen.getByText(/90 mins/)).toBeInTheDocument();
    });
  });

  test('persists chat history in localStorage', async () => {
    // Setup localStorage spy
    const setItemSpy = jest.spyOn(window.localStorage, 'setItem');
    
    // Mock AI response
    chatService.askAI.mockResolvedValue({ response: 'Test response' });
    
    render(<Chatbot user={mockUser} />);
    
    // Type and send a message
    fireEvent.change(screen.getByPlaceholderText("Ask me anything..."), {
      target: { value: 'Test message' }
    });
    fireEvent.click(screen.getByRole('button', { name: /send/i }));
    
    // Wait for response
    await waitFor(() => {
      expect(screen.getByText('Test response')).toBeInTheDocument();
    });
    
    // Check that localStorage was updated with chat history
    expect(setItemSpy).toHaveBeenCalledWith('chatLog', expect.any(String));
    
    // Parse saved chat log
    const savedChatLog = JSON.parse(setItemSpy.mock.calls.find(call => call[0] === 'chatLog')[1]);
    
    // Verify chat log structure
    expect(savedChatLog).toBeInstanceOf(Array);
    expect(savedChatLog.length).toBeGreaterThan(1);
    
    // Check user message separately
    expect(savedChatLog).toContainEqual({
      sender: 'user',
      text: 'Test message'
    });
    
    // Check AI response separately
    expect(savedChatLog).toContainEqual({
      sender: 'ai',
      text: 'Test response'
    });
    
    // Clean up
    setItemSpy.mockRestore();
  });
});