import React, { useState, useEffect } from 'react';
import { getTasks, addTask, updateTask, deleteTask } from '../services/kanbanService';

const KanbanBoard = () => {
  const [tasks, setTasks] = useState({ todo: [], inProgress: [], done: [] });
  const [newTask, setNewTask] = useState('');

  // Fetch tasks from backend on load
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const data = await getTasks();
        setTasks(data); // Ensure backend returns {todo: [], inProgress: [], done: []}
      } catch (error) {
        console.error('Error fetching tasks:', error);
      }
    };
    fetchTasks();
  }, []);

  // Add new task to "To-Do" column and save to backend
  const handleAddTask = async () => {
    if (newTask.trim()) {
      try {
        const addedTask = await addTask({ title: newTask, status: 'todo' });
        setTasks((prev) => ({
          ...prev,
          todo: [...prev.todo, addedTask]
        }));
        setNewTask('');
      } catch (error) {
        console.error('Error adding task:', error);
      }
    }
  };

  // Move task between columns
  const moveTask = async (task, fromStatus, toStatus) => {
    try {
      await updateTask(task.id, { status: toStatus });

      setTasks((prev) => {
        return {
          ...prev,
          [fromStatus]: prev[fromStatus].filter((t) => t.id !== task.id),
          [toStatus]: [...prev[toStatus], task]
        };
      });
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">📌 Kanban To-Do List</h2>

      <div className="flex space-x-4">
        {Object.keys(tasks).map((status) => (
          <div key={status} className="w-1/3 bg-gray-100 p-4 rounded-md shadow-md">
            <h3 className="text-lg font-semibold capitalize">{status}</h3>
            <ul className="mt-2">
              {tasks[status].map((task) => (
                <li 
                  key={task.id} 
                  className="p-2 bg-white shadow-md rounded-md mt-2 cursor-pointer"
                  onClick={() => moveTask(task, status, status === 'todo' ? 'inProgress' : 'done')}
                >
                  {task.title}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <input
          type="text"
          placeholder="New task..."
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          className="p-2 border rounded-md"
        />
        <button onClick={handleAddTask} className="ml-2 p-2 bg-blue-500 text-white rounded-md">Add</button>
      </div>
    </div>
  );
};

export default KanbanBoard;
