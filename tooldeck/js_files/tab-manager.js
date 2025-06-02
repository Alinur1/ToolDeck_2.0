// tooldeck(project folder)/js_files/tab-manager.js

class TabManager {
    constructor() {
        this.tabs = new Map();
        this.activeTabId = null;
        this.tabCounter = 0;
        this.tabBar = document.getElementById('tabBar');
        this.welcomeScreen = document.getElementById('welcomeScreen');
        this.pdfViewerContainer = document.getElementById('pdfViewerContainer');
        this.closeTabBtn = document.getElementById('closeTabBtn');

        this.setupEventListeners();
    }

    setupEventListeners() {
        // Close tab button
        this.closeTabBtn.addEventListener('click', () => {
            if (this.activeTabId) {
                this.closeTab(this.activeTabId);
            }
        });
    }

    createTab(fileName, pdfDocument) {
        const tabId = `tab-${++this.tabCounter}`;

        // Create tab data
        const tabData = {
            id: tabId,
            fileName: fileName,
            pdfDocument: pdfDocument,
            currentPage: 1,
            totalPages: pdfDocument.numPages,
            scale: 1.0
        };

        // Store tab data
        this.tabs.set(tabId, tabData);

        // Create tab element
        const tabElement = this.createTabElement(tabId, fileName);
        this.tabBar.appendChild(tabElement);

        // Activate the new tab
        this.activateTab(tabId);

        // Hide welcome screen and show PDF viewer
        this.welcomeScreen.style.display = 'none';
        this.pdfViewerContainer.style.display = 'flex';

        // Enable close button
        this.closeTabBtn.disabled = false;

        return tabId;
    }

    createTabElement(tabId, fileName) {
        const tab = document.createElement('div');
        tab.className = 'tab';
        tab.dataset.tabId = tabId;

        const title = document.createElement('span');
        title.className = 'tab-title';
        title.textContent = fileName;
        title.title = fileName; // Full name on hover

        const closeBtn = document.createElement('span');
        closeBtn.className = 'tab-close';
        closeBtn.innerHTML = '✕';
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.closeTab(tabId);
        });

        tab.appendChild(title);
        tab.appendChild(closeBtn);

        // Tab click handler
        tab.addEventListener('click', () => {
            this.activateTab(tabId);
        });

        return tab;
    }

    activateTab(tabId) {
        // Remove active class from all tabs
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.remove('active');
        });

        // Add active class to selected tab
        const tabElement = document.querySelector(`[data-tab-id="${tabId}"]`);
        if (tabElement) {
            tabElement.classList.add('active');
        }

        // Set active tab
        this.activeTabId = tabId;

        // Load the PDF for this tab
        const tabData = this.tabs.get(tabId);
        if (tabData && window.pdfManager) {
            window.pdfManager.loadPDF(tabData.pdfDocument, tabData);
        }
    }

    closeTab(tabId) {
        const tabData = this.tabs.get(tabId);
        if (!tabData) return;

        // Remove tab element
        const tabElement = document.querySelector(`[data-tab-id="${tabId}"]`);
        if (tabElement) {
            tabElement.remove();
        }

        // Remove tab data
        this.tabs.delete(tabId);

        // If this was the active tab, activate another one or show welcome screen
        if (this.activeTabId === tabId) {
            this.activeTabId = null;

            // Try to activate the first available tab
            const remainingTabs = Array.from(this.tabs.keys());
            if (remainingTabs.length > 0) {
                this.activateTab(remainingTabs[0]);
            } else {
                // No tabs left, show welcome screen
                this.showWelcomeScreen();
            }
        }
    }

    showWelcomeScreen() {
        this.welcomeScreen.style.display = 'flex';
        this.pdfViewerContainer.style.display = 'none';
        this.closeTabBtn.disabled = true;
        this.activeTabId = null;
    }

    getActiveTab() {
        return this.activeTabId ? this.tabs.get(this.activeTabId) : null;
    }

    updateTabData(tabId, updates) {
        const tabData = this.tabs.get(tabId);
        if (tabData) {
            Object.assign(tabData, updates);
        }
    }

    getAllTabs() {
        return Array.from(this.tabs.values());
    }

    hasOpenTabs() {
        return this.tabs.size > 0;
    }

    closeAllTabs() {
        const tabIds = Array.from(this.tabs.keys());
        tabIds.forEach(tabId => this.closeTab(tabId));
    }
}