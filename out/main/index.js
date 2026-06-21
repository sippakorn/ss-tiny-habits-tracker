"use strict";
const electron = require("electron");
const path = require("path");
const crypto = require("crypto");
const Store = require("electron-store");
function hashPasscode(passcode) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(passcode, salt, 64).toString("hex");
  return { salt, hash };
}
function verifyPasscode(passcode, cred) {
  const hash = crypto.scryptSync(passcode, cred.salt, 64);
  const stored = Buffer.from(cred.hash, "hex");
  if (stored.length !== hash.length) return false;
  return crypto.timingSafeEqual(hash, stored);
}
const DEFAULT_CATEGORIES = [
  { id: "work", name: "Work", color: "#3b82f6", description: "Paid hourly wage", weeklyTarget: 40 },
  { id: "research", name: "Research", color: "#8b5cf6", description: "Part-time PhD", weeklyTarget: 15 },
  { id: "side-project", name: "Side Project", color: "#10b981", description: "Extra income", weeklyTarget: 8 },
  { id: "exercise", name: "Exercise", color: "#f59e0b", description: "Running / HIIT / weight training", weeklyTarget: 10 },
  { id: "sleeping", name: "Sleeping", color: "#6366f1", description: "Rest & recovery", weeklyTarget: 56 },
  { id: "commuting", name: "Daily Commuting", color: "#ef4444", description: "Travel time", weeklyTarget: 7 }
];
const DEFAULT_TEMPLATES = {
  workday: { work: 8, research: 2, "side-project": 1, exercise: 1, sleeping: 8, commuting: 1 },
  weekend: { work: 0, research: 3, "side-project": 3, exercise: 2, sleeping: 9, commuting: 0 }
};
const DEFAULT_DATA = {
  categories: DEFAULT_CATEGORIES,
  templates: DEFAULT_TEMPLATES,
  weeks: {}
};
const store = new Store({
  name: "tiny-habits-tracker",
  defaults: { data: DEFAULT_DATA }
});
function loadData() {
  return store.get("data", DEFAULT_DATA);
}
function saveData(data) {
  store.set("data", data);
}
function getCredential() {
  return store.get("auth");
}
function setCredential(cred) {
  store.set("auth", cred);
}
function hasCredential() {
  return store.get("auth") !== void 0;
}
let mainWindow = null;
function currentTheme() {
  return electron.nativeTheme.shouldUseDarkColors ? "dark" : "light";
}
function createWindow() {
  mainWindow = new electron.BrowserWindow({
    width: 1240,
    height: 820,
    minWidth: 940,
    minHeight: 620,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: currentTheme() === "dark" ? "#12171c" : "#f7f7f7",
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  mainWindow.on("ready-to-show", () => mainWindow?.show());
  mainWindow.webContents.setWindowOpenHandler((details) => {
    electron.shell.openExternal(details.url);
    return { action: "deny" };
  });
  if (process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }
}
electron.nativeTheme.themeSource = "system";
electron.app.whenReady().then(() => {
  electron.ipcMain.handle("auth:status", () => ({ isSet: hasCredential() }));
  electron.ipcMain.handle("auth:set", (_e, passcode) => {
    setCredential(hashPasscode(passcode));
    return { ok: true };
  });
  electron.ipcMain.handle("auth:verify", (_e, passcode) => {
    const cred = getCredential();
    if (!cred) return { ok: false };
    return { ok: verifyPasscode(passcode, cred) };
  });
  electron.ipcMain.handle("data:load", () => loadData());
  electron.ipcMain.handle("data:save", (_e, data) => {
    saveData(data);
    return { ok: true };
  });
  electron.ipcMain.handle("theme:get", () => currentTheme());
  electron.nativeTheme.on("updated", () => {
    electron.BrowserWindow.getAllWindows().forEach(
      (w) => w.webContents.send("theme:changed", currentTheme())
    );
  });
  createWindow();
  electron.app.on("activate", () => {
    if (electron.BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") electron.app.quit();
});
