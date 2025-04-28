import React, { useState, useEffect } from 'react';
import LoginForm from './components/LoginForm';
import Chatbot from './components/Chatbot';
import StudyPlanner from './components/StudyPlanner';
import Sidebar from './components/Sidebar';
import FocusTracker from './components/FocusTracker';
import KanbanBoard from './components/KanbanBoard'; // ✅ Import KanbanBoard
import Gamification from './components/Gamification';
import Onboarding from './components/Onboarding';
import { getProfile } from './services/onboardingService';
import { isAuthenticated, getToken } from './services/authService';
import UserProfile from './components/UserProfile';


const App = () => {
  const [user, setUser] = useState(null);
  const [selectedTab, setSelectedTab] = useState('chatbot'); // Default to Chatbot
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      if (isAuthenticated()) {
        const tokenData = JSON.parse(atob(getToken().split('.')[1]));
        setUser({ 
          user_id: tokenData.user_id, 
          username: tokenData.username 
        });
        
        // Check if user has completed onboarding
        try {
          await getProfile(tokenData.user_id);
          setHasProfile(true);
        } catch (error) {
          setShowOnboarding(true);
        }
      }
      setLoading(false);
    };
    
    checkAuth();
  }, []);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    setHasProfile(true);
  };

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-100 to-green-100">
      <p className="text-xl">Loading...</p>
    </div>;
  }

  const handleLogout = () => {
    setUser(null);
    setSelectedTab('chatbot');
    setShowOnboarding(false);
    setHasProfile(false);
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-100 to-green-100">
      {!user ? (
        <LoginForm setUser={setUser} />
      ) : showOnboarding && !hasProfile ? (
        <Onboarding user={user} onComplete={handleOnboardingComplete} />
      ) : (
        <div className="flex w-full">
          {/* Sidebar Component */}
          <Sidebar setSelectedTab={setSelectedTab} handleLogout={handleLogout} />

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
            {selectedTab === 'gamification' && <Gamification user={user} />}
            {selectedTab === 'profile' && <UserProfile user={user} />}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
