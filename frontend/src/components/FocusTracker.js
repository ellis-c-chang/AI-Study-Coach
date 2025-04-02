import React, { useEffect, useState } from 'react';
import { getStudySessions } from '../services/sessionService';

const FocusTracker = ({ user }) => {
  const [sessions, setSessions] = useState([]);

  const fetchSessions = async () => {
    const data = await getStudySessions(user.user_id);
    setSessions(data);
  }

  useEffect(() => {
    fetchSessions();
  }, []);

  const total = sessions.length;
  const completed = sessions.filter(session => session.completed).length;
  const upcoming = sessions.filter(session => !session.completed).length;
  const completedToday = sessions.filter(session => {
    const sessionDate = new Date(session.scheduled_time).toDateString();
    const today = new Date().toDateString();
    return session.completed && sessionDate === today;
  }).length;
  const remaining = total - completed;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold text-gray-800 text-center mb-4">Focus Tracker</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
        <div className="bg-green-100 p-4 rounded">
          <p className="text-3xl font-bold text-green-700">{total}</p>
          <p className="text-sm text-green-700">Total Sessions</p>
        </div>
        <div className="bg-blue-100 p-4 rounded">
          <p className="text-3xl font-bold text-blue-700">{completed}</p>
          <p className="text-sm text-blue-700">Completed</p>
        </div>
        <div className="bg-yellow-100 p-4 rounded">
          <p className="text-3xl font-bold text-yellow-700">{upcoming}</p>
          <p className="text-sm text-yellow-700">Upcoming</p>
        </div>
        <div className="bg-purple-100 p-4 rounded">
          <p className="text-3xl font-bold text-purple-700">{completedToday}</p>  
          <p className="text-sm text-purple-700">Completed Today</p>
        </div>
      </div>
      <h2 className="text-2xl font-semibold text-gray-800 text-center mb-4">Progress Bar</h2>
      <div className="h-4 w-full bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-green-500 transition-all"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      <p className="mt-2 text-sm text-gray-700">
        {completed} completed / {total} total ({progress}%)
      </p>
      <p className="text-xs text-gray-500">🕒 {remaining} sessions remaining</p>
    </div>
  );
};

export default FocusTracker;
