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
  const [selectedTab, setSelectedTab] = useState(() => {
    const savedTab = localStorage.getItem('selectedTab');
    return savedTab || 'chatbot';
  });
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false); // New state for new user

  const handleSetUser = (userData) => {
    if (userData?.isNewUser) {
      setIsNewUser(true);
    }
    setUser(userData);
  };

  const handleTabChange = (tab) => {
    setSelectedTab(tab);
    localStorage.setItem('selectedTab', tab); // Save selected tab to local storage
  }

  useEffect(() => {
    // Check if user is authenticated
    if (user && isNewUser) {
      setShowOnboarding(true);
      setHasProfile(false);
      console.log("New user detected, showing onboarding.");
      return;
    }
    const checkAuth = async () => {
      if (isAuthenticated()) {
          try {
          const tokenData = JSON.parse(atob(getToken().split('.')[1]));
          const userData = {
            user_id: tokenData.user_id,
            username: tokenData.username
          };
          setUser(userData);
          
          // Check if user has completed onboarding
          try {
            await getProfile(tokenData.user_id);
            console.log("Profile found, skipping onboarding");
            setHasProfile(true);
            setShowOnboarding(false);
          } catch (error) {
            console.log("No existing profile found, starting onboarding.");
            setHasProfile(false);
            setShowOnboarding(true);
          }
        } catch (error) {
          console.error("Error parsing token:", error);
          localStorage.removeItem('token'); // Clear invalid token
        }
      }
      setLoading(false);
    };
    
    checkAuth();
  }, [user, isNewUser])

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    setHasProfile(true);
    setIsNewUser(false);
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

  console.log("Rendering with states:", { user, showOnboarding, hasProfile });

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-100 to-green-100">
      {!user ? (
        <LoginForm setUser={handleSetUser} />
      ) : isNewUser || showOnboarding ? (
        <Onboarding user={user} onComplete={handleOnboardingComplete} />
      ) : (
        <div className="flex w-full">
          {/* Sidebar Component */}
          <Sidebar setSelectedTab={handleTabChange} handleLogout={handleLogout} />

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
