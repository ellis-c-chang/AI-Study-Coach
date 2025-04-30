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
    drop: (item) => {
      console.log(`Dropping task ${item.id} from ${item.status} to ${status}`);
      moveTask(item.id, item.status, status);
    },
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
        {Array.isArray(tasks) ? (
          tasks.map((task) => (
            <TaskItem 
              key={task.id} 
              task={task} 
              moveTask={moveTask}
              deleteTaskItem={deleteTaskItem}
            />
          ))
        ) : (
          <p className="text-gray-500 italic">No tasks</p>
        )}
      </div>
    </div>
  );
};

const KanbanBoard = () => {
  // Initialize with empty arrays for each status
  const [tasks, setTasks] = useState({
    todo: [],
    inProgress: [],
    done: []
  });
  const [newTask, setNewTask] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch tasks from backend on load
  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log("Fetching tasks...");
      const response = await getTasks();
      console.log("Raw tasks data:", response);
      
      // Create a new empty object for grouped tasks
      const groupedTasks = {
        todo: [],
        inProgress: [],
        done: []
      };
      
      // Process each task and put it in the appropriate array
      if (Array.isArray(response)) {
        response.forEach(task => {
          // Validate and normalize the task object
          const normalizedTask = {
            ...task,
            id: Number(task.id),
            status: task.status || 'todo' // Default to todo if no status
          };
          
          // Add task to appropriate status group
          if (groupedTasks[normalizedTask.status]) {
            groupedTasks[normalizedTask.status].push(normalizedTask);
          } else {
            groupedTasks.todo.push({...normalizedTask, status: 'todo'});
          }
        });
      }
      
      console.log("Grouped tasks:", groupedTasks);
      setTasks(groupedTasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setError('Failed to load tasks. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Add new task to "To-Do" column and save to backend
  const handleAddTask = async () => {
    if (!newTask.trim()) return;
  
    const userId = localStorage.getItem('user_id');
  
    if (!userId) {
      console.error("User ID not found in localStorage");
      setError("User ID not found. Please log in again.");
      return;
    }
  
    try {
      setError(null);
      console.log("Adding task:", newTask);
      
      const addedTask = await addTask({
        title: newTask,
        status: 'todo',
        user_id: parseInt(userId)
      });
      
      console.log("Task added successfully:", addedTask);
      
      // Update only the todo list, leaving other lists unchanged
      setTasks(prev => ({
        ...prev,
        todo: [...prev.todo, {...addedTask, id: Number(addedTask.id)}]
      }));
  
      setNewTask('');
    } catch (error) {
      console.error('Error adding task:', error);
      setError('Failed to add task. Please try again.');
    }
  };
  
  // Move task between columns
  const moveTask = async (taskId, fromStatus, toStatus) => {
    if (fromStatus === toStatus) return;
    
    // Convert to number for consistent comparison
    const taskIdNum = Number(taskId);
    
    console.log(`Moving task ${taskIdNum} from ${fromStatus} to ${toStatus}`);
    console.log("Current tasks state:", tasks);
    
    try {
      setError(null);
      
      // Find the task in the source array
      const sourceArray = tasks[fromStatus] || [];
      const taskToMove = sourceArray.find(task => Number(task.id) === taskIdNum);
      
      if (!taskToMove) {
        console.error(`Task ${taskIdNum} not found in ${fromStatus} array:`, sourceArray);
        setError(`Task not found in ${fromStatus} column.`);
        return;
      }
      
      console.log("Task to move:", taskToMove);
      
      // Update task status in backend first
      await updateTask(taskIdNum, { status: toStatus });
      console.log("Backend updated successfully");
      
      // Update the UI after backend confirms the change
      const updatedTask = { ...taskToMove, status: toStatus };
      
      setTasks(prev => {
        // Create new arrays to avoid reference issues
        const newFromArray = (prev[fromStatus] || [])
          .filter(task => Number(task.id) !== taskIdNum);
        
        const newToArray = [...(prev[toStatus] || []), updatedTask];
        
        return {
          ...prev,
          [fromStatus]: newFromArray,
          [toStatus]: newToArray
        };
      });
      
      console.log("Local state updated");
    } catch (error) {
      console.error('Error moving task:', error);
      setError('Failed to move task. Please try again.');
    }
  };

  // Delete task
  const handleDeleteTask = async (taskId, status) => {
    const taskIdNum = Number(taskId);
    console.log(`Deleting task ${taskIdNum} from ${status}`);
    
    try {
      setError(null);
      await deleteTask(taskIdNum);
      
      setTasks(prev => {
        const newArray = (prev[status] || [])
          .filter(task => Number(task.id) !== taskIdNum);
        
        return {
          ...prev,
          [status]: newArray
        };
      });
      
      console.log("Task deleted successfully");
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