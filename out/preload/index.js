"use strict";
const electron = require("electron");
const api = {
  auth: {
    status: () => electron.ipcRenderer.invoke("auth:status"),
    setPasscode: (passcode) => electron.ipcRenderer.invoke("auth:set", passcode),
    verify: (passcode) => electron.ipcRenderer.invoke("auth:verify", passcode)
  },
  data: {
    load: () => electron.ipcRenderer.invoke("data:load"),
    save: (data) => electron.ipcRenderer.invoke("data:save", data)
  },
  theme: {
    get: () => electron.ipcRenderer.invoke("theme:get"),
    onChange: (cb) => {
      const listener = (_e, theme) => cb(theme);
      electron.ipcRenderer.on("theme:changed", listener);
      return () => electron.ipcRenderer.removeListener("theme:changed", listener);
    }
  }
};
if (process.contextIsolated) {
  electron.contextBridge.exposeInMainWorld("api", api);
} else {
  window.api = api;
}
