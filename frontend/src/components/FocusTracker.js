// frontend/src/components/FocusTracker.js
import React, { useEffect, useState } from 'react';
import { getStudySessions } from '../services/sessionService';
import { Line, Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const FocusTracker = ({ user }) => {
  const [sessions, setSessions] = useState([]);
  const [timeRange, setTimeRange] = useState('week'); // 'week', 'month', 'all'
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    upcoming: 0,
    completedToday: 0,
    streak: 0,
    mostProductiveDay: '',
    mostProductiveHour: '',
    subjectBreakdown: {},
    weeklyProgress: [],
  });

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const data = await getStudySessions(user.user_id);
      setSessions(data);
      calculateStats(data);
    } catch (error) {
      console.error("Error fetching sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [user.user_id]);

  const calculateStats = (sessionData) => {
    // Basic counts
    const total = sessionData.length;
    const completed = sessionData.filter(session => session.completed).length;
    const upcoming = sessionData.filter(session => !session.completed).length;
    
    const today = new Date().toDateString();
    const completedToday = sessionData.filter(session => {
      const sessionDate = new Date(session.scheduled_time).toDateString();
      return session.completed && sessionDate === today;
    }).length;

    // Calculate streak (consecutive days with completed sessions)
    let streak = 0;
    const sessionsByDate = {};
    
    // Group completed sessions by date
    sessionData.forEach(session => {
      if (!session.completed) return;
      
      const date = new Date(session.scheduled_time).toDateString();
      if (!sessionsByDate[date]) {
        sessionsByDate[date] = [];
      }
      sessionsByDate[date].push(session);
    });
    
    // Calculate current streak
    let currentDate = new Date();
    while (true) {
      const dateStr = currentDate.toDateString();
      if (sessionsByDate[dateStr] && sessionsByDate[dateStr].length > 0) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }

    // Most productive day and hour
    const dayCount = { 'Monday': 0, 'Tuesday': 0, 'Wednesday': 0, 'Thursday': 0, 'Friday': 0, 'Saturday': 0, 'Sunday': 0 };
    const hourCount = Array(24).fill(0);
    
    sessionData.forEach(session => {
      if (!session.completed) return;
      
      const date = new Date(session.scheduled_time);
      const day = date.toLocaleDateString('en-US', { weekday: 'long' });
      const hour = date.getHours();
      
      dayCount[day]++;
      hourCount[hour]++;
    });
    
    const mostProductiveDay = Object.keys(dayCount).reduce((a, b) => dayCount[a] > dayCount[b] ? a : b, 'Monday');
    const mostProductiveHour = hourCount.indexOf(Math.max(...hourCount));

    // Subject breakdown
    const subjectBreakdown = {};
    sessionData.forEach(session => {
      if (!subjectBreakdown[session.subject]) {
        subjectBreakdown[session.subject] = { completed: 0, total: 0 };
      }
      subjectBreakdown[session.subject].total++;
      if (session.completed) {
        subjectBreakdown[session.subject].completed++;
      }
    });

    // Weekly progress (last 7 days)
    const weeklyProgress = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toDateString();
      
      const sessionsOnDay = sessionsByDate[dateStr] || [];
      weeklyProgress.push({
        date: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        count: sessionsOnDay.length,
      });
    }

    setStats({
      total,
      completed,
      upcoming,
      completedToday,
      streak,
      mostProductiveDay,
      mostProductiveHour: `${mostProductiveHour}:00`,
      subjectBreakdown,
      weeklyProgress,
    });
  };

  // Chart data for weekly progress
  const weeklyChartData = {
    labels: stats.weeklyProgress.map(day => day.date),
    datasets: [
      {
        label: 'Completed Sessions',
        data: stats.weeklyProgress.map(day => day.count),
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgb(75, 192, 192)',
        borderWidth: 2,
        tension: 0.1,
      },
    ],
  };

  // Chart data for subject breakdown
  const subjectChartData = {
    labels: Object.keys(stats.subjectBreakdown),
    datasets: [
      {
        label: 'Completed',
        data: Object.values(stats.subjectBreakdown).map(subject => subject.completed),
        backgroundColor: [
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 99, 132, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
        ],
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold text-gray-800 text-center mb-4">Focus Tracker</h2>
      
      {loading ? (
        <div className="text-center py-8">Loading your study data...</div>
      ) : (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-center mb-8">
            <div className="bg-green-100 p-4 rounded">
              <p className="text-3xl font-bold text-green-700">{stats.total}</p>
              <p className="text-sm text-green-700">Total Sessions</p>
            </div>
            <div className="bg-blue-100 p-4 rounded">
              <p className="text-3xl font-bold text-blue-700">{stats.completed}</p>
              <p className="text-sm text-blue-700">Completed</p>
            </div>
            <div className="bg-yellow-100 p-4 rounded">
              <p className="text-3xl font-bold text-yellow-700">{stats.upcoming}</p>
              <p className="text-sm text-yellow-700">Upcoming</p>
            </div>
            <div className="bg-purple-100 p-4 rounded">
              <p className="text-3xl font-bold text-purple-700">{stats.streak}</p>  
              <p className="text-sm text-purple-700">Day Streak</p>
            </div>
          </div>

          {/* Insights Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <div className="bg-gray-100 p-4 rounded">
              <h3 className="font-semibold text-gray-700">Most Productive Day</h3>
              <p className="text-2xl font-bold text-indigo-600">{stats.mostProductiveDay}</p>
            </div>
            <div className="bg-gray-100 p-4 rounded">
              <h3 className="font-semibold text-gray-700">Most Productive Hour</h3>
              <p className="text-2xl font-bold text-indigo-600">{stats.mostProductiveHour}</p>
            </div>
          </div>

          {/* Weekly Progress Chart */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-700 mb-4">Weekly Progress</h3>
            <div className="h-64">
              <Bar data={weeklyChartData} options={{ maintainAspectRatio: false }} />
            </div>
          </div>

          {/* Subject Breakdown Chart */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-700 mb-4">Subject Breakdown</h3>
            <div className="h-64">
              <Pie data={subjectChartData} options={{ maintainAspectRatio: false }} />
            </div>
          </div>

          {/* Progress Bar */}
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Overall Completion Rate</h3>
          <div className="h-4 w-full bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all"
              style={{ width: `${stats.total > 0 ? (stats.completed / stats.total) * 100 : 0}%` }}
            ></div>
          </div>
          <p className="mt-2 text-sm text-gray-700">
            {stats.completed} completed / {stats.total} total ({stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%)
          </p>
        </>
      )}
    </div>
  );
};

export default FocusTracker;
