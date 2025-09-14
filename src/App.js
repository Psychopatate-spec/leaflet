import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import Leaf from './components/Leaf';
import SoundEffects from './components/SoundEffects';

function App() {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [newCategory, setNewCategory] = useState('general');
  const [newPriority, setNewPriority] = useState('medium');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [leaves, setLeaves] = useState([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const editInputRef = useRef(null);
  const sounds = SoundEffects();
  
  // Create falling leaves effect - always active for atmospheric background
  useEffect(() => {
    const leafEmojis = ['🍁', '🍂', '🍃', '🥮', '🌰'];
    const interval = setInterval(() => {
      if (leaves.length < 15) { // Slightly fewer leaves when tasks are present
          const leaf = {
            id: Date.now() + Math.random(),
            emoji: leafEmojis[Math.floor(Math.random() * leafEmojis.length)],
            left: Math.random() * 100,
            animationDuration: 8 + Math.random() * 12, // 8-20 seconds
            delay: Math.random() * 3, // 0-3 seconds delay
            size: 16 + Math.random() * 24, // 16-40px
            windStrength: (Math.random() - 0.5) * 1.5 // -0.75 to 0.75 for softer wind effects
          };
        setLeaves(prev => [...prev, leaf]);
        
        // Remove leaf after animation completes
        setTimeout(() => {
          setLeaves(prev => prev.filter(l => l.id !== leaf.id));
        }, (leaf.animationDuration + leaf.delay) * 1000);
      }
    }, 800); // Slightly slower generation when tasks are present
    
    return () => clearInterval(interval);
  }, [leaves.length]);

  // Load tasks and theme from localStorage on initial render
  useEffect(() => {
    const savedTasks = localStorage.getItem('tasks');
    if (savedTasks) {
      setTasks(JSON.parse(savedTasks));
    }
    
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
    }
  }, []);

  // Save tasks to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }, [tasks]);

  // Save theme to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    sounds.playHoverSound();
  };

  const addTask = (e) => {
    e.preventDefault();
    if (newTask.trim() === '') return;
    
    const newTaskObj = {
      id: Date.now(),
      text: newTask,
      category: newCategory,
      priority: newPriority,
      completed: false,
      createdAt: new Date().toISOString(),
      rotation: Math.floor(Math.random() * 20) - 10,
      isNew: true,
      // Add natural falling physics
      fallDelay: Math.random() * 0.5, // Random delay up to 0.5s
      fallSpeed: 0.8 + Math.random() * 0.4, // Speed variation
      windEffect: Math.random() * 0.3 - 0.15 // Wind drift variation
    };
    
    setTasks(prev => [...prev, newTaskObj]);
    setNewTask('');
    sounds.playAddSound();
    
    // Remove the new class after animation completes
    setTimeout(() => {
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === newTaskObj.id 
            ? { ...task, isNew: false } 
            : task
        )
      );
    }, 5000); // Longer duration for more natural animation
  };

  
  const toggleTask = (id) => {
    setTasks(prevTasks => {
      const task = prevTasks.find(t => t.id === id);
      if (task && !task.completed) {
        sounds.playCompleteSound();
      }
      return prevTasks.map(task => 
        task.id === id ? { ...task, completed: !task.completed } : task
      );
    });
  };

  const deleteTask = (id) => {
    setTasks(prevTasks => prevTasks.filter(task => task.id !== id));
    sounds.playDeleteSound();
  };

  const startEditing = (task) => {
    setEditingId(task.id);
    setEditText(task.text);
    sounds.playEditSound();
  };

  const saveEdit = (id) => {
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === id ? { ...task, text: editText } : task
      )
    );
    setEditingId(null);
    setEditText('');
  };

  // Focus the edit input when editing starts
  useEffect(() => {
    if (editingId !== null && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingId]);

  // Filter and search tasks
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.text.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || task.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  // Calculate completed and remaining tasks
  const completedTasks = tasks.filter(task => task.completed).length;
  const remainingTasks = tasks.length - completedTasks;

  // Get unique categories for filter
  const categories = ['all', ...new Set(tasks.map(task => task.category))];

  // Color mappings for badges
  const colors = {
    priority: {
      high: '#FF6B35',
      medium: '#FF8C42',
      low: '#FFB347'
    },
    category: {
      work: '#8B4513',
      personal: '#FF7F50',
      shopping: '#FFB347',
      health: '#FF6B35',
      general: '#FF8C42'
    }
  };

  const getPriorityColor = (priority) => colors.priority[priority] || colors.priority.medium;
  const getCategoryColor = (category) => colors.category[category] || colors.category.general;

  return (
    <div className={`App ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
      {/* Theme Toggle Button */}
      <button 
        className="theme-toggle"
        onClick={toggleTheme}
        onMouseEnter={() => sounds.playHoverSound()}
        title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      >
        {isDarkMode ? '☀️' : '🌙'}
      </button>

      {/* Background falling leaves */}
      <div className="falling-leaves-container">
        {leaves.map(leaf => (
          <div
            key={leaf.id}
            className="falling-leaf"
            style={{
              left: `${leaf.left}%`,
              animationDuration: `${leaf.animationDuration}s`,
              animationDelay: `${leaf.delay}s`,
              fontSize: `${leaf.size}px`,
              '--wind-strength': leaf.windStrength
            }}
          >
            {leaf.emoji}
          </div>
        ))}
      </div>
      
      <h1>
        <img src="/leaf.png" alt="Leaf" className="header-leaf" />
        Leaflet
      </h1>
      
      <form onSubmit={addTask} className="task-form">
        <input
          type="text"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          placeholder="Add a new task..."
        />
        <select 
          value={newCategory} 
          onChange={(e) => setNewCategory(e.target.value)}
          className="category-select"
        >
          <option value="general">General</option>
          <option value="work">Work</option>
          <option value="personal">Personal</option>
          <option value="shopping">Shopping</option>
          <option value="health">Health</option>
        </select>
        <select 
          value={newPriority} 
          onChange={(e) => setNewPriority(e.target.value)}
          className="priority-select"
        >
          <option value="low">Low Priority</option>
          <option value="medium">Medium Priority</option>
          <option value="high">High Priority</option>
        </select>
        <button 
          type="submit" 
          className="add-button"
          onMouseEnter={() => sounds.playHoverSound()}
        >
          Add Task
        </button>
      </form>

      {/* Search and Filter Controls */}
      <div className="controls">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search tasks..."
          className="search-input"
        />
        <select 
          value={filterCategory} 
          onChange={(e) => setFilterCategory(e.target.value)}
          className="filter-select"
        >
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
            : "🍁 No tasks yet! Add your first task above 🍁"
          }
        </div>
      ) : (
        <ul className="task-list">
          {filteredTasks.map(task => (
          <li key={task.id} className="task-item">
            <Leaf 
              rotation={task.rotation} 
              isNew={task.isNew}
              fallDelay={task.fallDelay}
              fallSpeed={task.fallSpeed}
              windEffect={task.windEffect}
            >
              <div className="task-content">
                <input 
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => toggleTask(task.id)}
                />
                {editingId === task.id ? (
                  <div className="edit-container">
                    <input
                      type="text"
                      ref={editInputRef}
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      onBlur={() => saveEdit(task.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEdit(task.id);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                    />
                    <div className="edit-buttons">
                      <button type="button" onClick={() => saveEdit(task.id)}>Save</button>
                      <button type="button" onClick={() => setEditingId(null)}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="task-content-wrapper">
                      <span className={`task-text ${task.completed ? 'completed' : ''}`}>
                        {task.text}
                      </span>
                      <div className="task-controls">
                        <div className="task-meta">
                          <span 
                            className="category-badge"
                            style={{ backgroundColor: getCategoryColor(task.category) }}
                          >
                            {task.category}
                          </span>
                          <span 
                            className="priority-badge"
                            style={{ backgroundColor: getPriorityColor(task.priority) }}
                          >
                            {task.priority}
                          </span>
                        </div>
                        <div className="task-actions">
                          {!task.completed && (
                            <button 
                              type="button" 
                              onClick={() => startEditing(task)}
                              onMouseEnter={() => sounds.playHoverSound()}
                            >
                              Edit
                            </button>
                          )}
                          <button 
                            type="button" 
                            className="delete-btn"
                            onClick={() => deleteTask(task.id)}
                            onMouseEnter={() => sounds.playHoverSound()}
                          >
                            Delete
                          </button>
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
        <p>
          Completed: {completedTasks} | Remaining: {remainingTasks}
        </p>
      </div>
    </div>
  );
}

export default App;
