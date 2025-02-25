import React, { useState, useEffect } from 'react';
import { createStudySession, getStudySessions } from '../services/sessionService';

const StudyPlanner = ({ user }) => {
  const [subject, setSubject] = useState('');
  const [duration, setDuration] = useState('');
  const [sessions, setSessions] = useState([]);

  const fetchSessions = async () => {
    const data = await getStudySessions(user.user_id);
    setSessions(data);
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await createStudySession({ user_id: user.user_id, subject, duration });
    setSubject('');
    setDuration('');
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
        <input
          type="number"
          placeholder="Duration (minutes)"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          className="p-3 rounded-md border shadow-sm outline-none focus:ring-2 focus:ring-green-400"
        />
        <button type="submit" className="px-5 py-3 bg-green-500 text-white rounded-md hover:bg-green-600 transition">
          Add Session
        </button>
      </form>
      {sessions.length > 0 && (
        <ul className="mt-4 divide-y divide-gray-200 bg-white p-4 rounded-md shadow">
          {sessions.map((session) => (
            <li key={session.id} className="py-2">
              📚 {session.subject} - {session.duration} mins
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default StudyPlanner;

