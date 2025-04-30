import React, { useState, useEffect } from 'react';
import LoginForm from './components/LoginForm';
import Chatbot from './components/Chatbot';
import StudyPlanner from './components/StudyPlanner';
import Sidebar from './components/Sidebar';
import FocusTracker from './components/FocusTracker';
import KanbanBoard from './components/KanbanBoard';
import StudyGroups from './components/StudyGroups';
import Gamification from './components/Gamification';
import Onboarding from './components/Onboarding';
import UserProfile from './components/UserProfile';

import { getProfile } from './services/onboardingService';
import { isAuthenticated, getToken } from './services/authService';

const App = () => {
  /* ────────── state ────────── */
  const [user, setUser] = useState(null);

  /** 选中的侧边栏 Tab，持久化到 localStorage */
  const [selectedTab, setSelectedTab] = useState(() => {
    return localStorage.getItem('selectedTab') || 'chatbot';
  });

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [hasProfile,   setHasProfile]   = useState(false);
  const [loading,      setLoading]      = useState(true);
  const [isNewUser,    setIsNewUser]    = useState(false);   // 第一次注册

  /* ────────── helpers ────────── */
  const handleSetUser = (userData) => {
    if (userData?.isNewUser) setIsNewUser(true);
    setUser(userData);
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
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    setHasProfile(true);
    setIsNewUser(false);
    localStorage.setItem('onboardingCompleted', 'true');
  };

  /* ────────── effect: token / profile 检查 ────────── */
  useEffect(() => {
    // 若是刚注册的新用户，直接进入 onboarding
    if (user && isNewUser) {
      setShowOnboarding(true);
      setHasProfile(false);
      setLoading(false);
      return;
    }

    const lastCheckTime = localStorage.getItem('lastProfileCheck');
    const now           = Date.now();
    if (lastCheckTime && now - Number(lastCheckTime) < 60_000) {
      // 一分钟以内不重复调用后端
      setLoading(false);
      return;
    }

    const checkAuthAndProfile = async () => {
      if (!isAuthenticated()) {
        setLoading(false);
        return;
      }

      try {
        const payload = JSON.parse(atob(getToken().split('.')[1]));
        const userData = { user_id: payload.user_id, username: payload.username };
        setUser(userData);

        // 检查是否已完成 onboarding
        if (localStorage.getItem('onboardingCompleted') === 'true') {
          setHasProfile(true);
          setShowOnboarding(false);
        } else {
          try {
            await getProfile(payload.user_id);    // 若存在 profile
            setHasProfile(true);
            setShowOnboarding(false);
            localStorage.setItem('onboardingCompleted', 'true');
          } catch (err) {
            // 404 说明 profile 不存在
            if (err.response?.status === 404) {
              setHasProfile(false);
              setShowOnboarding(true);
            } else {
              // 其他错误：默认认为 profile 存在，避免死循环
              setHasProfile(true);
              setShowOnboarding(false);
            }
          }
        }
      } catch (e) {
        console.error('Invalid token:', e);
        localStorage.removeItem('token');
      } finally {
        localStorage.setItem('lastProfileCheck', now.toString());
        setLoading(false);
      }
    };

    checkAuthAndProfile();
  }, [user, isNewUser]);

  /* ────────── UI ────────── */
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-100 to-green-100">
        <p className="text-xl">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-100 to-green-100">
      {/* 未登录 → 登录页 */}
      {!user ? (
        <LoginForm setUser={handleSetUser} />

      /* 首次登录 → Onboarding */
      ) : showOnboarding ? (
        <Onboarding user={user} onComplete={handleOnboardingComplete} />

      /* 主界面 */
      ) : (
        <div className="flex w-full">
          {/* 侧边栏 */}
          <Sidebar setSelectedTab={handleTabChange} handleLogout={handleLogout} />

          {/* 主内容 */}
          <div className="flex-1 p-8">
            <h1 className="text-4xl font-extrabold text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-green-500">
              AI Study Coach
            </h1>
            <h2 className="text-lg font-medium text-center text-gray-700">
              Welcome, {user.username}!
            </h2>

            {/* 动态渲染组件 */}
            {selectedTab === 'chatbot'       && <Chatbot user={user} />}
            {selectedTab === 'studyPlanner'  && <StudyPlanner user={user} />}
            {selectedTab === 'focusTracker'  && <FocusTracker user={user} />}
            {selectedTab === 'kanban'        && <KanbanBoard />}
            {selectedTab === 'studyGroups'   && <StudyGroups user={user} />}
            {selectedTab === 'gamification'  && <Gamification user={user} />}
            {selectedTab === 'profile'       && <UserProfile user={user} />}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
