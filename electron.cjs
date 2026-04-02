const { app, BrowserWindow } = require("electron");

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 700,
    title: "My AI Chatbot",
    webPreferences: {
      nodeIntegration: false
    }
  });
  win.loadURL("http://localhost:5173");
}

