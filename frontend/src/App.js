import React, { useState } from 'react';
import LoginForm from './components/LoginForm';
import Chatbot from './components/Chatbot';
import StudyPlanner from './components/StudyPlanner';

const App = () => {
  const [user, setUser] = useState(null);

  return (
    <div className="container mx-auto p-4">
      {!user ? (
        <LoginForm setUser={setUser} />
      ) : (
        <>
          <h1 className="text-2xl font-bold mb-4">Welcome, {user.username}!</h1>
          <Chatbot />
          <StudyPlanner user={user} />
        </>
      )}
    </div>
  );
};

export default App;
