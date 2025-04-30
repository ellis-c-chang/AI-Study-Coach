// frontend/src/App.js
import React, { useState, useEffect } from 'react';

import LoginForm      from './components/LoginForm';
import Chatbot        from './components/Chatbot';
import StudyPlanner   from './components/StudyPlanner';
import Sidebar        from './components/Sidebar';
import FocusTracker   from './components/FocusTracker';
import KanbanBoard    from './components/KanbanBoard';
import StudyGroups    from './components/StudyGroups';
import Gamification   from './components/Gamification';
import Onboarding     from './components/Onboarding';
import UserProfile    from './components/UserProfile';

import { getProfile }          from './services/onboardingService';
import { isAuthenticated,
         getToken }            from './services/authService';

const App = () => {
  /* ----------------------------- state ----------------------------- */
  const [user,        setUser]        = useState(null);
  const [selectedTab, setSelectedTab] = useState(() => (
    localStorage.getItem('selectedTab') || 'chatbot'
  ));
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [hasProfile,     setHasProfile]     = useState(false);
  const [loading,        setLoading]        = useState(true);
  const [isNewUser,      setIsNewUser]      = useState(false);

  /* --------------------------- helpers ----------------------------- */
  const handleSetUser = (data) => {
    if (data?.isNewUser) setIsNewUser(true);
    setUser(data);
  };

  const handleTabChange = (tab) => {
    setSelectedTab(tab);
    localStorage.setItem('selectedTab', tab);
  };

  const handleLogout = () => {
    setUser(null);
    setSelectedTab('chatbot');
    setShowOnboarding(false);
    setHasProfile(false);
    localStorage.removeItem('token');
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    setHasProfile(true);
    setIsNewUser(false);
    localStorage.setItem('onboardingCompleted', 'true');
  };

  /* -------------------------- effects ------------------------------ */
  useEffect(() => {
    // 新注册用户：直接进入 onboarding
    if (user && isNewUser) {
      setShowOnboarding(true);
      setHasProfile(false);
      setLoading(false);
      return;
    }

    // 频率限制：1 min 以内不重复调用 profile API
    const last = localStorage.getItem('lastProfileCheck');
    if (last && Date.now() - Number(last) < 60_000) {
      setLoading(false);
      return;
    }

    const checkAuth = async () => {
      if (!isAuthenticated()) {
        setLoading(false);
        return;
      }

      try {
        const payload  = JSON.parse(atob(getToken().split('.')[1]));
        const userData = { user_id: payload.user_id, username: payload.username };
        setUser(userData);

        // Onboarding / profile
        if (localStorage.getItem('onboardingCompleted') === 'true') {
          setHasProfile(true);
          setShowOnboarding(false);
        } else {
          try {
            await getProfile(payload.user_id);           // 有 profile
            setHasProfile(true);
            setShowOnboarding(false);
            localStorage.setItem('onboardingCompleted', 'true');
          } catch (err) {
            if (err.response?.status === 404) {          // 无 profile → onboarding
              setHasProfile(false);
              setShowOnboarding(true);
            } else {                                     // 其他错误：假设已完成
              setHasProfile(true);
              setShowOnboarding(false);
            }
          }
        }
      } catch (e) {
        console.error('Invalid token:', e);
        localStorage.removeItem('token');
      } finally {
        localStorage.setItem('lastProfileCheck', Date.now().toString());
        setLoading(false);
      }
    };

    checkAuth();
  }, [user, isNewUser]);

  /* --------------------------- render ------------------------------ */
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-100 to-green-100">
        <p className="text-xl">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-100 to-green-100">
      {/* 未登录 */}
      {!user ? (
        <LoginForm setUser={handleSetUser} />
      ) : (isNewUser || showOnboarding) ? (
        /* 新用户 / 需要 onboarding */
        <Onboarding user={user} onComplete={handleOnboardingComplete} />
      ) : (
        /* 主应用 */
        <div className="flex w-full">
          <Sidebar setSelectedTab={handleTabChange} handleLogout={handleLogout} />

          <div className="flex-1 p-8">
            <h1 className="text-4xl font-extrabold text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-green-500">
              AI Study Coach
            </h1>
            <h2 className="text-lg font-medium text-center text-gray-700">
              Welcome, {user.username}!
            </h2>

            {selectedTab === 'chatbot'       && <Chatbot       user={user} />}
            {selectedTab === 'studyPlanner'  && <StudyPlanner  user={user} />}
            {selectedTab === 'focusTracker'  && <FocusTracker  user={user} />}
            {selectedTab === 'kanban'        && <KanbanBoard                />}
            {selectedTab === 'studyGroups'   && <StudyGroups   user={user} />}
            {selectedTab === 'gamification'  && <Gamification user={user} />}
            {selectedTab === 'profile'       && <UserProfile   user={user} />}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
