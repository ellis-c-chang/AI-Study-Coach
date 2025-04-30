import React, { useState, useEffect } from 'react';
import LoginForm from './components/LoginForm';
import Chatbot from './components/Chatbot';
import StudyPlanner from './components/StudyPlanner';
import Sidebar from './components/Sidebar';
import FocusTracker from './components/FocusTracker';
import KanbanBoard from './components/KanbanBoard';
import StudyGroups from './components/StudyGroups'; // ✅ 合并你的新增内容
import Gamification from './components/Gamification';
import Onboarding from './components/Onboarding';
import UserProfile from './components/UserProfile';
import { getProfile } from './services/onboardingService';
import { isAuthenticated, getToken } from './services/authService';

const App = () => {
  const [user, setUser] = useState(null);
  const [selectedTab, setSelectedTab] = useState(() => {
    const savedTab = localStorage.getItem('selectedTab');
    return savedTab || 'chatbot';
  });
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);

  const handleSetUser = (userData) => {
    if (userData?.isNewUser) {
      setIsNewUser(true);
    }
    setUser(userData);
  };

  const handleTabChange = (tab) => {
    setSelectedTab(tab);
    localStorage.setItem('selectedTab', tab);
  };

  useEffect(() => {
    if (user && isNewUser) {
      setShowOnboarding(true);
      setHasProfile(false);
      return;
    }

    const lastCheckTime = localStorage.getItem('lastProfileCheck');
    const currentTime = Date.now();
    if (lastCheckTime && currentTime - parseInt(lastCheckTime) < 60000) {
      setLoading(false);
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
          localStorage.setItem('lastProfileCheck', currentTime.toString());

          const onboardingCompleted = localStorage.getItem('onboardingCompleted') === 'true';
          if (onboardingCompleted) {
            setShowOnboarding(false);
            setHasProfile(true);
          } else {
            try {
              await getProfile(tokenData.user_id);
              setHasProfile(true);
              setShowOnboarding(false);
              localStorage.setItem('onboardingCompleted', 'true');
            } catch (error) {
              if (error.response?.status === 404) {
                setHasProfile(false);
                setShowOnboarding(true);
              } else {
                setHasProfile(true);
                setShowOnboarding(false);
              }
            }
          }
        } catch (error) {
          console.error("Error parsing token:", error);
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [user, isNewUser]);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    setHasProfile(true);
    setIsNewUser(false);
  };

  const handleLogout = () => {
    setUser(null);
    setSelectedTab('chatbot');
    setShowOnboarding(false);
    setHasProfile(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-100 to-green-100">
        <p className="text-xl">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-100 to-green-100">
      {!user ? (
        <LoginForm setUser={handleSetUser} />
      ) : isNewUser || showOnboarding ? (
        <Onboarding user={user} onComplete={handleOnboardingComplete} />
      ) : (
        <div className="flex w-full">
          <Sidebar setSelectedTab={handleTabChange} handleLogout={handleLogout} />
          <div className="flex-1 p-8">
            <h1 className="text-4xl font-extrabold text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-green-500">
              AI Study Coach
            </h1>
            <h2 className="text-lg font-medium text-center text-gray-700">
              Welcome, {user.username}!
            </h2>

            {/* ✅ 所有功能入口都保留 */}
            {selectedTab === 'chatbot' && <Chatbot user={user} />}
            {selectedTab === 'studyPlanner' && <StudyPlanner user={user} />}
            {selectedTab === 'focusTracker' && <FocusTracker user={user} />}
            {selectedTab === 'kanban' && <KanbanBoard />}
            {selectedTab === 'studyGroups' && <StudyGroups user={user} />}
            {selectedTab === 'gamification' && <Gamification user={user} />}
            {selectedTab === 'profile' && <UserProfile user={user} />}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
