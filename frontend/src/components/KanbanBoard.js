import React, { useState, useEffect, useCallback } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { getTasks, addTask, updateTask, deleteTask } from '../services/kanbanService';

// Task item component with drag functionality
const TaskItem = ({ task, moveTask, deleteTaskItem }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'TASK',
    item: { id: task.id, status: task.status },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  });

  const handleDelete = (e) => {
    e.stopPropagation();
    
    // Add confirmation for done tasks
    if (task.status === 'done') {
      if (window.confirm('Are you sure you want to delete this completed task?')) {
        deleteTaskItem(task.id, task.status);
      }
    } else {
      deleteTaskItem(task.id, task.status);
    }
  };

  return (
    <div 
      ref={drag}
      className={`p-2 bg-white shadow-md rounded-md mt-2 cursor-move flex justify-between items-center ${isDragging ? 'opacity-50' : 'opacity-100'}`}
    >
      <span>{task.title}</span>
      <button 
        onClick={handleDelete}
        className="text-red-500 hover:text-red-700 text-sm"
      >
        ×
      </button>
    </div>
  );
};

// Column component with drop functionality
const Column = ({ status, tasks, moveTask, deleteTaskItem }) => {
  const [{ isOver }, drop] = useDrop({
    accept: 'TASK',
    drop: (item) => moveTask(item.id, item.status, status),
    collect: (monitor) => ({
      isOver: monitor.isOver()
    })
  });

  // Column titles mapping
  const columnTitles = {
    'todo': 'To Do',
    'inProgress': 'In Progress',
    'done': 'Done'
  };

  return (
    <div 
      ref={drop} 
      className={`w-full md:w-1/3 bg-gray-100 p-4 rounded-md shadow-md ${isOver ? 'bg-blue-50' : ''}`}
    >
      <h3 className="text-lg font-semibold capitalize mb-2">{columnTitles[status] || status}</h3>
      <div className="min-h-[200px]">
        {tasks.map((task) => (
          <TaskItem 
            key={task.id} 
            task={task} 
            moveTask={moveTask}
            deleteTaskItem={deleteTaskItem}
          />
        ))}
      </div>
    </div>
  );
};

const KanbanBoard = () => {
  const [tasks, setTasks] = useState({ todo: [], inProgress: [], done: [] });
  const [newTask, setNewTask] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch tasks from backend on load
  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      try {
        const data = await getTasks();
        setTasks(data);
      } catch (error) {
        console.error('Error fetching tasks:', error);
        setError('Failed to load tasks. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, []);

  // Add new task to "To-Do" column and save to backend
  const handleAddTask = async () => {
    if (!newTask.trim()) return;
  
    const userId = localStorage.getItem('user_id'); // 假设你在登录后保存过 user_id
  
    if (!userId) {
      console.error("User ID not found in localStorage");
      return;
    }
  
    try {
      const addedTask = await addTask({
        title: newTask,
        status: 'todo',
        user_id: parseInt(userId)  // 确保是整数
      });
  
      setTasks((prev) => ({
        ...prev,
        todo: [...prev.todo, addedTask]
      }));
  
      setNewTask('');
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };
  

  // Move task between columns - using useCallback to avoid recreation on renders
  const moveTask = useCallback(async (taskId, fromStatus, toStatus) => {
    if (fromStatus === toStatus) return;
    
    try {
      // Find the task to move
      const taskToMove = tasks[fromStatus]?.find(task => task.id === taskId);
      if (!taskToMove) return;
      
      // Make a copy of the task with the new status
      const updatedTask = { ...taskToMove, status: toStatus };
      
      // Update task status in backend
      await updateTask(taskId, { status: toStatus });
      
      // Update local state
      setTasks(prev => {
        const newState = { ...prev };
        newState[fromStatus] = newState[fromStatus].filter(task => task.id !== taskId);
        newState[toStatus] = [...newState[toStatus], updatedTask];
        return newState;
      });
    } catch (error) {
      console.error('Error moving task:', error);
      setError('Failed to move task. Please try again.');
    }
  }, [tasks]);

  // Delete task - including the status parameter to identify which column the task is in
  const handleDeleteTask = async (taskId, status) => {
    try {
      await deleteTask(taskId);
      
      // Update local state
      setTasks(prev => {
        const newState = { ...prev };
        newState[status] = newState[status].filter(task => task.id !== taskId);
        return newState;
      });
    } catch (error) {
      console.error('Error deleting task:', error);
      setError('Failed to delete task. Please try again.');
    }
  };

  // Form submit handler for the enter key
  const handleSubmit = (e) => {
    e.preventDefault();
    handleAddTask();
  };

  if (loading) {
    return <div className="p-6 text-center">Loading tasks...</div>;
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">📌 Kanban To-Do List</h2>
        
        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4">
            {error}
            <button 
              onClick={() => setError(null)} 
              className="ml-2 text-sm font-bold"
            >
              ×
            </button>
          </div>
        )}
        
        <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 mb-6">
          {['todo', 'inProgress', 'done'].map(status => (
            <Column 
              key={status}
              status={status}
              tasks={tasks[status] || []}
              moveTask={moveTask}
              deleteTaskItem={handleDeleteTask}
            />
          ))}
        </div>

        <form onSubmit={handleSubmit} className="mt-4 flex">
          <input
            type="text"
            placeholder="New task..."
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            className="flex-1 p-2 border rounded-md"
          />
          <button 
            type="submit" 
            className="ml-2 p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            disabled={!newTask.trim()}
          >
            Add Task
          </button>
        </form>
      </div>
    </DndProvider>
  );
};

export default KanbanBoard;