import React, { useState, useEffect } from 'react';
import { getMyGroups, joinGroup, createGroup, leaveGroup } from '../services/groupService';

const StudyGroups = ({ user }) => {
  const [groups, setGroups] = useState([]);
  const [joinCode, setJoinCode] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupMembers, setGroupMembers] = useState([]);

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
    const res = await fetch(`http://127.0.0.1:5000/groups/${group.group_id}/members`, {
      credentials: 'include', // 保持cookies session，如果需要
    });
    if (!res.ok) {
      throw new Error('Failed to fetch members');
    }
    const data = await res.json();
    setGroupMembers(data);
  } catch (error) {
    console.error('Error fetching group members:', error);
    setGroupMembers([]);
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

          <button
            onClick={() => setSelectedGroup(null)}
            className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
          >
            Back to My Groups
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudyGroups;
