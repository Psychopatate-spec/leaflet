const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 4000;

const DATA_DIR = path.join(__dirname, 'data');
const TASKS_FILE = path.join(DATA_DIR, 'tasks.json');
const PREFERENCES_FILE = path.join(DATA_DIR, 'preferences.json');

// Ensure data directory and file exist
function ensureStorage() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(TASKS_FILE)) {
    fs.writeFileSync(TASKS_FILE, JSON.stringify([] , null, 2));
  }
  if (!fs.existsSync(PREFERENCES_FILE)) {
    fs.writeFileSync(PREFERENCES_FILE, JSON.stringify({ theme: 'light' }, null, 2));
  }
}

function readTasks() {
  ensureStorage();
  try {
    const raw = fs.readFileSync(TASKS_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    return [];
  }
}

function writeTasks(tasks) {
  ensureStorage();
  fs.writeFileSync(TASKS_FILE, JSON.stringify(tasks, null, 2));
}

function readPreferences() {
  ensureStorage();
  try {
    const raw = fs.readFileSync(PREFERENCES_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    return { theme: 'light' };
  }
}

function writePreferences(preferences) {
  ensureStorage();
  fs.writeFileSync(PREFERENCES_FILE, JSON.stringify(preferences, null, 2));
}

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Get all tasks
app.get('/api/tasks', (req, res) => {
  const tasks = readTasks();
  res.json(tasks);
});

// Create a task
app.post('/api/tasks', (req, res) => {
  const { text, category = 'general', priority = 'medium' } = req.body || {};
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return res.status(400).json({ error: 'text is required' });
  }
  const newTask = {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    text: text.trim(),
    category,
    priority,
    completed: false,
    createdAt: new Date().toISOString(),
    rotation: Math.floor(Math.random() * 20) - 10,
  };
  const tasks = readTasks();
  tasks.push(newTask);
  writeTasks(tasks);
  res.status(201).json(newTask);
});

// Update a task
app.put('/api/tasks/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body || {};
  const tasks = readTasks();
  const idx = tasks.findIndex(t => t.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'task not found' });
  }
  const updated = { ...tasks[idx], ...updates, id: tasks[idx].id };
  tasks[idx] = updated;
  writeTasks(tasks);
  res.json(updated);
});

// Delete a task
app.delete('/api/tasks/:id', (req, res) => {
  const { id } = req.params;
  const tasks = readTasks();
  const next = tasks.filter(t => t.id !== id);
  if (next.length === tasks.length) {
    return res.status(404).json({ error: 'task not found' });
  }
  writeTasks(next);
  res.status(204).send();
});

// Get user preferences
app.get('/api/preferences', (req, res) => {
  const preferences = readPreferences();
  res.json(preferences);
});

// Update user preferences
app.put('/api/preferences', (req, res) => {
  const updates = req.body || {};
  const currentPreferences = readPreferences();
  const updatedPreferences = { ...currentPreferences, ...updates };
  writePreferences(updatedPreferences);
  res.json(updatedPreferences);
});

app.listen(PORT, () => {
  ensureStorage();
  // eslint-disable-next-line no-console
  console.log(`Server listening on http://localhost:${PORT}`);
});



