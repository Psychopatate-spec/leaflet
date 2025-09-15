# 🍁 Leaflet

*A cozy notes app with falling leaves — built for the September Vibes challenge 🌿*

![Leaflet Demo Screenshot](./screenshot.gif)

## ✨ About

**Leaflet** is a React GUI app where your thoughts fall gently like autumn leaves.  
It’s inspired by cozy September evenings, notebooks, and a little help from GitHub Copilot.

Features:
- 🍂 **Animated falling leaves** in the background  
- 📝 **Notes editor** with a clean, minimal UI  
- 🎨 **Seasonal vibes** that make writing feel cozy  
- 🤖 **AI-assisted coding** (Copilot helped with components, animations, and debugging)  

---

## 🛠️ Tech Stack

- **Framework**: [React](https://react.dev/)  
- **Styling**: Raw CSS 
- **Animation**: CSS keyframes / Framer Motion  
- **AI Buddy**: GitHub Copilot, Cursor,Windsurf, ChatGPT (autocompletion + debugging)  

---

## 🚀 Getting Started

Clone the repo:
```bash
git clone https://github.com/Psychopatate-spec/leaflet.git
cd leaflet
```

Install dependencies:
```bash
npm install
```

Run frontend and backend together:
```bash
npm run dev
```

The frontend runs at `http://localhost:3000` and proxies API calls to the backend at `http://localhost:4000`.

---

## 🔌 Backend API

A lightweight Express server persists tasks to a JSON file under `server/data/tasks.json`.

- GET `/health` → health check
- GET `/api/tasks` → list all tasks
- POST `/api/tasks` → create `{ text, category, priority }`
- PUT `/api/tasks/:id` → update any fields
- DELETE `/api/tasks/:id` → remove task

If the backend is unavailable, the app gracefully falls back to cached tasks in `localStorage`.