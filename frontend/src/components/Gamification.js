// frontend/src/components/Gamification.js
import React, { useState, useEffect } from 'react';
import { getUserAchievements, getUserPoints, getPointTransactions, getLeaderboard } from '../services/gamificationService';

const Gamification = ({ user }) => {
  const [achievements, setAchievements] = useState([]);
  const [points, setPoints] = useState({});
  const [transactions, setTransactions] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGamificationData = async () => {
      setLoading(true);
      try {
        const [achievementsData, pointsData, transactionsData, leaderboardData] = await Promise.all([
          getUserAchievements(user.user_id),
          getUserPoints(user.user_id),
          getPointTransactions(user.user_id),
          getLeaderboard()
        ]);
        
        setAchievements(achievementsData);
        setPoints(pointsData);
        setTransactions(transactionsData);
        setLeaderboard(leaderboardData);
      } catch (error) {
        console.error("Error loading gamification data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchGamificationData();
  }, [user.user_id]);

  // Level progress as percentage
  const progressPercentage = points.progress ? (points.progress) : 0;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-center mb-6">Study Achievement Center</h2>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500">Loading your achievements...</p>
        </div>
      ) : (
        <>
          {/* Tab Navigation */}
          <div className="flex border-b mb-6">
            <button
              className={`px-4 py-2 font-medium ${activeTab === 'overview' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button
              className={`px-4 py-2 font-medium ${activeTab === 'achievements' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
              onClick={() => setActiveTab('achievements')}
            >
              Achievements
            </button>
            <button
              className={`px-4 py-2 font-medium ${activeTab === 'history' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
              onClick={() => setActiveTab('history')}
            >
              Point History
            </button>
            <button
              className={`px-4 py-2 font-medium ${activeTab === 'leaderboard' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
              onClick={() => setActiveTab('leaderboard')}
            >
              Leaderboard
            </button>
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div>
              <div className="flex flex-col md:flex-row items-center justify-around p-4 bg-blue-50 rounded-lg mb-6">
                <div className="text-center mb-4 md:mb-0">
                  <p className="text-gray-600">Current Level</p>
                  <h3 className="text-4xl font-bold text-blue-600">{points.level}</h3>
                </div>
                
                <div className="w-full md:w-1/2">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Progress to Level {points.level + 1}</span>
                    <span>{points.progress}/100</span>
                  </div>
                  <div className="h-4 w-full bg-gray-200 rounded-full">
                    <div 
                      className="h-full bg-blue-600 rounded-full transition-all" 
                      style={{ width: `${progressPercentage}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="text-center mt-4 md:mt-0">
                  <p className="text-gray-600">Total Points</p>
                  <h3 className="text-4xl font-bold text-green-600">{points.total_points}</h3>
                </div>
              </div>
              
              <h3 className="text-xl font-semibold mb-4">Recent Achievements</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {achievements.length === 0 ? (
                  <p className="text-gray-500 col-span-3 text-center py-4">
                    You haven't earned any achievements yet. Keep studying!
                  </p>
                ) : (
                  achievements.slice(0, 3).map(achievement => (
                    <div key={achievement.id} className="border rounded-lg p-4 flex items-center">
                      <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mr-4">
                        <span className="text-yellow-600 text-2xl">🏆</span>
                      </div>
                      <div>
                        <h4 className="font-semibold">{achievement.name}</h4>
                        <p className="text-sm text-gray-600">{achievement.description}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              <h3 className="text-xl font-semibold mb-4">Recent Activity</h3>
              <div className="border rounded-lg divide-y">
                {transactions.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    No recent point activity.
                  </p>
                ) : (
                  transactions.slice(0, 5).map(tx => (
                    <div key={tx.id} className="p-3 flex justify-between items-center">
                      <div>
                        <p className="font-medium">{tx.reason}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(tx.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-green-600 font-bold">+{tx.amount}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Achievements Tab */}
          {activeTab === 'achievements' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {achievements.length === 0 ? (
                <p className="text-gray-500 col-span-2 text-center py-4">
                  You haven't earned any achievements yet. Keep studying!
                </p>
              ) : (
                achievements.map(achievement => (
                  <div key={achievement.id} className="border rounded-lg p-4">
                    <div className="flex items-center mb-3">
                      <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mr-4">
                        <span className="text-yellow-600 text-2xl">🏆</span>
                      </div>
                      <h4 className="text-lg font-semibold">{achievement.name}</h4>
                    </div>
                    <p className="text-gray-600 mb-2">{achievement.description}</p>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">
                        Earned on {new Date(achievement.earned_at).toLocaleDateString()}
                      </span>
                      <span className="text-green-600 font-medium">+{achievement.points} pts</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Point History Tab */}
          {activeTab === 'history' && (
            <div className="border rounded-lg divide-y">
              {transactions.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No point activity yet.
                </p>
              ) : (
                transactions.map(tx => (
                  <div key={tx.id} className="p-4 flex justify-between items-center">
                    <div>
                      <p className="font-medium">{tx.reason}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(tx.created_at).toLocaleDateString()} at {new Date(tx.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="text-green-600 font-bold">+{tx.amount}</div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Leaderboard Tab */}
          {activeTab === 'leaderboard' && (
            <div className="border rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Level
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Points
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {leaderboard.map((entry, index) => (
                    <tr key={entry.user_id} className={entry.user_id === user.user_id ? "bg-blue-50" : ""}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">#{index + 1}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {entry.username}
                          {entry.user_id === user.user_id && (
                            <span className="ml-2 text-xs text-blue-600">(You)</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">Level {entry.level}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-green-600">{entry.total_points}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Gamification;