const { contextBridge, clipboard, nativeImage } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  node: () => process.versions.node,
  chrome: () => process.versions.chrome,
  electron: () => process.versions.electron,
  clipboard: {
    readText: () => clipboard.readText(),
    readImage: () => clipboard.readImage()
  }
});
