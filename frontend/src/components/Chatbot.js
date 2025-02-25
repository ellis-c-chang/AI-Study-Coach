import React, { useState } from 'react';
import { askAI } from '../services/chatService';

const Chatbot = () => {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const reply = await askAI({ message });
      setResponse(reply.response);
      setMessage('');
    } catch (err) {
      console.error(err);
      alert('Failed to get a response from AI');
    }
  };

  return (
    <div className="flex flex-col w-full bg-gradient-to-br from-blue-100 to-green-100 p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold text-gray-800 text-center mb-4">AI Chat Assistant</h2>
      <form onSubmit={handleSubmit} className="flex items-center gap-3">
        <input
          type="text"
          placeholder="Ask me anything..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="flex-1 p-3 rounded-md border shadow-sm outline-none focus:ring-2 focus:ring-blue-400"
        />
        <button type="submit" className="px-5 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition">
          Send
        </button>
      </form>
      {response && (
        <div className="mt-4 p-4 bg-white shadow rounded-md">
          <strong>AI:</strong> {response}
        </div>
      )}
    </div>
  );
};

export default Chatbot;

