import React, { useState, useEffect } from 'react';
import {
  getMyGroups,
  joinGroup,
  createGroup,
  leaveGroup,
  addGroupSession,
  getGroupStudySessions
} from '../services/groupService';

const StudyGroups = ({ user }) => {
  const [groups, setGroups] = useState([]);
  const [joinCode, setJoinCode] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupMembers, setGroupMembers] = useState([]);
  const [addingSessionGroupId, setAddingSessionGroupId] = useState(null);
  const [newSessionSubject, setNewSessionSubject] = useState('');
  const [newSessionTime, setNewSessionTime] = useState('');
  const [newSessionDuration, setNewSessionDuration] = useState('');
  const [groupSessions, setGroupSessions] = useState([]);




  useEffect(() => {
    if (user) {
      fetchGroups();
    }
  }, [user]);

  const fetchGroups = async () => {
    try {
      const data = await getMyGroups(user.user_id);
      setGroups(data);
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  };

  const handleJoin = async () => {
    if (!joinCode) return;
    try {
      await joinGroup(user.user_id, joinCode);
      setJoinCode('');
      fetchGroups();
    } catch (error) {
      console.error('Error joining group:', error);
    }
  };

  const handleCreate = async () => {
    if (!newGroupName) return;
    try {
      await createGroup({
        name: newGroupName,
        description: newGroupDescription,
        user_id: user.user_id,    // ✅ 必须传上去
      });
      setNewGroupName('');
      setNewGroupDescription('');
      fetchGroups();
    } catch (error) {
      console.error('Error creating group:', error);
    }
  };



const handleAddSession = async (groupId) => {
  if (!newSessionSubject || !newSessionTime || !newSessionDuration) {
    alert('Please fill in subject / time / duration');
    return;
  }

  const isoStart = new Date(newSessionTime).toISOString();

  try {
    await addGroupSession(groupId, {
      subject: newSessionSubject,
      scheduled_time: isoStart,
      duration: parseInt(newSessionDuration, 10),
    });
    alert('Session added successfully!');
    /* reset state ... */
  } catch (err) {
    console.error('Error adding session:', err);
    alert('Failed to add session. Please try again.');
  }
};





  const handleLeave = async (groupId) => {
    try {
      await leaveGroup(user.user_id, groupId);
      if (selectedGroup && selectedGroup.group_id === groupId) {
        setSelectedGroup(null);
      }
      fetchGroups();
    } catch (error) {
      console.error('Error leaving group:', error);
    }
  };

  const handleViewGroup = async (group) => {
  setSelectedGroup(group);
  try {
    const [membersRes, sessionsRes] = await Promise.all([
      fetch(`http://127.0.0.1:5000/groups/${group.group_id}/members`, { credentials: 'include' }),
      fetch(`http://127.0.0.1:5000/groups/${group.group_id}/sessions`, { credentials: 'include' })
    ]);

    if (!membersRes.ok || !sessionsRes.ok) {
      throw new Error('Failed to fetch group data');
    }

    const membersData = await membersRes.json();
    const sessionsData = await sessionsRes.json();

    setGroupMembers(membersData);
    setGroupSessions(sessionsData);
  } catch (error) {
    console.error('Error fetching group detail:', error);
    setGroupMembers([]);
    setGroupSessions([]);
  }
};



  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-6">My Study Groups</h2>

      {/* 加入/创建区域 */}
      <div className="flex gap-4 mb-6">
        <div className="bg-white shadow p-4 rounded-lg w-1/2">
          <h3 className="text-lg font-semibold mb-2">Join Group</h3>
          <input
            className="w-full border p-2 rounded mb-2"
            placeholder="Enter join code"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
          />
          <button
            onClick={handleJoin}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 w-full"
          >
            Join
          </button>
        </div>

        <div className="bg-white shadow p-4 rounded-lg w-1/2">
          <h3 className="text-lg font-semibold mb-2">Create Group</h3>
          <input
            className="w-full border p-2 rounded mb-2"
            placeholder="Group name"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
          />
          <input
            className="w-full border p-2 rounded mb-2"
            placeholder="Description (optional)"
            value={newGroupDescription}
            onChange={(e) => setNewGroupDescription(e.target.value)}
          />
          <button
            onClick={handleCreate}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 w-full"
          >
            Create
          </button>
        </div>
      </div>

      {/* 进入群组细节 */}
      {selectedGroup ? (
        <div className="bg-white shadow p-6 rounded-lg">
          <h3 className="text-2xl font-bold mb-4">{selectedGroup.name}</h3>
          <p className="text-gray-600 mb-2">{selectedGroup.description}</p>
          <p className="text-xs text-gray-400 mb-4">Join Code: {selectedGroup.join_code}</p>

          <h4 className="text-lg font-semibold mt-6 mb-2">Members:</h4>
          <ul className="list-disc list-inside text-gray-700 mb-6">
            {groupMembers.length > 0 ? (
              groupMembers.map((member) => (
                <li key={member.user_id}>
                  {member.username} ({member.email})
                </li>
              ))
            ) : (
              <li>No members found.</li>
            )}
          </ul>

          <h4 className="text-lg font-semibold mt-6 mb-2">Group Study Sessions:</h4>
          <ul className="list-disc list-inside text-gray-700 mb-6">
            {groupSessions.length > 0 ? (
              groupSessions.map((session) => (
                <li key={session.id}>
                  {session.subject} — {new Date(session.scheduled_time).toLocaleString()} ({session.duration} min)
                </li>
        ))
    ) : (
            <li>No study sessions scheduled.</li>
  )}
          </ul>


          <button
            onClick={() => setSelectedGroup(null)}
            className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
          >
            Back to My Groups
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 gap-y-8">
          {groups.map((group) => (
            <div key={group.group_id} className="bg-white shadow p-4 rounded-lg flex flex-col">
              <h4 className="text-lg font-semibold">{group.name}</h4>
              <p className="text-sm text-gray-600 mb-2">{group.description}</p>
              <p className="text-xs text-gray-400">Join Code: {group.join_code}</p>

              <div className="flex gap-2 mt-auto pt-4">
                <button
                  onClick={() => handleViewGroup(group)}
                  className="bg-indigo-500 text-white px-3 py-1 rounded hover:bg-indigo-600 flex-1"
                >
                  View
                </button>
                <button
                  onClick={() => handleLeave(group.group_id)}
                  className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 flex-1"
                >
                  Leave
                </button>
              </div>
              {addingSessionGroupId === group.group_id ? (
  <div className="mt-4 space-y-2">
    <input
      type="text"
      placeholder="Session Subject"
      className="w-full border p-2 rounded"
      value={newSessionSubject}
      onChange={(e) => setNewSessionSubject(e.target.value)}
    />
    <input
      type="datetime-local"
      className="w-full border p-2 rounded"
      value={newSessionTime}
      onChange={(e) => setNewSessionTime(e.target.value)}
    />
    <input
      type="number"
      placeholder="Duration (minutes)"
      className="w-full border p-2 rounded"
      value={newSessionDuration}
      onChange={(e) => setNewSessionDuration(e.target.value)}
    />
    <div className="flex gap-2">
      <button
        onClick={() => handleAddSession(group.group_id)}
        className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 flex-1"
      >
        Save
      </button>
      <button
        onClick={() => setAddingSessionGroupId(null)}
        className="bg-gray-400 text-white px-3 py-1 rounded hover:bg-gray-500 flex-1"
      >
        Cancel
      </button>
    </div>
  </div>
) : (
  <button
    onClick={() => setAddingSessionGroupId(group.group_id)}
    className="bg-purple-500 text-white px-3 py-1 rounded hover:bg-purple-600 mt-2"
  >
    Add Session
  </button>
)}

            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudyGroups;
