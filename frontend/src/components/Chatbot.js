import React, { useEffect, useState, useRef } from 'react';
import { askAI, extractSchedulePlan } from '../services/chatService';
import { createStudySession } from '../services/sessionService';

const Chatbot = ({ user }) => {
  const [message, setMessage] = useState('');
  const [chatLog, setChatLog] = useState(() => {
    const saved = localStorage.getItem('chatLog');
    return saved ? JSON.parse(saved) : [];
  });
  const [pendingPlan, setPendingPlan] = useState(null);
  const [isAwaitingConfirmation, setIsAwaitingConfirmation] = useState(false);
  const chatEndRef = useRef(null);


  useEffect(() => {
  const saved = localStorage.getItem('chatLog');
  if (!saved) {
    const welcomeMessage = "Hello! I'm your AI Study Assistant. I can help you plan for exams, essays, and more.\nTry saying something like: 'I have an exam this Friday. Please help me generate a schedule.'";
    setChatLog([{ sender: 'ai', text: welcomeMessage }]);
  }
}, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    const userMessage = { sender: 'user', text: message };
    setChatLog((prev) => [...prev, userMessage]);

    if (isAwaitingConfirmation && pendingPlan) {
  const msgLower = message.toLowerCase();

  if (msgLower.includes('confirm')) {
    for (let s of pendingPlan.sessions) {
      await createStudySession({
        user_id: user.user_id,
        subject: pendingPlan.subject || 'Study',
        scheduled_time: s.date + 'T' + s.start,
        duration: s.duration,
      });
    }
    setChatLog((prev) => [...prev, { sender: 'ai', text: 'Schedule added to your calendar! You can check it in the Study Planner tab.' }]);
    setPendingPlan(null);
    setIsAwaitingConfirmation(false);
  } else if (
    msgLower.includes('cancel') ||
    msgLower.includes('nevermind') ||
    msgLower.includes("don't need") ||
    msgLower.includes("no need")
  ) {
    setChatLog((prev) => [...prev, { sender: 'ai', text: 'Got it. The schedule has been discarded.' }]);
    setPendingPlan(null);
    setIsAwaitingConfirmation(false);
  } else {
      setChatLog((prev) => [...prev, {
      sender: 'ai',
      text: "Let me know if you'd like to modify anything, or type 'confirm' to add this schedule to your calendar. Or type 'cancel' to discard it.",
    }]);
  }
  return;
}


    const lower = message.toLowerCase();
    const planningKeywords = ["exam", "test", "essay", "due", "review", "schedule", "prepare"];
    const containsPlanningIntent = planningKeywords.some(word => lower.includes(word));

    if (containsPlanningIntent) {
      try {
        const planStr = await extractSchedulePlan(message);
        const plan = JSON.parse(planStr);

        let preview = `Based on your input, I generated a study plan for "${plan.subject}":\n`;
        plan.sessions.forEach(s => {
          preview += `• ${s.date} ${s.start} – ${s.duration} mins: ${plan.subject}\n`;
        });
        preview += `\nLet me know if you'd like to modify anything, or type "confirm" to add it to your calendar. Or type 'cancel' to discard it.`;

        setPendingPlan(plan);
        setIsAwaitingConfirmation(true);
        setChatLog((prev) => [...prev, { sender: 'ai', text: preview }]);
      } catch (err) {
        console.error("Plan extraction failed:", err);
        setChatLog((prev) => [...prev, {
          sender: 'ai',
          text: "⚠️ Sorry, I couldn't understand the schedule. Please try rephrasing your message."
        }]);
      }
      setMessage('');
      return;
    }

    try {
      const reply = await askAI({ message });
      setChatLog((prev) => [...prev, { sender: 'ai', text: reply.response }]);
    } catch (err) {
      console.error(err);
      setChatLog((prev) => [...prev, { sender: 'ai', text: 'Error: Failed to get response from the AI' }]);
    }

    setMessage('');
  };

  useEffect(() => {
   localStorage.setItem('chatLog', JSON.stringify(chatLog));
  }, [chatLog]);

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
            <span className="text-gray-900 whitespace-pre-line">{msg.text}</span>
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
