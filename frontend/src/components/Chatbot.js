import React, { useState, useRef, useEffect } from 'react';
import { askAI } from '../services/chatService';

const Chatbot = () => {
  const [message, setMessage] = useState('');
  const [chatLog, setChatLog] = useState([]);
  const [isListening, setIsListening] = useState(false);

  const recognitionRef = useRef(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new window.webkitSpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        console.log('Recognized:', transcript);
        setMessage(transcript); // 把识别结果放到输入框
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const handleVoiceInput = () => {
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const speakText = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    setChatLog((prev) => [...prev, { sender: 'user', text: message }]);
    setMessage('');

    try {
      const reply = await askAI({ message });
      setChatLog((prev) => [...prev, { sender: 'ai', text: reply.response }]);
      speakText(reply.response); // ✅ 让AI回答后直接朗读
    } catch (error) {
      console.error('Error fetching AI response:', error);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatLog.map((entry, index) => (
          <div
            key={index}
            className={`p-3 rounded-lg max-w-xs ${
              entry.sender === 'user'
                ? 'bg-blue-500 text-white self-end'
                : 'bg-gray-200 text-gray-900 self-start'
            }`}
          >
            {entry.text}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex p-4 space-x-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="flex-1 p-2 border rounded"
          placeholder="Type your message or use voice..."
        />
        <button
          type="submit"
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
        >
          Send
        </button>
        <button
          type="button"
          onClick={handleVoiceInput}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition"
        >
          {isListening ? 'Listening...' : '🎤 Voice'}
        </button>
      </form>
    </div>
  );
};

export default Chatbot;
