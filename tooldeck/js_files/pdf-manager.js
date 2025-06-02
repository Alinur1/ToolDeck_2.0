class PDFManager {
    constructor() {
        this.pdfContainer = document.getElementById('pdfContainer');
        this.currentPDF = null;
        this.currentPage = 1;
        this.scale = 1.0;
        this.totalPages = 0;
        this.pageCanvases = new Map();

        // UI elements
        this.currentPageSpan = document.getElementById('currentPage');
        this.totalPagesSpan = document.getElementById('totalPages');
        this.zoomLevelSpan = document.getElementById('zoomLevel');
        this.pdfContent = document.querySelector('.pdf-content');

        // Control buttons
        this.zoomInBtn = document.getElementById('zoomInBtn');
        this.zoomOutBtn = document.getElementById('zoomOutBtn');
        this.fitWidthBtn = document.getElementById('fitWidthBtn');

        this.setupEventListeners();
        this.setupPDFJS();
    } 
    
    setupPDFJS() {
        // Set up PDF.js worker using local file
        pdfjsLib.GlobalWorkerOptions.workerSrc = './js_files/pdfjs_files/pdf.worker.min.js';
    }    setupEventListeners() {
        // Zoom controls
        this.zoomInBtn.addEventListener('click', () => this.zoomIn());
        this.zoomOutBtn.addEventListener('click', () => this.zoomOut());
        this.fitWidthBtn.addEventListener('click', () => this.fitToWidth());

        // Keyboard shortcuts for zoom
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName.toLowerCase() === 'input') return;

            switch (e.key) {
                case '=':
                case '+':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        this.zoomIn();
                    }
                    break;
                case '-':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        this.zoomOut();
                    }
                    break;
                case '0':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        this.resetZoom();
                    }
                    break;
            }
        });

        // Scroll event to update current page number
        this.pdfContent.addEventListener('scroll', () => {
            this.updateCurrentPageFromScroll();
        });

        // Mouse wheel zoom
        this.pdfContent.addEventListener('wheel', (e) => {
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                if (e.deltaY < 0) {
                    this.zoomIn();
                } else {
                    this.zoomOut();
                }
            }
        });
    }

    async loadPDF(pdfDocument, tabData) {
        try {
            this.currentPDF = pdfDocument;
            this.scale = tabData.scale || 1.0;
            this.totalPages = pdfDocument.numPages;
            this.pdfContainer.innerHTML = '';
            this.pageCanvases.clear();

            // Render all pages
            await this.renderAllPages();
            this.updateUI();

            // Scroll to the last viewed page if specified
            if (tabData.currentPage) {
                const canvas = this.pageCanvases.get(tabData.currentPage);
                if (canvas) {
                    canvas.scrollIntoView();
                }
            }

        } catch (error) {
            console.error('Error loading PDF:', error);
            this.showError('Failed to load PDF');
        }
    }

    async renderAllPages() {
        if (!this.currentPDF) return;

        for (let pageNum = 1; pageNum <= this.totalPages; pageNum++) {
            await this.renderPage(pageNum);
        }
    }

    async renderPage(pageNum) {
        try {
            const page = await this.currentPDF.getPage(pageNum);
            const viewport = page.getViewport({ scale: this.scale });

            const canvas = document.createElement('canvas');
            canvas.className = 'pdf-page-canvas';
            canvas.dataset.pageNum = pageNum;
            const context = canvas.getContext('2d');

            canvas.width = viewport.width;
            canvas.height = viewport.height;

            const renderContext = {
                canvasContext: context,
                viewport: viewport
            };

            await page.render(renderContext).promise;
            this.pageCanvases.set(pageNum, canvas);
            this.pdfContainer.appendChild(canvas);

        } catch (error) {
            console.error(`Error rendering page ${pageNum}:`, error);
        }
    }

    updateCurrentPageFromScroll() {
        const containerRect = this.pdfContent.getBoundingClientRect();
        const midpoint = containerRect.top + (containerRect.height / 2);

        let closestPage = 1;
        let smallestDistance = Infinity;

        this.pageCanvases.forEach((canvas, pageNum) => {
            const rect = canvas.getBoundingClientRect();
            const distance = Math.abs(rect.top + (rect.height / 2) - midpoint);
            if (distance < smallestDistance) {
                smallestDistance = distance;
                closestPage = pageNum;
            }
        });

        if (this.currentPage !== closestPage) {
            this.currentPage = closestPage;
            this.updateUI();

            // Update tab data
            if (window.tabManager && window.tabManager.activeTabId) {
                window.tabManager.updateTabData(window.tabManager.activeTabId, {
                    currentPage: this.currentPage,
                    scale: this.scale
                });
            }
        }
    }

    async zoomIn() {
        if (this.scale < 5.0) {
            this.scale = Math.min(5.0, this.scale * 1.25);
            await this.reloadAllPages();
        }
    }

    async zoomOut() {
        if (this.scale > 0.25) {
            this.scale = Math.max(0.25, this.scale / 1.25);
            await this.reloadAllPages();
        }
    }

    async resetZoom() {
        this.scale = 1.0;
        await this.reloadAllPages();
    }

    async reloadAllPages() {
        const scrollTop = this.pdfContent.scrollTop;
        this.pdfContainer.innerHTML = '';
        this.pageCanvases.clear();
        await this.renderAllPages();
        this.updateUI();
        this.pdfContent.scrollTop = scrollTop;
    }

    async fitToWidth() {
        if (!this.currentPDF) return;

        try {
            const page = await this.currentPDF.getPage(1);
            const viewport = page.getViewport({ scale: 1.0 });

            // Get available width (subtract padding and scrollbar)
            const availableWidth = this.pdfContent.clientWidth - 40;

            // Calculate scale to fit width
            const newScale = availableWidth / viewport.width;
            this.scale = Math.max(0.25, Math.min(5.0, newScale));

            await this.reloadAllPages();
        } catch (error) {
            console.error('Error fitting to width:', error);
        }
    }

    updateUI() {
        // Update page info
        this.currentPageSpan.textContent = this.currentPage;
        this.totalPagesSpan.textContent = this.totalPages;

        // Update zoom info
        this.zoomLevelSpan.textContent = Math.round(this.scale * 100) + '%';

        // Update zoom button states
        this.zoomOutBtn.disabled = this.scale <= 0.25;
        this.zoomInBtn.disabled = this.scale >= 5.0;
    }

    async goToPage(pageNumber) {
        const page = Math.max(1, Math.min(this.totalPages, pageNumber));
        if (page !== this.currentPage) {
            this.currentPage = page;
            const canvas = this.pageCanvases.get(page);
            if (canvas) {
                canvas.scrollIntoView();
            }
            this.updateUI();
        }
    }

    getCurrentPageInfo() {
        return {
            currentPage: this.currentPage,
            totalPages: this.totalPages,
            scale: this.scale
        };
    }

    showError(message) {
        console.error(message);
        // You can add more error handling here if needed
    }
}