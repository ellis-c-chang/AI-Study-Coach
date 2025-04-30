// frontend/src/components/StudyPlanner.js
// StudyPlanner.js – merged & cleaned

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
  /* ────────── state ────────── */
  const [sessions,      setSessions]      = useState([]);
  const [showModal,     setShowModal]     = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [editSession,   setEditSession]   = useState(null);
  const [newSession,    setNewSession]    = useState({ subject: '', start: '', end: '' });
  const [todoTasks,     setTodoTasks]     = useState([]);
  const modalRef = useRef();

  /* ────────── Kanban tasks (todo list) ────────── */
  const fetchTodoTasks = async () => {
    try {
      const res = await API.get(`/kanban/user/${user.user_id}`);
      setTodoTasks(res.data.filter(t => t.status !== 'done'));   // 仅显示未完成任务
    } catch (err) {
      console.error('Failed to fetch Kanban tasks:', err);
    }
  };

  /* ────────── Study sessions ────────── */
  const fetchSessions = async () => {
    try {
      const res  = await API.get(`/study_sessions/${user.user_id}`);
      const data = res.data;

      const events = data.map(s => ({
        id: s.id,
        title: s.subject,
        start: s.scheduled_time,
        end: new Date(new Date(s.scheduled_time).getTime() + s.duration * 60000).toISOString(),
        allDay: false,
        backgroundColor: subjectColors[s.subject] || subjectColors.Default,
        borderColor:     subjectColors[s.subject] || subjectColors.Default,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ────────── CRUD helpers ────────── */
  const createStudySession    = (payload) => API.post('/study_sessions/', payload);
  const updateStudySessionAPI = (id, payload) => API.put(`/study_sessions/${id}`, payload);
  const deleteStudySessionAPI = (id) => API.delete(`/study_sessions/${id}`);
  const completeStudySession  = (id) => API.put(`/study_sessions/complete/${id}`);
  const redoStudySession      = (id) => API.put(`/study_sessions/redo/${id}`);

  /* ────────── Calendar interactions ────────── */
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
      end:   info.event.end ? info.event.end.toISOString() : info.event.start.toISOString(),
      completed: info.event.extendedProps.completed
    });

    setEditSession({
      subject: info.event.title.replace('✅ ', ''),
      start:   info.event.start.toISOString().slice(0, 16),
      end:     info.event.end ? info.event.end.toISOString().slice(0, 16)
                              : info.event.start.toISOString().slice(0, 16)
    });

    setShowModal(true);
  };

  const handleEventDrop = async (info) => {
    const sessionId    = info.event.id;
    const newStart     = info.event.start;
    const original     = sessions.find(s => s.id.toString() === sessionId.toString());

    if (!original) {
      console.error('Session not found for drag-drop');
      info.revert();
      return;
    }

    const durationMin = (new Date(original.end) - new Date(original.start)) / 60000;

    try {
      await updateStudySessionAPI(sessionId, {
        user_id: user.user_id,
        subject: original.title.replace('✅ ', ''),
        duration: durationMin,
        scheduled_time: newStart.toISOString()
      });
      await fetchSessions();
    } catch (err) {
      console.error('Reschedule failed:', err.response ? err.response.data : err);
      info.revert();
    }
  };

  /* ────────── CRUD actions from modal ────────── */
  const handleAddSession = async () => {
    const duration = (new Date(newSession.end) - new Date(newSession.start)) / 60000;

    await createStudySession({
      user_id: user.user_id,
      subject: newSession.subject,
      duration,
      scheduled_time: newSession.start
    });

    setShowModal(false);
    setNewSession({ subject: '', start: '', end: '' });
    fetchSessions();
  };

  const handleUpdateSession = async () => {
    try {
      const duration = (new Date(editSession.end) - new Date(editSession.start)) / 60000;

      await updateStudySessionAPI(selectedSession.id, {
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
    await deleteStudySessionAPI(selectedSession.id);
    setShowModal(false);
    setSelectedSession(null);
    setEditSession(null);
    fetchSessions();
  };

  const handleCompleteSession = async () => {
    try {
      await completeStudySession(selectedSession.id);      // 更新 completed 字段
      await awardSessionPoints(selectedSession.id);        // 计分 + 成就
      setShowModal(false);
      setSelectedSession(null);
      setEditSession(null);
      fetchSessions();
      fetchTodoTasks();                                    // 重新加载待办列表
    } catch (err) {
      console.error('Failed to complete session:', err);
      alert('Failed to complete the session. Please try again.');
    }
  };

  const handleRedoSession = async () => {
    await redoStudySession(selectedSession.id);
    setShowModal(false);
    setSelectedSession(null);
    setEditSession(null);
    fetchSessions();
  };

  /* ────────── modal 外点击关闭 ────────── */
  const handleOutsideClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      setShowModal(false);
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

  /* ────────── UI ────────── */
  return (
    <div className="flex flex-col md:flex-row w-full h-full p-4 bg-gradient-to-br from-green-100 to-blue-100">
      {/* Calendar */}
      <div className="w-full md:w-3/4 p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Study Planner</h2>
          <button
            onClick={() => { setSelectedSession(null); setShowModal(true); }}
            className="text-white bg-green-500 px-4 py-2 rounded-full text-xl hover:bg-green-600"
          >
            +
          </button>
        </div>

        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{ start: 'today prev,next', center: 'title', end: 'dayGridMonth,timeGridWeek,timeGridDay' }}
          editable
          events={sessions}
          dateClick={handleDateClick}
          eventDrop={handleEventDrop}
          eventDidMount={(info) => { info.el.ondblclick = () => handleEventDoubleClick(info); }}
        />
      </div>

      {/* Sidebar – To-Do & Stats */}
      <div className="w-full md:w-1/4 p-4">
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <h3 className="text-lg font-medium">To-Do List</h3>
          <ul className="text-sm mt-2 text-gray-600 space-y-1">
            {todoTasks.length === 0
              ? <li className="italic text-gray-400">No tasks yet.</li>
              : todoTasks.map(task => <li key={task.id}>📌 {task.title}</li>)
            }
          </ul>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-medium">Statistics (Coming Soon)</h3>
          <div className="h-32 flex items-center justify-center text-gray-400">Placeholder</div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50">
          <div ref={modalRef} className="bg-white rounded-lg shadow-md p-6 w-96">
            {selectedSession && editSession ? (
              /* ---------- Edit existing session ---------- */
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
              /* ---------- Add new session ---------- */
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
