class PDFReaderApp {
    constructor() {
        this.tabManager = null;
        this.pdfManager = null;
        this.fileInput = document.getElementById('fileInput');
        this.openPdfBtn = document.getElementById('openPdfBtn');

        this.init();
    }

    init() {
        // Initialize managers
        this.tabManager = new TabManager();
        this.pdfManager = new PDFManager();

        // Make managers globally accessible for cross-communication
        window.tabManager = this.tabManager;
        window.pdfManager = this.pdfManager;

        this.setupEventListeners();
        this.setupDragAndDrop();
    }

    setupEventListeners() {
        // Open PDF button
        this.openPdfBtn.addEventListener('click', () => {
            this.fileInput.click();
        });

        // File input change
        this.fileInput.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            if (files.length > 0) {
                this.loadPDFFiles(files);
                // Reset file input
                e.target.value = '';
            }
        });

        // Electron menu integration
        if (window.electronAPI) {
            this.setupElectronMenuHandlers();
        }

        // Window resize handler
        window.addEventListener('resize', () => {
            // Re-render current page when window is resized
            if (this.pdfManager.currentPDF) {
                setTimeout(() => {
                    this.pdfManager.renderPage();
                }, 100);
            }
        });

        // Prevent default drag behavior on document
        document.addEventListener('dragover', (e) => e.preventDefault());
        document.addEventListener('drop', (e) => e.preventDefault());
    }

    setupElectronMenuHandlers() {
        // Handle menu-triggered file opens
        window.electronAPI.onOpenPDFFiles(async (filePaths) => {
            try {
                const files = [];
                for (const filePath of filePaths) {
                    const result = await window.electronAPI.readPDFFile(filePath);
                    if (result.success) {
                        // Create a File-like object from the buffer
                        const file = new File([result.data], result.fileName, {
                            type: 'application/pdf'
                        });
                        files.push(file);
                    } else {
                        this.showNotification(`Failed to load: ${result.fileName}`, 'error');
                    }
                }

                if (files.length > 0) {
                    await this.loadPDFFiles(files);
                }
            } catch (error) {
                this.handleError(error, 'Loading files from menu');
            }
        });

        // Handle menu-triggered actions
        window.electronAPI.onCloseActiveTab(() => {
            if (this.tabManager.activeTabId) {
                this.tabManager.closeTab(this.tabManager.activeTabId);
            }
        });

        window.electronAPI.onZoomIn(() => {
            this.pdfManager.zoomIn();
        });

        window.electronAPI.onZoomOut(() => {
            this.pdfManager.zoomOut();
        });

        window.electronAPI.onResetZoom(() => {
            this.pdfManager.resetZoom();
        });

        window.electronAPI.onFitToWidth(() => {
            this.pdfManager.fitToWidth();
        });

        window.electronAPI.onPreviousPage(() => {
            this.pdfManager.previousPage();
        });

        window.electronAPI.onNextPage(() => {
            this.pdfManager.nextPage();
        });
    }

    setupDragAndDrop() {
        const dropZone = document.body;
        let dragCounter = 0;

        // Visual feedback for drag and drop
        const createDropOverlay = () => {
            const overlay = document.createElement('div');
            overlay.id = 'dropOverlay';
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(52, 152, 219, 0.9);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                pointer-events: none;
            `;

            const message = document.createElement('div');
            message.style.cssText = `
                color: white;
                font-size: 24px;
                font-weight: bold;
                text-align: center;
            `;
            message.innerHTML = '📄<br>Drop PDF files here';

            overlay.appendChild(message);
            return overlay;
        };

        dropZone.addEventListener('dragenter', (e) => {
            e.preventDefault();
            dragCounter++;

            if (dragCounter === 1) {
                const overlay = createDropOverlay();
                document.body.appendChild(overlay);
            }
        });

        dropZone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            dragCounter--;

            if (dragCounter === 0) {
                const overlay = document.getElementById('dropOverlay');
                if (overlay) {
                    overlay.remove();
                }
            }
        });

        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dragCounter = 0;

            const overlay = document.getElementById('dropOverlay');
            if (overlay) {
                overlay.remove();
            }

            const files = Array.from(e.dataTransfer.files).filter(file =>
                file.type === 'application/pdf'
            );

            if (files.length > 0) {
                this.loadPDFFiles(files);
            } else {
                this.showNotification('Please drop PDF files only', 'error');
            }
        });
    }

    async loadPDFFiles(files) {
        const loadingNotification = this.showNotification('Loading PDF files...', 'info');

        try {
            for (const file of files) {
                await this.loadSinglePDF(file);
            }

            this.hideNotification(loadingNotification);

            if (files.length > 1) {
                this.showNotification(`Loaded ${files.length} PDF files`, 'success');
            }

        } catch (error) {
            console.error('Error loading PDF files:', error);
            this.hideNotification(loadingNotification);
            this.showNotification('Failed to load some PDF files', 'error');
        }
    }

    async loadSinglePDF(file) {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdfDocument = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

            // Create a new tab for this PDF
            const tabId = this.tabManager.createTab(file.name, pdfDocument);

            return tabId;

        } catch (error) {
            console.error(`Error loading PDF "${file.name}":`, error);
            throw error;
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 16px;
            border-radius: 4px;
            color: white;
            font-size: 14px;
            z-index: 1000;
            max-width: 300px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
        `;

        // Set background color based on type
        const colors = {
            info: '#3498db',
            success: '#27ae60',
            error: '#e74c3c',
            warning: '#f39c12'
        };

        notification.style.background = colors[type] || colors.info;
        notification.textContent = message;

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 10);

        // Auto-hide after 3 seconds (except for loading notifications)
        if (type !== 'loading') {
            setTimeout(() => {
                this.hideNotification(notification);
            }, 3000);
        }

        return notification;
    }

    hideNotification(notification) {
        if (notification && notification.parentNode) {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';

            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }
    }

    // Keyboard shortcuts
    setupGlobalKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Only handle shortcuts when not in input fields
            if (e.target.tagName.toLowerCase() === 'input') return;

            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'o':
                        e.preventDefault();
                        this.openPdfBtn.click();
                        break;
                    case 'w':
                        e.preventDefault();
                        if (this.tabManager.activeTabId) {
                            this.tabManager.closeTab(this.tabManager.activeTabId);
                        }
                        break;
                    case 'Tab':
                        e.preventDefault();
                        this.switchToNextTab();
                        break;
                }
            }

            // Switch tabs with Ctrl+1, Ctrl+2, etc.
            if ((e.ctrlKey || e.metaKey) && e.key >= '1' && e.key <= '9') {
                e.preventDefault();
                const tabIndex = parseInt(e.key) - 1;
                const tabs = this.tabManager.getAllTabs();
                if (tabs[tabIndex]) {
                    this.tabManager.activateTab(tabs[tabIndex].id);
                }
            }
        });
    }

    switchToNextTab() {
        const tabs = this.tabManager.getAllTabs();
        if (tabs.length <= 1) return;

        const currentActiveId = this.tabManager.activeTabId;
        const currentIndex = tabs.findIndex(tab => tab.id === currentActiveId);
        const nextIndex = (currentIndex + 1) % tabs.length;

        this.tabManager.activateTab(tabs[nextIndex].id);
    }

    // Error handling
    handleError(error, context = '') {
        console.error(`Error in ${context}:`, error);

        let message = 'An unexpected error occurred';
        if (error.message) {
            message = error.message;
        }

        this.showNotification(`${context ? context + ': ' : ''}${message}`, 'error');
    }

    // Cleanup
    destroy() {
        // Clean up event listeners and resources
        if (this.tabManager) {
            this.tabManager.closeAllTabs();
        }

        // Remove any remaining notifications
        document.querySelectorAll('.notification').forEach(notification => {
            notification.remove();
        });
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.pdfReaderApp = new PDFReaderApp();
});

// Handle unload
window.addEventListener('beforeunload', () => {
    if (window.pdfReaderApp) {
        window.pdfReaderApp.destroy();
    }
});