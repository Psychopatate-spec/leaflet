import { useState, useEffect, useRef } from 'react';
import './App.css';
import Leaf from './components/Leaf';
import SoundEffects from './components/SoundEffects';
import WidgetManager from './components/widgets/WidgetManager';
import TodoWidget from './components/widgets/TodoWidget';
import PomodoroWidget from './components/widgets/PomodoroWidget';
import CalendarWidget from './components/widgets/CalendarWidget';
import SpotifyWidget from './components/widgets/SpotifyWidget';

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
  const API_BASE = '';
  
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

  // Load tasks and theme from backend (fallback to localStorage) on initial render
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch preferences (theme) from backend
        const preferencesRes = await fetch(`${API_BASE}/api/preferences`);
        if (preferencesRes.ok) {
          const preferences = await preferencesRes.json();
          setIsDarkMode(preferences.theme === 'dark');
        } else {
          // Fallback to localStorage
          const savedTheme = localStorage.getItem('theme');
          if (savedTheme) {
            setIsDarkMode(savedTheme === 'dark');
          }
        }

        // Fetch tasks from backend
        const tasksRes = await fetch(`${API_BASE}/api/tasks`);
        if (tasksRes.ok) {
          const data = await tasksRes.json();
          // Enhance tasks with visual props expected by UI
          const enhanced = data.map(t => ({
            ...t,
            isNew: false,
            fallDelay: Math.random() * 0.5,
            fallSpeed: 0.8 + Math.random() * 0.4,
            windEffect: Math.random() * 0.3 - 0.15,
          }));
          setTasks(enhanced);
          localStorage.setItem('tasks', JSON.stringify(enhanced));
        } else {
          throw new Error('Failed to fetch tasks');
        }
      } catch (err) {
        // Fallback to localStorage for both theme and tasks
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
          setIsDarkMode(savedTheme === 'dark');
        }
        
        const saved = localStorage.getItem('tasks');
        if (saved) {
          setTasks(JSON.parse(saved));
        }
      }
    };
    fetchData();
  }, []);

  // Save tasks cache to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }, [tasks]);

  // Save theme to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const toggleTheme = async () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    sounds.playHoverSound();
    
    // Save theme preference to backend
    try {
      await fetch(`${API_BASE}/api/preferences`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: newTheme ? 'dark' : 'light' })
      });
    } catch (err) {
      // Fallback to localStorage if backend fails
      localStorage.setItem('theme', newTheme ? 'dark' : 'light');
    }
  };

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
      // Fallback local create
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
      if (target && !target.completed) {
        sounds.playCompleteSound();
      }
      await fetch(`${API_BASE}/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: newCompleted })
      });
    } catch (err) {
      // Fallback: update localStorage if backend fails
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
      // Fallback: update localStorage if backend fails
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
      // Fallback: update localStorage if backend fails
      const updatedTasks = tasks.map(task => task.id === id ? { ...task, ...updatedTask } : task);
      localStorage.setItem('tasks', JSON.stringify(updatedTasks));
    }
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

  const widgetDefs = {
    todo: { title: 'To‑Do', Component: TodoWidget, width: 420 },
    pomodoro: { title: 'Pomodoro', Component: PomodoroWidget, width: 360 },
    calendar: { title: 'Calendar', Component: CalendarWidget, width: 640 },
    spotify: { title: 'Music', Component: SpotifyWidget, width: 420 },
  };

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
        <img src={`${process.env.PUBLIC_URL}/leaf.png`} alt="Leaf" className="header-leaf" />
        Leaflet
      </h1>
      
      <WidgetManager widgets={widgetDefs} />
    </div>
  );
}

export default App;
