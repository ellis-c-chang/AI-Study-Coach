import React, { useState, useEffect } from 'react';
import { createStudySession, getStudySessions, completeStudySession } from '../services/sessionService';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css'; // Import the CSS for the calendar

const StudyPlanner = ({ user }) => {
  const [subject, setSubject] = useState('');
  const [duration, setDuration] = useState('');
  const [sessions, setSessions] = useState([]);
  const [scheduledTime, setScheduledTime] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());

  const fetchSessions = async () => {
    const data = await getStudySessions(user.user_id);
    const sorted = data.sort((a, b) => new Date(a.scheduled_time) - new Date(b.scheduled_time));
    setSessions(sorted);
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await createStudySession({ user_id: user.user_id, subject, duration, scheduled_time: new Date(scheduledTime).toISOString() });
    setSubject('');
    setDuration('');
    fetchSessions();
  };

  const getStatusClass = (session) => {
    const now = new Date();
    const scheduled = new Date(session.scheduled_time);
    return scheduled < now ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold';
  }

  const sessionsByDate = sessions.reduce((acc, session) => {
    const dateKey = new Date(session.scheduled_time).toDateString();
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(session);
    return acc;
  }, {});

  const handleComplete = async (id) => {
    await completeStudySession(id);
    fetchSessions();
  };

  return (
    <div className="flex flex-col w-full bg-gradient-to-br from-green-100 to-blue-100 p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold text-gray-800 text-center mb-4">Plan Your Study</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="text"
          placeholder="Enter subject..."
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="p-3 rounded-md border shadow-sm outline-none focus:ring-2 focus:ring-green-400"
        />
        <div className="flex flex-col md:flex-row gap-3">
          <input
            type="number"
            placeholder="Duration (minutes)"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="flex-1 p-3 rounded-md border shadow-sm outline-none focus:ring-2 focus:ring-green-400"
          />
          <input
            type="datetime-local"
            value={scheduledTime}
            onChange={(e) => setScheduledTime(e.target.value)}
            className="flex-1 p-3 rounded-md border shadow-sm outline-none focus:ring-2 focus:ring-green-400"
          />
        </div>
        <button type="submit" className="px-5 py-3 bg-green-500 text-white rounded-md hover:bg-green-600 transition">
          Add Session
        </button>
      </form>
      <div className="mt-6">
        <Calendar
          onChange={setSelectedDate}
          value={selectedDate}
          className="rounded-md shadow-sm mt-4"
          tileContent={({ date, view }) => {
            if (view !== 'month') return null;
            const dayKey = date.toDateString();
            const daySessions = sessionsByDate[dayKey] || [];
            return (
              <div className="flex flex-col items-center space-y-1 mt-1 text-xs">
                {daySessions.map((s) => (
                  <div
                    key={s.id}
                    className={`px-1 py-0.5 rounded text-white w-full truncate ${
                      s.completed ? 'bg-gray-400 line-through' : 'bg-green-500'
                    }`}
                    title={`${s.subject} - ${s.duration} mins`}
                  >
                    {s.subject}
                  </div>
                ))}
              </div>
            );
          }}
        />
      </div>
      {sessions.length > 0 && (
        <ul className="mt-4 divide-y divide-gray-200 bg-white p-4 rounded-md shadow">
          {sessions.map((session) => (
            <li key={session.id} className="py-2 flex justify-between items-center">
              <div>
                <span className={`font-medium ${session.completed ? 'line-through text-gray-400' : getStatusClass(session)}`}>
                📚 {session.subject} - {session.duration} mins
                </span>
              </div>
              {!session.completed && (
                <button
                  onClick={() => handleComplete(session.id)}
                  className="text-sm px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
                >
                  Mark as completed
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default StudyPlanner;

