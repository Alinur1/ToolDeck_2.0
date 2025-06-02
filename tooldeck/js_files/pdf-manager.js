// tooldeck(project folder)/js_files/pdf-manager.js

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
        this.previewBar = document.getElementById('pagePreviewBar');
        this.previewToggle = document.getElementById('previewToggle');
        this.previewContent = document.getElementById('previewContent');
        this.pdfViewerContainer = document.getElementById('pdfViewerContainer');
        this.thumbnailScale = 0.2; // Scale for thumbnails

        // Control buttons
        this.zoomInBtn = document.getElementById('zoomInBtn');
        this.zoomOutBtn = document.getElementById('zoomOutBtn');
        this.fitWidthBtn = document.getElementById('fitWidthBtn');

        this.setupEventListeners();
        this.setupPDFJS();
        this.setupPreviewBar();
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

    setupPreviewBar() {
        this.previewToggle.addEventListener('click', () => {
            this.previewBar.classList.toggle('collapsed');
            this.pdfViewerContainer.classList.toggle('with-preview');
            
            // Re-render the visible thumbnails if the bar is expanded
            if (!this.previewBar.classList.contains('collapsed')) {
                this.renderVisibleThumbnails();
            }
        });

        // Use Intersection Observer for lazy loading thumbnails
        this.thumbnailObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const pageNum = parseInt(entry.target.dataset.pageNum);
                    this.renderThumbnail(pageNum);
                }
            });
        }, {
            root: this.previewContent,
            threshold: 0.1
        });
    }

    async renderThumbnail(pageNum) {
        if (!this.currentPDF) return;

        try {
            const page = await this.currentPDF.getPage(pageNum);
            const viewport = page.getViewport({ scale: this.thumbnailScale });
            
            const canvas = document.createElement('canvas');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            
            const context = canvas.getContext('2d');
            await page.render({
                canvasContext: context,
                viewport: viewport
            }).promise;

            const thumbnailContainer = document.querySelector(`.page-thumbnail[data-page-num="${pageNum}"]`);
            if (thumbnailContainer) {
                const oldCanvas = thumbnailContainer.querySelector('canvas');
                if (oldCanvas) {
                    oldCanvas.remove();
                }
                thumbnailContainer.insertBefore(canvas, thumbnailContainer.firstChild);
            }
        } catch (error) {
            console.error(`Error rendering thumbnail ${pageNum}:`, error);
        }
    }

    async renderVisibleThumbnails() {
        if (!this.currentPDF || this.previewBar.classList.contains('collapsed')) return;

        this.previewContent.innerHTML = '';
        
        for (let pageNum = 1; pageNum <= this.totalPages; pageNum++) {
            const thumbnailContainer = document.createElement('div');
            thumbnailContainer.className = 'page-thumbnail';
            thumbnailContainer.dataset.pageNum = pageNum;
            // if (pageNum === this.currentPage) {
            //     thumbnailContainer.classList.add('active');
            // }

            const pageNumber = document.createElement('div');
            pageNumber.className = 'page-number';
            pageNumber.textContent = pageNum;

            thumbnailContainer.appendChild(pageNumber);
            this.previewContent.appendChild(thumbnailContainer);

            thumbnailContainer.addEventListener('click', () => {
                this.goToPage(pageNum);
            });

            this.thumbnailObserver.observe(thumbnailContainer);
        }
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
            this.renderVisibleThumbnails();
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
    }    async renderAllPages() {
        if (!this.currentPDF) return;

        // Create placeholders for all pages first
        for (let pageNum = 1; pageNum <= this.totalPages; pageNum++) {
            const placeholder = document.createElement('div');
            placeholder.className = 'pdf-page-placeholder';
            placeholder.id = `page-${pageNum}`;
            placeholder.dataset.pageNum = pageNum;
            this.pdfContainer.appendChild(placeholder);
        }

        // Render all pages
        const renderPromises = [];
        for (let pageNum = 1; pageNum <= this.totalPages; pageNum++) {
            renderPromises.push(this.renderPage(pageNum));
        }

        await Promise.all(renderPromises);
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
            
            // Replace the placeholder with the rendered canvas
            const placeholder = document.getElementById(`page-${pageNum}`);
            if (placeholder) {
                placeholder.replaceWith(canvas);
            }

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
            this.updateActiveThumbnail();

            // Update tab data
            if (window.tabManager && window.tabManager.activeTabId) {
                window.tabManager.updateTabData(window.tabManager.activeTabId, {
                    currentPage: this.currentPage,
                    scale: this.scale
                });
            }
        }
    }

    updateActiveThumbnail() {
        const thumbnails = this.previewContent.querySelectorAll('.page-thumbnail');
        thumbnails.forEach(thumb => {
            const pageNum = parseInt(thumb.dataset.pageNum);
            if (pageNum === this.currentPage) {
                thumb.classList.add('active');
                thumb.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            } else {
                thumb.classList.remove('active');
            }
        });
    }

    async zoomIn() {
        if (this.scale < 5.0) {
            this.scale = Math.min(5.0, this.scale * 1.25);
            // Update tab data before reloading pages
            if (window.tabManager && window.tabManager.activeTabId) {
                window.tabManager.updateTabData(window.tabManager.activeTabId, {
                    scale: this.scale
                });
            }
            await this.reloadAllPages();
        }
    }

    async zoomOut() {
        if (this.scale > 0.25) {
            this.scale = Math.max(0.25, this.scale / 1.25);
            // Update tab data before reloading pages
            if (window.tabManager && window.tabManager.activeTabId) {
                window.tabManager.updateTabData(window.tabManager.activeTabId, {
                    scale: this.scale
                });
            }
            await this.reloadAllPages();
        }
    }

    async resetZoom() {
        this.scale = 1.0;
        // Update tab data before reloading pages
        if (window.tabManager && window.tabManager.activeTabId) {
            window.tabManager.updateTabData(window.tabManager.activeTabId, {
                scale: this.scale
            });
        }
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

            // Update tab data before reloading pages
            if (window.tabManager && window.tabManager.activeTabId) {
                window.tabManager.updateTabData(window.tabManager.activeTabId, {
                    scale: this.scale
                });
            }
            
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