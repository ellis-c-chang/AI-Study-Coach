import React, { useState } from 'react';
import LoginForm from './components/LoginForm';
import Chatbot from './components/Chatbot';
import StudyPlanner from './components/StudyPlanner';

const App = () => {
  const [user, setUser] = useState(null);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 to-green-100 p-4">
      {!user ? (
        <LoginForm setUser={setUser} />
      ) : (
        <div className="w-full max-w-5xl p-8 space-y-6">
          <h1 className="text-4xl font-extrabold text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-green-500">
            AI Study Coach
          </h1>
          <h2 className="text-lg font-medium text-center text-gray-700">
            Welcome, {user.username}!
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Chatbot />
            <StudyPlanner user={user} />
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
