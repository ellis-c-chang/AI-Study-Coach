import React from 'react';

const Sidebar = ({ setSelectedTab }) => {
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
        {/* 🆕 新加一项 Study Groups */}
        <li 
          onClick={() => setSelectedTab('studyGroups')} 
          className="cursor-pointer hover:bg-gray-700 p-2 rounded"
        >
          👥 Study Groups
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;
