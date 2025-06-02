// tooldeck(project folder)/preload.js

const { contextBridge, ipcRenderer } = require('electron')

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    // File operations
    readPDFFile: (filePath) => ipcRenderer.invoke('read-pdf-file', filePath),

    // Menu-triggered events
    onOpenPDFFiles: (callback) => {
        ipcRenderer.on('open-pdf-files', (event, filePaths) => callback(filePaths))
    },

    onCloseActiveTab: (callback) => {
        ipcRenderer.on('close-active-tab', callback)
    },

    onZoomIn: (callback) => {
        ipcRenderer.on('zoom-in', callback)
    },

    onZoomOut: (callback) => {
        ipcRenderer.on('zoom-out', callback)
    },

    onResetZoom: (callback) => {
        ipcRenderer.on('reset-zoom', callback)
    },

    onFitToWidth: (callback) => {
        ipcRenderer.on('fit-to-width', callback)
    },

    onPreviousPage: (callback) => {
        ipcRenderer.on('previous-page', callback)
    },

    onNextPage: (callback) => {
        ipcRenderer.on('next-page', callback)
    },

    // Cleanup
    removeAllListeners: (channel) => {
        ipcRenderer.removeAllListeners(channel)
    }
})