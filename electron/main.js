const path = require('path');
const { app, BrowserWindow } = require('electron');

// Start the Express server in the background (same process) so renderer can use http://localhost:4000
function startBackendServer() {
  try {
    // Require server entry; it will start listening on its PORT
    // Path: <projectRoot>/server/index.js
    // __dirname is <projectRoot>/electron
    // eslint-disable-next-line global-require, import/no-dynamic-require
    require(path.join(__dirname, '..', 'server', 'index.js'));
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to start backend server:', error);
  }
}

function createMainWindow() {
  const isDev = process.env.ELECTRON_DEV === '1' || process.env.NODE_ENV === 'development';

  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false,
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  if (isDev) {
    const devUrl = process.env.ELECTRON_START_URL || 'http://localhost:3000';
    mainWindow.loadURL(devUrl);
  } else {
    const indexHtml = path.join(__dirname, '..', 'build', 'index.html');
    mainWindow.loadFile(indexHtml);
  }

  return mainWindow;
}

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    // Focus the main window if someone tried to open another instance
    if (globalThis.mainWindow) {
      if (globalThis.mainWindow.isMinimized()) globalThis.mainWindow.restore();
      globalThis.mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    const isDev = process.env.ELECTRON_DEV === '1' || process.env.NODE_ENV === 'development';
    if (!isDev) {
      startBackendServer();
    }
    globalThis.mainWindow = createMainWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        globalThis.mainWindow = createMainWindow();
      }
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });
}


