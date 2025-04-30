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
