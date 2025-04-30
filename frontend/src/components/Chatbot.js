import React, { useEffect, useState, useRef } from 'react';
import { askAI, extractSchedulePlan } from '../services/chatService';
import { createStudySession } from '../services/sessionService';
import ReactMarkdown from 'react-markdown';

const Chatbot = ({ user }) => {
  const [message, setMessage] = useState('');
  const [chatLog, setChatLog] = useState(() => {
    const saved = localStorage.getItem('chatLog');
    return saved ? JSON.parse(saved) : [];
  });
  const [pendingPlan, setPendingPlan] = useState(null);
  const [isAwaitingConfirmation, setIsAwaitingConfirmation] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const chatEndRef = useRef(null);
  const recognitionRef = useRef(null);

  // Initialize voice recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new window.webkitSpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        console.log('Recognized:', transcript);
        setMessage(transcript);
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

  useEffect(() => {
    const saved = localStorage.getItem('chatLog');
    if (!saved) {
      const welcomeMessage =
        "Hello! I'm your AI Study Assistant. I can help you plan for exams, essays, and more.\nTry saying something like: 'I have an exam this Friday. Please help me generate a schedule.'";
      setChatLog([{ sender: 'ai', text: welcomeMessage }]);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    const userMessage = { sender: 'user', text: message };
    setChatLog((prev) => [...prev, userMessage]);
    setMessage('');

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
        const confirmMsg = 'Schedule added to your calendar! You can check it in the Study Planner tab.';
        setChatLog((prev) => [...prev, { sender: 'ai', text: confirmMsg }]);
        speakText(confirmMsg);
        setPendingPlan(null);
        setIsAwaitingConfirmation(false);
        return;
      }

      if (
        msgLower.includes('cancel') ||
        msgLower.includes('nevermind') ||
        msgLower.includes("don't need") ||
        msgLower.includes('no need')
      ) {
        const cancelMsg = 'Got it. The schedule has been discarded.';
        setChatLog((prev) => [...prev, { sender: 'ai', text: cancelMsg }]);
        speakText(cancelMsg);
        setPendingPlan(null);
        setIsAwaitingConfirmation(false);
        return;
      }

      const contextMessage =
        `The current schedule is for "${pendingPlan.subject}" with sessions:\n` +
        pendingPlan.sessions.map((s) => `${s.date} at ${s.start} for ${s.duration} mins`).join('\n') +
        `.\nThe user said: "${message}". Please generate a new full plan.`;

      const aiReply = await extractSchedulePlan(contextMessage);

      if (aiReply && aiReply.sessions) {
        const planText = `Based on your input, I updated the study plan for "${aiReply.subject || 'Study'}":\n` +
          aiReply.sessions.map(s => `• ${s.date} ${s.start} – ${s.duration} mins: ${aiReply.subject}`).join('\n');

        setPendingPlan(aiReply);
        const confirmText = "Let me know if you'd like to modify anything, or type 'confirm' to add this schedule to your calendar. Or type 'cancel' to discard it.";
        setChatLog((prev) => [
          ...prev,
          { sender: 'ai', text: planText },
          { sender: 'ai', text: confirmText }
        ]);
        speakText(planText + " " + confirmText);
      } else {
        const failMsg = "Sorry, I couldn't update the plan based on that. Could you rephrase?";
        setChatLog((prev) => [...prev, { sender: 'ai', text: failMsg }]);
        speakText(failMsg);
      }
      return;
    }

    const lower = message.toLowerCase();
    const planningKeywords = ["exam", "test", "essay", "due", "review", "schedule", "prepare"];
    const containsPlanningIntent = planningKeywords.some((word) => lower.includes(word));

    if (containsPlanningIntent) {
      try {
        const planStr = await extractSchedulePlan(message);
        const plan = JSON.parse(planStr);

        let preview = `Based on your input, I generated a study plan for "${plan.subject}":\n`;
        plan.sessions.forEach((s) => {
          preview += `• ${s.date} ${s.start} – ${s.duration} mins: ${plan.subject}\n`;
        });
        preview += `\nLet me know if you'd like to modify anything, or type "confirm" to add it to your calendar. Or type 'cancel' to discard it.`;

        setPendingPlan(plan);
        setIsAwaitingConfirmation(true);
        setChatLog((prev) => [...prev, { sender: 'ai', text: preview }]);
        speakText(preview);
      } catch (err) {
        console.error('Plan extraction failed:', err);
        const errMsg = "⚠️ Sorry, I couldn't understand the schedule. Please try rephrasing your message.";
        setChatLog((prev) => [...prev, { sender: 'ai', text: errMsg }]);
        speakText(errMsg);
      }
      return;
    }

    try {
      const reply = await askAI({ message });
      setChatLog((prev) => [...prev, { sender: 'ai', text: reply.response }]);
      speakText(reply.response);
    } catch (err) {
      console.error(err);
      const errMsg = 'Error: Failed to get response from the AI';
      setChatLog((prev) => [...prev, { sender: 'ai', text: errMsg }]);
      speakText(errMsg);
    }
  };

  useEffect(() => {
    localStorage.setItem('chatLog', JSON.stringify(chatLog));
  }, [chatLog]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatLog]);

  return (
    <div className="flex flex-col w-full h-[80vh] bg-gradient-to-br from-blue-100 to-green-100 p-6 rounded-lg shadow-md font-sans text-gray-800 text-base leading-relaxed">
      <h2 className="text-2xl font-semibold text-gray-800 text-center mb-4">AI Chat Assistant</h2>

      <div className="flex-1 overflow-y-auto bg-white rounded-md shadow-inner pr-4 space-y-4 mb-4">
        {chatLog.map((msg, index) => (
          <div key={index} className={`w-full flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`inline-block p-3 rounded-lg max-w-[75%] min-w-[50px] break-words ${
                msg.sender === 'user' ? 'bg-blue-200 text-right' : 'bg-green-200 text-left'
              }`}
            >
              <span className="block text-sm text-gray-600 mb-1">
                {msg.sender === 'user' ? 'You' : 'Coach'}
              </span>
              <ReactMarkdown
                components={{
                  p: ({ node, ...props }) => (
                    <p className="text-gray-900 whitespace-pre-line" {...props} />
                  ),
                }}
              >
                {msg.text}
              </ReactMarkdown>
            </div>
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
        <button
          type="submit"
          className="px-5 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
        >
          Send
        </button>
        <button
          type="button"
          onClick={handleVoiceInput}
          className="px-4 py-3 bg-purple-500 text-white rounded hover:bg-purple-600 transition"
        >
          {isListening ? 'Listening...' : '🎤 Voice'}
        </button>
      </form>
    </div>
  );
};

export default Chatbot;
