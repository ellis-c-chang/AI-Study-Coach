import React, { useState, useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { createStudySession, getStudySessions } from '../services/sessionService';
import './StudyPlanner.css';

const StudyPlanner = ({ user }) => {
  const [sessions, setSessions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newSession, setNewSession] = useState({
    subject: '',
    start: '',
    end: ''
  });
  const modalRef = useRef();

  useEffect(() => {
    const fetchData = async () => {
      const data = await getStudySessions(user.user_id);
      const events = data.map(s => ({
        id: s.id,
        title: s.subject,
        start: s.scheduled_time,
        end: new Date(new Date(s.scheduled_time).getTime() + s.duration * 60000).toISOString()
      }));
      setSessions(events);
    };
    fetchData();
  }, []);

  const handleDateClick = (arg) => {
    setNewSession({ ...newSession, start: arg.dateStr, end: arg.dateStr });
    setShowModal(true);
  };

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
    const data = await getStudySessions(user.user_id);
    const updated = data.map(s => ({
      id: s.id,
      title: s.subject,
      start: s.scheduled_time,
      end: new Date(new Date(s.scheduled_time).getTime() + s.duration * 60000).toISOString()
    }));
    setSessions(updated);
  };

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

  return (
    <div className="flex flex-col md:flex-row w-full h-full p-4 bg-gradient-to-br from-green-100 to-blue-100">
      <div className="w-full md:w-3/4 p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Study Planner</h2>
          <button onClick={() => setShowModal(true)} className="text-white bg-green-500 px-4 py-2 rounded-full text-xl hover:bg-green-600">+</button>
        </div>
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{ start: 'today prev,next', center: 'title', end: 'dayGridMonth,timeGridWeek,timeGridDay' }}
          events={sessions}
          dateClick={handleDateClick}
        />
      </div>

      <div className="w-full md:w-1/4 p-4">
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <h3 className="text-lg font-medium">To-Do List</h3>
          <ul className="text-sm mt-2 text-gray-600">
            <li>📝 Math: review & notes</li>
            <li>📄 Essay: write and proof</li>
            <li>🧠 Social: prep for quiz</li>
          </ul>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-medium">Statistics (Coming Soon)</h3>
          <div className="h-32 flex items-center justify-center text-gray-400">
            Placeholder
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50">
          <div ref={modalRef} className="bg-white rounded-lg shadow-md p-6 w-96">
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
              <button className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600" onClick={handleAddSession}>Add Session</button>
              <button className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400" onClick={() => setShowModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudyPlanner;
