// React import not required with the new JSX transform
import { useEffect, useMemo, useState } from 'react';

const API_BASE = '';

const getMonthMatrix = (year, month) => {
  const firstDay = new Date(year, month, 1);
  const startDay = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const weeks = [];
  let day = 1 - startDay;
  for (let w = 0; w < 6; w++) {
    const week = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(year, month, day);
      week.push({ date, inMonth: date.getMonth() === month });
      day++;
    }
    weeks.push(week);
  }
  return weeks;
};

const dateKey = (date) => date.toISOString().slice(0, 10);

const CalendarWidget = () => {
  const today = new Date();
  const [current, setCurrent] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(today);
  const [tasksByDate, setTasksByDate] = useState({});
  const [newTask, setNewTask] = useState('');

  // Load tasks from API and group by dueDate (YYYY-MM-DD)
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/tasks`);
        const data = await res.json();
        const grouped = {};
        data.forEach(t => {
          if (!t.dueDate) return;
          const key = t.dueDate.slice(0,10);
          if (!grouped[key]) grouped[key] = [];
          grouped[key].push({ id: t.id, text: t.text, completed: !!t.completed });
        });
        setTasksByDate(grouped);
      } catch (e) {
        const saved = localStorage.getItem('calendarTasks');
        if (saved) setTasksByDate(JSON.parse(saved));
      }
    };
    load();
  }, []);

  useEffect(() => {
    localStorage.setItem('calendarTasks', JSON.stringify(tasksByDate));
  }, [tasksByDate]);

  const matrix = useMemo(() => getMonthMatrix(current.getFullYear(), current.getMonth()), [current]);

  const addTask = async () => {
    if (!newTask.trim()) return;
    const key = dateKey(selectedDate);
    try {
      const res = await fetch(`${API_BASE}/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newTask, category: 'calendar', priority: 'medium', dueDate: key })
      });
      const created = await res.json();
      const existing = tasksByDate[key] || [];
      const next = [...existing, { id: created.id, text: created.text, completed: created.completed }];
      setTasksByDate({ ...tasksByDate, [key]: next });
      setNewTask('');
    } catch (e) {
      const existing = tasksByDate[key] || [];
      const next = [...existing, { id: Date.now().toString(), text: newTask, completed: false }];
      setTasksByDate({ ...tasksByDate, [key]: next });
      setNewTask('');
    }
  };

  const toggleTask = async (key, id) => {
    const target = (tasksByDate[key] || []).find(t => t.id === id);
    const completed = !target?.completed;
    const next = (tasksByDate[key] || []).map(t => t.id === id ? { ...t, completed } : t);
    setTasksByDate({ ...tasksByDate, [key]: next });
    try {
      await fetch(`${API_BASE}/api/tasks/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ completed }) });
    } catch {}
  };

  const removeTask = async (key, id) => {
    const next = (tasksByDate[key] || []).filter(t => t.id !== id);
    setTasksByDate({ ...tasksByDate, [key]: next });
    try {
      await fetch(`${API_BASE}/api/tasks/${id}`, { method: 'DELETE' });
    } catch {}
  };

  const selectedKey = dateKey(selectedDate);
  const selectedTasks = tasksByDate[selectedKey] || [];

  return (
    <div className="calendar-widget" style={{ maxHeight: '60vh', overflow: 'auto' }}>
      <div className="calendar-header">
        <button type="button" onClick={() => setCurrent(new Date(current.getFullYear(), current.getMonth() - 1, 1))}>‹</button>
        <div className="calendar-title">{current.toLocaleString(undefined, { month: 'long', year: 'numeric' })}</div>
        <button type="button" onClick={() => setCurrent(new Date(current.getFullYear(), current.getMonth() + 1, 1))}>›</button>
      </div>
      <div className="calendar-grid">
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d) => (
          <div key={d} className="calendar-cell calendar-dow">{d}</div>
        ))}
        {matrix.flat().map((cell, idx) => (
          <div key={idx} className={`calendar-cell ${cell.inMonth ? '' : 'muted'} ${dateKey(cell.date) === selectedKey ? 'selected' : ''}`} onClick={() => setSelectedDate(cell.date)}>
            <div className="calendar-date-number">{cell.date.getDate()}</div>
            <div className="calendar-date-dots">
              {(tasksByDate[dateKey(cell.date)] || []).slice(0,3).map(t => (
                <span key={t.id} className={`dot ${t.completed ? 'done' : ''}`}></span>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="calendar-sidebar">
        <div className="calendar-today">Today: {today.toLocaleDateString()}</div>
        <div className="calendar-selected">Selected: {selectedDate.toLocaleDateString()}</div>
        <div className="calendar-add">
          <input type="text" value={newTask} onChange={(e) => setNewTask(e.target.value)} placeholder="New task for selected date" />
          <button type="button" onClick={addTask}>Add</button>
        </div>
        <ul className="calendar-task-list">
          {selectedTasks.map(t => (
            <li key={t.id} className="calendar-task-item">
              <label>
                <input type="checkbox" checked={t.completed} onChange={() => toggleTask(selectedKey, t.id)} />
                <span className={t.completed ? 'completed' : ''}>{t.text}</span>
              </label>
              <button type="button" className="delete-btn" onClick={() => removeTask(selectedKey, t.id)}>Delete</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default CalendarWidget;


