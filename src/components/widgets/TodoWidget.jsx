// React import not required with the new JSX transform
import { useEffect, useRef, useState } from 'react';
import Leaf from '../Leaf';
import SoundEffects from '../SoundEffects';

const TodoWidget = () => {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [newCategory, setNewCategory] = useState('general');
  const [newPriority, setNewPriority] = useState('medium');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const editInputRef = useRef(null);
  const sounds = SoundEffects();
  const API_BASE = '';

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/tasks`);
        if (!res.ok) throw new Error('Failed');
        const data = await res.json();
        const enhanced = data.map(t => ({
          ...t,
          isNew: false,
          fallDelay: Math.random() * 0.5,
          fallSpeed: 0.8 + Math.random() * 0.4,
          windEffect: Math.random() * 0.3 - 0.15,
        }));
        setTasks(enhanced);
      } catch (e) {
        const saved = localStorage.getItem('tasks');
        if (saved) setTasks(JSON.parse(saved));
      }
    };
    fetchTasks();
  }, []);

  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }, [tasks]);

  const addTask = async (e) => {
    e.preventDefault();
    if (newTask.trim() === '') return;
    try {
      const res = await fetch(`${API_BASE}/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newTask, category: newCategory, priority: newPriority })
      });
      if (!res.ok) throw new Error('Failed to create');
      const created = await res.json();
      const newTaskObj = {
        ...created,
        isNew: true,
        fallDelay: Math.random() * 0.5,
        fallSpeed: 0.8 + Math.random() * 0.4,
        windEffect: Math.random() * 0.3 - 0.15,
      };
      setTasks(prev => [...prev, newTaskObj]);
      setNewTask('');
      sounds.playAddSound();
      setTimeout(() => {
        setTasks(prevTasks => prevTasks.map(task => task.id === newTaskObj.id ? { ...task, isNew: false } : task));
      }, 5000);
    } catch (err) {
      const newTaskObj = {
        id: Date.now().toString(),
        text: newTask,
        category: newCategory,
        priority: newPriority,
        completed: false,
        createdAt: new Date().toISOString(),
        rotation: Math.floor(Math.random() * 20) - 10,
        isNew: true,
        fallDelay: Math.random() * 0.5,
        fallSpeed: 0.8 + Math.random() * 0.4,
        windEffect: Math.random() * 0.3 - 0.15,
      };
      setTasks(prev => [...prev, newTaskObj]);
      setNewTask('');
      sounds.playAddSound();
      setTimeout(() => {
        setTasks(prevTasks => prevTasks.map(task => task.id === newTaskObj.id ? { ...task, isNew: false } : task));
      }, 5000);
    }
  };

  const toggleTask = async (id) => {
    const target = tasks.find(t => t.id === id);
    const newCompleted = !(target && target.completed);
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: newCompleted } : t));
    try {
      if (target && !target.completed) sounds.playCompleteSound();
      await fetch(`${API_BASE}/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: newCompleted })
      });
    } catch (err) {
      const updatedTasks = tasks.map(t => t.id === id ? { ...t, completed: newCompleted } : t);
      localStorage.setItem('tasks', JSON.stringify(updatedTasks));
    }
  };

  const deleteTask = async (id) => {
    setTasks(prevTasks => prevTasks.filter(task => task.id !== id));
    sounds.playDeleteSound();
    try {
      await fetch(`${API_BASE}/api/tasks/${id}`, { method: 'DELETE' });
    } catch (err) {
      const updatedTasks = tasks.filter(task => task.id !== id);
      localStorage.setItem('tasks', JSON.stringify(updatedTasks));
    }
  };

  const startEditing = (task) => {
    setEditingId(task.id);
    setEditText(task.text);
    sounds.playEditSound();
  };

  const saveEdit = async (id) => {
    const updatedTask = { text: editText };
    setTasks(prevTasks => prevTasks.map(task => task.id === id ? { ...task, ...updatedTask } : task));
    setEditingId(null);
    try {
      await fetch(`${API_BASE}/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedTask)
      });
    } catch (err) {
      const updatedTasks = tasks.map(task => task.id === id ? { ...task, ...updatedTask } : task);
      localStorage.setItem('tasks', JSON.stringify(updatedTasks));
    }
    setEditText('');
  };

  useEffect(() => {
    if (editingId !== null && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingId]);

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.text.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || task.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const completedTasks = tasks.filter(task => task.completed).length;
  const remainingTasks = tasks.length - completedTasks;
  const categories = ['all', ...new Set(tasks.map(task => task.category))];
  const colors = {
    priority: { high: '#FF6B35', medium: '#FF8C42', low: '#FFB347' },
    category: { work: '#8B4513', personal: '#FF7F50', shopping: '#FFB347', health: '#FF6B35', general: '#FF8C42' },
  };
  const getPriorityColor = (priority) => colors.priority[priority] || colors.priority.medium;
  const getCategoryColor = (category) => colors.category[category] || colors.category.general;

  return (
    <div className="todo-widget" style={{ maxHeight: '60vh', overflow: 'auto' }}>
      <form onSubmit={addTask} className="task-form">
        <input type="text" value={newTask} onChange={(e) => setNewTask(e.target.value)} placeholder="Add a new task..." />
        <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="category-select">
          <option value="general">General</option>
          <option value="work">Work</option>
          <option value="personal">Personal</option>
          <option value="shopping">Shopping</option>
          <option value="health">Health</option>
        </select>
        <select value={newPriority} onChange={(e) => setNewPriority(e.target.value)} className="priority-select">
          <option value="low">Low Priority</option>
          <option value="medium">Medium Priority</option>
          <option value="high">High Priority</option>
        </select>
        <button type="submit" className="add-button" onMouseEnter={() => sounds.playHoverSound()}>Add Task</button>
      </form>

      <div className="controls">
        <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search tasks..." className="search-input" />
        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="filter-select">
          {categories.map(category => (
            <option key={category} value={category}>
              {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {filteredTasks.length === 0 ? (
        <div className="empty-state">
          {searchTerm || filterCategory !== 'all' 
            ? `No tasks found matching "${searchTerm}" in ${filterCategory === 'all' ? 'all categories' : filterCategory}`
            : '🍁 No tasks yet! Add your first task above 🍁'}
        </div>
      ) : (
        <ul className="task-list" style={{ paddingBottom: 16 }}>
          {filteredTasks.map(task => (
            <li key={task.id} className="task-item">
              <Leaf rotation={task.rotation} isNew={task.isNew} fallDelay={task.fallDelay} fallSpeed={task.fallSpeed} windEffect={task.windEffect}>
                <div className="task-content">
                  <input type="checkbox" checked={task.completed} onChange={() => toggleTask(task.id)} />
                  {editingId === task.id ? (
                    <div className="edit-container">
                      <input type="text" ref={editInputRef} value={editText} onChange={(e) => setEditText(e.target.value)} onBlur={() => saveEdit(task.id)} onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(task.id); if (e.key === 'Escape') setEditingId(null); }} />
                      <div className="edit-buttons">
                        <button type="button" onClick={() => saveEdit(task.id)}>Save</button>
                        <button type="button" onClick={() => setEditingId(null)}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="task-content-wrapper">
                        <span className={`task-text ${task.completed ? 'completed' : ''}`}>{task.text}</span>
                        <div className="task-controls">
                          <div className="task-meta">
                            <span className="category-badge" style={{ backgroundColor: getCategoryColor(task.category) }}>{task.category}</span>
                            <span className="priority-badge" style={{ backgroundColor: getPriorityColor(task.priority) }}>{task.priority}</span>
                          </div>
                          <div className="task-actions">
                            {!task.completed && (
                              <button type="button" onClick={() => startEditing(task)} onMouseEnter={() => sounds.playHoverSound()}>Edit</button>
                            )}
                            <button type="button" className="delete-btn" onClick={() => deleteTask(task.id)} onMouseEnter={() => sounds.playHoverSound()}>Delete</button>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </Leaf>
            </li>
          ))}
        </ul>
      )}

      <div className="task-counter">
        <p>Completed: {completedTasks} | Remaining: {remainingTasks}</p>
      </div>
    </div>
  );
};

export default TodoWidget;


