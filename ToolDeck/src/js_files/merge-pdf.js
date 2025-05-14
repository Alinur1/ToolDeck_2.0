document.addEventListener('DOMContentLoaded', () => {
    const selectPdfButton = document.getElementById('selectPdfButton');
    const pdfFileInput = document.getElementById('pdfFileInput');
    const pdfFileList = document.getElementById('pdfFileList');
    const mergeSaveButton = document.getElementById('mergeSaveButton');
    const clearAllButton = document.getElementById('clearAllButton');
    const messageArea = document.getElementById('messageArea');

    let selectedFiles = [];

    selectPdfButton.addEventListener('click', () => {
        pdfFileInput.click();
    });

    pdfFileInput.addEventListener('change', (event) => {
        const files = event.target.files;
        if (files && files.length > 0) {
            for (const file of files) {
                selectedFiles.push(file);
            }
            updatePdfList();
            pdfFileInput.value = '';
            displayMessage('');
        }
    });

    mergeSaveButton.addEventListener('click', () => {
        if (selectedFiles.length < 2) {
            alert('Please select at least two PDF files to merge.');
            return;
        }

        const fileNames = selectedFiles.map(file => file.name);
        console.log('Files to merge (in order):', fileNames);
        displayMessage('Initiating merge process (backend)...');
    });

    clearAllButton.addEventListener('click', () => {
        selectedFiles = [];
        updatePdfList();
        displayMessage('All selected files cleared.');
    });

    async function renderPdfPreview(file, canvasElement) {
        const fileReader = new FileReader();

        return new Promise((resolve, reject) => {
            fileReader.onload = async function () {
                const typedarray = new Uint8Array(this.result);
                if (typeof pdfjsLib === 'undefined') {
                    console.error("PDF.js library (pdfjsLib) is not defined.");
                    return reject(new Error("PDF.js not loaded."));
                }

                try {
                    const pdf = await pdfjsLib.getDocument({ data: typedarray }).promise;
                    const page = await pdf.getPage(1);
                    const desiredWidth = 150;
                    let viewport = page.getViewport({ scale: 1 });
                    const scale = desiredWidth / viewport.width;
                    viewport = page.getViewport({ scale });

                    canvasElement.height = viewport.height;
                    canvasElement.width = viewport.width;

                    const context = canvasElement.getContext('2d');
                    await page.render({ canvasContext: context, viewport }).promise;
                    resolve();
                } catch (error) {
                    console.error(`Error rendering PDF preview for ${file.name}:`, error);
                    reject(error);
                }
            };

            fileReader.onerror = reject;
            fileReader.readAsArrayBuffer(file);
        });
    }

    async function updatePdfList() {
        pdfFileList.innerHTML = '';

        if (selectedFiles.length === 0) {
            const listItem = document.createElement('li');
            listItem.textContent = 'No PDF files selected yet.';
            pdfFileList.appendChild(listItem);
            return;
        }

        selectedFiles.forEach(async (file, index) => {
            const listItem = document.createElement('li');
            listItem.classList.add('pdf-list-item-container');
            listItem.setAttribute('draggable', 'true');
            listItem.dataset.index = index;

            const fileInfoDiv = document.createElement('div');
            fileInfoDiv.classList.add('pdf-file-info');
            fileInfoDiv.textContent = `${index + 1}. ${file.name}`;

            const breakLine = document.createElement('br');

            const canvas = document.createElement('canvas');
            canvas.classList.add('pdf-preview-canvas');
            canvas.width = 200;
            canvas.height = 260;

            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#e0e0e0';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#333';
            ctx.textAlign = 'center';
            ctx.font = '16px Arial';
            ctx.fillText('Loading preview...', canvas.width / 2, canvas.height / 2);

            listItem.appendChild(fileInfoDiv);
            listItem.appendChild(canvas);
            pdfFileList.appendChild(listItem);

            // Setup drag events
            setupDragEvents(listItem);

            try {
                await renderPdfPreview(file, canvas);
            } catch (err) {
                console.warn(`Failed to preview ${file.name}`);
            }
        });
    }

    function setupDragEvents(listItem) {
        listItem.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', e.currentTarget.dataset.index);
            e.currentTarget.style.opacity = '0.5';
        });

        listItem.addEventListener('dragend', (e) => {
            e.currentTarget.style.opacity = '1';
        });

        listItem.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.currentTarget.style.borderTop = '2px solid blue';
        });

        listItem.addEventListener('dragleave', (e) => {
            e.currentTarget.style.borderTop = '';
        });

        listItem.addEventListener('drop', (e) => {
            e.preventDefault();
            e.currentTarget.style.borderTop = '';

            const fromIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
            const toIndex = parseInt(e.currentTarget.dataset.index, 10);

            if (fromIndex === toIndex) return;

            const movedFile = selectedFiles.splice(fromIndex, 1)[0];
            selectedFiles.splice(toIndex, 0, movedFile);

            updatePdfList();
        });
    }

    function displayMessage(message) {
        messageArea.textContent = message;
    }

    updatePdfList();
});
