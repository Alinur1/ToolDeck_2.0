// tooldeck(project folder)/index.js

const { app, BrowserWindow, Menu, dialog, ipcMain } = require('electron/main')
const path = require('path')
const fs = require('fs')

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: true,
      preload: path.join(__dirname, 'preload.js') // We'll create this
    },
    icon: path.join(__dirname, 'assets', 'icon.png'), // Add app icon if you have one
    titleBarStyle: 'default',
    show: false // Hide until ready
  })

  // Load the HTML file
  win.loadFile('index.html')

  // Show window when ready
  win.once('ready-to-show', () => {
    win.show()
  })

  // Handle window closed
  win.on('closed', () => {
    // Dereference the window object
  })

  // Create application menu
  createMenu(win)

  return win
}

const createMenu = (win) => {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Open PDF...',
          accelerator: 'CmdOrCtrl+O',
          click: async () => {
            const result = await dialog.showOpenDialog(win, {
              properties: ['openFile', 'multiSelections'],
              filters: [
                { name: 'PDF Files', extensions: ['pdf'] }
              ]
            })

            if (!result.canceled && result.filePaths.length > 0) {
              win.webContents.send('open-pdf-files', result.filePaths)
            }
          }
        },
        {
          label: 'Close Tab',
          accelerator: 'CmdOrCtrl+W',
          click: () => {
            win.webContents.send('close-active-tab')
          }
        },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit()
          }
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Zoom In',
          accelerator: 'CmdOrCtrl+Plus',
          click: () => {
            win.webContents.send('zoom-in')
          }
        },
        {
          label: 'Zoom Out',
          accelerator: 'CmdOrCtrl+-',
          click: () => {
            win.webContents.send('zoom-out')
          }
        },
        {
          label: 'Reset Zoom',
          accelerator: 'CmdOrCtrl+0',
          click: () => {
            win.webContents.send('reset-zoom')
          }
        },
        {
          label: 'Fit to Width',
          accelerator: 'CmdOrCtrl+Shift+W',
          click: () => {
            win.webContents.send('fit-to-width')
          }
        },
        { type: 'separator' },
        {
          label: 'Toggle Developer Tools',
          accelerator: process.platform === 'darwin' ? 'Alt+Cmd+I' : 'Ctrl+Shift+I',
          click: () => {
            win.webContents.toggleDevTools()
          }
        },
        {
          label: 'Reload',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            win.reload()
          }
        }
      ]
    },
    {
      label: 'Window',
      submenu: [
        {
          label: 'Minimize',
          accelerator: 'CmdOrCtrl+M',
          click: () => {
            win.minimize()
          }
        },
        {
          label: 'Close',
          accelerator: 'CmdOrCtrl+Shift+W',
          click: () => {
            win.close()
          }
        }
      ]
    }
  ]

  // macOS specific menu adjustments
  if (process.platform === 'darwin') {
    template.unshift({
      label: app.getName(),
      submenu: [
        {
          label: 'About ' + app.getName(),
          role: 'about'
        },
        { type: 'separator' },
        {
          label: 'Services',
          role: 'services',
          submenu: []
        },
        { type: 'separator' },
        {
          label: 'Hide ' + app.getName(),
          accelerator: 'Command+H',
          role: 'hide'
        },
        {
          label: 'Hide Others',
          accelerator: 'Command+Shift+H',
          role: 'hideothers'
        },
        {
          label: 'Show All',
          role: 'unhide'
        },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: 'Command+Q',
          click: () => {
            app.quit()
          }
        }
      ]
    })
  }

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

// IPC handlers for file operations
ipcMain.handle('read-pdf-file', async (event, filePath) => {
  try {
    const data = await fs.promises.readFile(filePath)
    return {
      success: true,
      data: data,
      fileName: path.basename(filePath)
    }
  } catch (error) {
    console.error('Error reading PDF file:', error)
    return {
      success: false,
      error: error.message
    }
  }
})

// App event handlers
app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Handle file associations (when PDF files are opened with the app)
app.on('open-file', (event, filePath) => {
  event.preventDefault()

  const win = BrowserWindow.getFocusedWindow()
  if (win) {
    win.webContents.send('open-pdf-files', [filePath])
  }
})

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault()
  })
})