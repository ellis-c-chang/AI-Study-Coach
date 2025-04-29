import React from 'react';
import { logout } from '../services/authService';


const Sidebar = ({ setSelectedTab, handleLogout }) => {
  const onLogout = () => {
    logout();
    handleLogout();
  };

  return (
    <div className="w-64 bg-gray-900 text-white p-6 min-h-screen">
      <h2 className="text-2xl font-bold mb-6">📚 Study Dashboard</h2>
      <ul className="space-y-4">
        <li 
          onClick={() => setSelectedTab('chatbot')} 
          className="cursor-pointer hover:bg-gray-700 p-2 rounded"
        >
          🤖 AI Chatbot
        </li>
        <li 
          onClick={() => setSelectedTab('studyPlanner')} 
          className="cursor-pointer hover:bg-gray-700 p-2 rounded"
        >
          📅 Study Planner
        </li>
        <li 
          onClick={() => setSelectedTab('focusTracker')} 
          className="cursor-pointer hover:bg-gray-700 p-2 rounded"
        >
          ⏳ Focus Tracker
        </li>
        <li 
          onClick={() => setSelectedTab('kanban')} 
          className="cursor-pointer hover:bg-gray-700 p-2 rounded"
        >
          📌 To-Do List
        </li>
        <li 
          onClick={() => setSelectedTab('gamification')} 
          className="cursor-pointer hover:bg-gray-700 p-2 rounded"
        >
          🏆 Achievements
        </li>
        <li
          onClick={() => setSelectedTab('profile')}
          className="cursor-pointer hover:bg-gray-700 p-2 rounded"
        >
          👤 My Profile
        </li>
        
        <div className="border-t border-gray-700 my-4"></div>
        
        <li 
          onClick={onLogout}
          className="cursor-pointer hover:bg-red-700 p-2 rounded text-red-400 hover:text-white"
        >
          🚪 Sign Out
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;
