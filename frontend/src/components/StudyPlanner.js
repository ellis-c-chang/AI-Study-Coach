// StudyPlanner.js - Corrected and Improved Version

import React, { useState, useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import API from '../services/api';
import './StudyPlanner.css';
import { awardSessionPoints } from '../services/gamificationService';

const subjectColors = {
  Math: '#4f46e5',
  Science: '#10b981',
  History: '#f59e0b',
  English: '#ec4899',
  Art: '#8b5cf6',
  Physics: '#6366f1',
  Chemistry: '#f43f5e',
  Biology: '#22c55e',
  ComputerScience: '#3b82f6',
  Economics: '#f97316',
  Geography: '#0ea5e9',
  Psychology: '#c084fc',
  Philosophy: '#14b8a6',
  Music: '#e879f9',
  PE: '#06b6d4',
  Default: '#64748b'
};

const StudyPlanner = ({ user }) => {
  const [sessions, setSessions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [editSession, setEditSession] = useState(null);
  const [newSession, setNewSession] = useState({ subject: '', start: '', end: '' });
  const modalRef = useRef();
  const [todoTasks, setTodoTasks] = useState([]);

  const fetchTodoTasks = async () => {
    try {
      const res = await API.get(`/kanban/user/${user.user_id}`);
      console.log("🔥 Current user ID:", user?.user_id);

      setTodoTasks(res.data.filter(t => t.status !== 'done')); // 只要未完成的任务
    } catch (err) {
      console.error("Failed to fetch Kanban tasks:", err);
    }
  };
  


  const fetchSessions = async () => {
    try {
      const res = await API.get(`/study_sessions/${user.user_id}`);
      const data = res.data;
      const events = data.map((s) => ({
        id: s.id,
        title: s.subject,
        start: s.scheduled_time,
        end: new Date(new Date(s.scheduled_time).getTime() + s.duration * 60000).toISOString(),
        allDay: false,
        backgroundColor: subjectColors[s.subject] || subjectColors['Default'],
        borderColor: subjectColors[s.subject] || subjectColors['Default'],
        textColor: '#ffffff',
        className: s.completed ? 'completed-session' : '',
        completed: s.completed
      }));
      setSessions(events);
    } catch (err) {
      console.error('Failed to fetch study sessions:', err);
    }
  };

  useEffect(() => {
    fetchSessions();
    fetchTodoTasks();
  }, []);

  const handleDateClick = (arg) => {
    setSelectedSession(null);
    setNewSession({ subject: '', start: arg.dateStr, end: arg.dateStr });
    setShowModal(true);
  };

  const handleEventDoubleClick = (info) => {
    setSelectedSession({
      id: info.event.id,
      title: info.event.title,
      start: info.event.start.toISOString(),
      end: info.event.end ? info.event.end.toISOString() : info.event.start.toISOString(),
      completed: info.event.extendedProps.completed // 🆕 Add this!
    });
  
    setEditSession({
      subject: info.event.title.replace('✅ ', ''),
      start: info.event.start.toISOString().slice(0, 16),
      end: info.event.end ? info.event.end.toISOString().slice(0, 16) : info.event.start.toISOString().slice(0, 16)
    });
  
    setShowModal(true);
  };
  
  const createStudySession = async (payload) => {
    await API.post('/study_sessions/', payload);
  };

  const updateStudySession = async (id, payload) => {
    await API.put(`/study_sessions/${id}`, payload);
  };

  const deleteStudySession = async (id) => {
    await API.delete(`/study_sessions/${id}`);
  };

  const completeStudySession = async (id) => {
    await API.put(`/study_sessions/complete/${id}`);
  };

  const redoStudySession = async (id) => {
    await API.put(`/study_sessions/redo/${id}`);
  };

  const handleRedoSession = async () => {
    await redoStudySession(selectedSession.id);
    setShowModal(false);
    setSelectedSession(null);
    setEditSession(null);
    fetchSessions();
  };
  

  const handleAddSession = async () => {
    try {
      const startDate = new Date(newSession.start);
      const endDate = new Date(newSession.end);
      const duration = (endDate - startDate) / 60000;
      await createStudySession({
        user_id: user.user_id,
        subject: newSession.subject,
        duration,
        scheduled_time: startDate.toISOString()
      });
      setShowModal(false);
      setNewSession({ subject: '', start: '', end: '' });
      fetchSessions();
    } catch (err) {
      console.error('Failed to add session:', err);
      alert('Failed to add session. Please try again.');
    }
  };

  const handleUpdateSession = async () => {
    try {
      const startDate = new Date(editSession.start);
      const endDate = new Date(editSession.end);
      const duration = Math.round((endDate - startDate) / 60000);
      await updateStudySession(selectedSession.id, {
        user_id: user.user_id,
        subject: editSession.subject,
        duration,
        scheduled_time: editSession.start
      });
      setShowModal(false);
      setSelectedSession(null);
      setEditSession(null);
      fetchSessions();
    } catch (err) {
      console.error('Failed to update session:', err);
      alert('Failed to update session. Please try again.');
    }
  };

  const handleDeleteSession = async () => {
    await deleteStudySession(selectedSession.id);
    setShowModal(false);
    setSelectedSession(null);
    setEditSession(null);
    fetchSessions();
  };

  const handleCompleteSession = async () => {
    try {
      await completeStudySession(selectedSession.id);
      
      // Add this line to award points and trigger achievement checks
      await awardSessionPoints(selectedSession.id);
      
      setShowModal(false);
      setSelectedSession(null);
      setEditSession(null);
      fetchSessions();
      fetchTodoTasks();
    } catch (err) {
      console.error('Failed to complete session:', err);
      alert('Failed to complete the session. Please try again.');
    }
  };

  const handleOutsideClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      setShowModal(false);
    }
  };

  const handleEventDrop = async (info) => {
    const sessionId = info.event.id;
    const newStart = info.event.start;

    const originalSession = sessions.find(s => s.id.toString() === sessionId.toString());
    if (!originalSession) {
      console.error('Session not found for event drop');
      info.revert();
      return;
    }

    const originalDurationMinutes = (new Date(originalSession.end) - new Date(originalSession.start)) / 60000;

    try {
      await API.put(`/study_sessions/${sessionId}`, {
        user_id: user.user_id,
        subject: originalSession.title.replace('✅ ', ''),
        duration: originalDurationMinutes,
        scheduled_time: newStart.toISOString()
      });
      await fetchSessions();
    } catch (err) {
      console.error('Failed to reschedule session', err.response ? err.response.data : err);
      alert('Failed to reschedule session. Please try again.');
      info.revert();
    }
  };

  useEffect(() => {
    if (showModal) {
      document.addEventListener('mousedown', handleOutsideClick);
    } else {
      document.removeEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [showModal]);

  return (
    <div className="flex flex-col md:flex-row w-full h-full p-4 bg-gradient-to-br from-green-100 to-blue-100">
      {/* Left side: FullCalendar */}
      <div className="w-full md:w-3/4 p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Study Planner</h2>
          <button
            onClick={() => {
              setSelectedSession(null);
              setShowModal(true);
            }}
            className="text-white bg-green-500 px-4 py-2 rounded-full text-xl hover:bg-green-600"
          >
            +
          </button>
        </div>
  
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            start: 'today prev,next',
            center: 'title',
            end: 'dayGridMonth,timeGridWeek,timeGridDay',
          }}
          editable={true}
          events={sessions}
          dateClick={handleDateClick}
          eventDrop={handleEventDrop}
          eventDidMount={(info) => {
            info.el.ondblclick = () => handleEventDoubleClick(info);
          }}
        />
      </div>
  
      {/* Right side: To-Do Sidebar */}
      <div className="w-full md:w-1/4 p-4">
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <h3 className="text-lg font-medium">To-Do List</h3>
          <ul className="text-sm mt-2 text-gray-600 space-y-1">
            {todoTasks.length === 0 ? (
              <li className="italic text-gray-400">No tasks yet.</li>
            ) : (
              todoTasks.map(task => (
                <li key={task.id}>📌 {task.title}</li>
              ))
            )}
          </ul>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-medium">Statistics (Coming Soon)</h3>
          <div className="h-32 flex items-center justify-center text-gray-400">Placeholder</div>
        </div>
      </div>
  
      {/* Modal for Add/Edit Session */}
      {showModal && (
  <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50">
    <div ref={modalRef} className="bg-white rounded-lg shadow-md p-6 w-96">
      {selectedSession && editSession ? (
        <>
          <h3 className="text-xl font-semibold mb-4">Edit Session</h3>
          <input
            className="w-full mb-2 p-2 border rounded"
            value={editSession.subject}
            onChange={(e) => setEditSession({ ...editSession, subject: e.target.value })}
          />
          <label className="text-sm">Start Time</label>
          <input
            className="w-full mb-2 p-2 border rounded"
            type="datetime-local"
            value={editSession.start}
            onChange={(e) => setEditSession({ ...editSession, start: e.target.value })}
          />
          <label className="text-sm">End Time</label>
          <input
            className="w-full mb-4 p-2 border rounded"
            type="datetime-local"
            value={editSession.end}
            onChange={(e) => setEditSession({ ...editSession, end: e.target.value })}
          />

          <div className="flex flex-col gap-2">
            {/* 🔥 Here: if session is completed, show REDO button, else show COMPLETE */}
            {selectedSession.completed ? (
              <button
                className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
                onClick={handleRedoSession}
              >
                ↩️ Mark as Incomplete
              </button>
            ) : (
              <button
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                onClick={handleCompleteSession}
              >
                ✅ Mark as Complete
              </button>
            )}
            
            <div className="flex justify-between">
              <button
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                onClick={handleDeleteSession}
              >
                Delete
              </button>
              <div className="flex gap-2">
                <button
                  className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                  onClick={handleUpdateSession}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          <h3 className="text-xl font-semibold mb-4">Add New Study Session</h3>
          <input
            className="w-full mb-2 p-2 border rounded"
            placeholder="Subject"
            value={newSession.subject}
            onChange={(e) => setNewSession({ ...newSession, subject: e.target.value })}
          />
          <label className="text-sm">Start Time</label>
          <input
            className="w-full mb-2 p-2 border rounded"
            type="datetime-local"
            value={newSession.start}
            onChange={(e) => setNewSession({ ...newSession, start: e.target.value })}
          />
          <label className="text-sm">End Time</label>
          <input
            className="w-full mb-4 p-2 border rounded"
            type="datetime-local"
            value={newSession.end}
            onChange={(e) => setNewSession({ ...newSession, end: e.target.value })}
          />
          <div className="flex justify-end gap-2">
            <button
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              onClick={handleAddSession}
            >
              Add Session
            </button>
            <button
              className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
              onClick={() => setShowModal(false)}
            >
              Cancel
            </button>
          </div>
        </>
      )}
    </div>
  </div>
)}

    </div>
  );
  
};

export default StudyPlanner;