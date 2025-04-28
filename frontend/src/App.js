import React, { useState } from 'react';
import LoginForm from './components/LoginForm';
import Chatbot from './components/Chatbot';
import StudyPlanner from './components/StudyPlanner';
import Sidebar from './components/Sidebar';
import FocusTracker from './components/FocusTracker';
import KanbanBoard from './components/KanbanBoard'; // ✅ Import KanbanBoard

const App = () => {
  const [user, setUser] = useState(null);
  const [selectedTab, setSelectedTab] = useState('chatbot'); // Default to Chatbot

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-100 to-green-100">
      {!user ? (
        <LoginForm setUser={setUser} />
      ) : (
        <div className="flex w-full">
          {/* Sidebar Component */}
          <Sidebar setSelectedTab={setSelectedTab} />

          {/* Main Content Area */}
          <div className="flex-1 p-8">
            <h1 className="text-4xl font-extrabold text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-green-500">
              AI Study Coach
            </h1>
            <h2 className="text-lg font-medium text-center text-gray-700">
              Welcome, {user.username}!
            </h2>

            {/* Render Components Dynamically */}
            {selectedTab === 'chatbot' && <Chatbot user={user} />}
            {selectedTab === 'studyPlanner' && <StudyPlanner user={user} />}
            {selectedTab === 'focusTracker' && <FocusTracker user={user} />}
            {selectedTab === 'kanban' && <KanbanBoard />} {/* ✅ Add Kanban Board */}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
