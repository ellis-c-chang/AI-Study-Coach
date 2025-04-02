import React, { useEffect, useState, useRef } from 'react';
import { askAI } from '../services/chatService';

const Chatbot = () => {
  const [message, setMessage] = useState('');
  const [chatLog, setChatLog] = useState([]);
  const chatEndRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    const userMessage = { sender: 'user', text: message };
    setChatLog((prev) => [...prev, userMessage]);
    try {
      const reply = await askAI({ message });
      const aiMessage = { sender: 'ai', text: reply.response };
      setChatLog((prev) => [...prev, aiMessage]);
    } catch (err) {
      console.error(err);
      setChatLog((prev) => [...prev, { sender: 'ai', text: 'Error: Failed to get response from the AI' }]);
    }
    setMessage('');
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatLog]);

  return (
    <div className="flex flex-col w-full bg-gradient-to-br from-blue-100 to-green-100 p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold text-gray-800 text-center mb-4">AI Chat Assistant</h2>
      <div className="flex-1 overflow-y-auto bg-white rounded-md shadow-inner p-r space-y-4 mb-4">
        {chatLog.map((msg, index) => (
          <div key={index} className={`p-3 rounded-lg max-w-[75%] ${msg.sender === 'user' ? 'bg-blue-200 self-end text-right ml-auto' : 'bg-green-200 self-start text-left'}`}>
            <span className="block text-sm text-gray-600 mb-1">
              {msg.sender === 'user' ? 'You' : 'AI'}
            </span>
            <span className="text-gray-900">{msg.text}</span>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>
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
    </div>
  );
};

export default Chatbot;

