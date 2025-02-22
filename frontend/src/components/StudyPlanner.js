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
    <div className="p-4 shadow-lg rounded-lg bg-white">
      <h2 className="text-xl font-bold mb-2">Study Planner</h2>
      <form onSubmit={handleSubmit} className="flex flex-col">
        <input
          type="text"
          placeholder="Subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="block w-full p-2 border rounded mb-2"
        />
        <input
          type="number"
          placeholder="Duration (minutes)"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          className="block w-full p-2 border rounded mb-2"
        />
        <button type="submit" className="bg-blue-500 text-white p-2 rounded">
          Add Study Session
        </button>
      </form>
      <ul className="mt-4">
        {sessions.map((session) => (
          <li key={session.id} className="p-2 border-b">
            {session.subject} - {session.duration} mins
          </li>
        ))}
      </ul>
    </div>
  );
};

export default StudyPlanner;
