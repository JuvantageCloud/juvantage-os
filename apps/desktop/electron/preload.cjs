const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("juvantageOs", {
  toggleSheet: () => ipcRenderer.invoke("os:toggle-sheet"),
  openDesktop: (loopId) => ipcRenderer.invoke("os:open-desktop", loopId ?? null),
  undock: () => ipcRenderer.invoke("os:undock"),
  closeSheet: () => ipcRenderer.invoke("os:close-sheet"),
  contextClosed: () => ipcRenderer.invoke("os:context-closed"),
  onContextClosed: (cb) => {
    const handler = () => cb();
    ipcRenderer.on("os:context-closed", handler);
    return () => ipcRenderer.removeListener("os:context-closed", handler);
  },
  stubAction: (action) => ipcRenderer.invoke("os:stub-action", action),
  openExternal: (url) => ipcRenderer.invoke("os:open-external", url),
  ambientSample: () => ipcRenderer.invoke("os:ambient-sample"),
  clipContext: () => ipcRenderer.invoke("os:clip-context"),
  onClipHotkey: (cb) => {
    const handler = () => cb();
    ipcRenderer.on("os:clip-hotkey", handler);
    return () => ipcRenderer.removeListener("os:clip-hotkey", handler);
  },
  platform: process.platform,
});
