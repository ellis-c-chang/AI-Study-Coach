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
    <div className="p-4 shadow-lg rounded-lg bg-white">
      <h2 className="text-xl font-bold mb-2">Ask the AI</h2>
      <form onSubmit={handleSubmit} className="flex flex-col">
        <input
          type="text"
          placeholder="Ask a question..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="block w-full p-2 border rounded mb-2"
        />
        <button type="submit" className="bg-green-500 text-white p-2 rounded">
          Send
        </button>
      </form>
      {response && (
        <div className="mt-4 bg-gray-100 p-3 rounded">
          <strong>AI Response:</strong> {response}
        </div>
      )}
    </div>
  );
};

export default Chatbot;
