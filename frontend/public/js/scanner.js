let currentStream = null;
let isScanning = false;
let scanInterval = null;

// DOM elements
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const startCameraBtn = document.getElementById('start-camera');
const stopCameraBtn = document.getElementById('stop-camera');
const captureBtn = document.getElementById('capture-btn');
const fileInput = document.getElementById('file-input');
const fileDropArea = document.getElementById('file-drop-area');
const filePreview = document.getElementById('file-preview');
const previewImage = document.getElementById('preview-image');
const fileName = document.getElementById('file-name');
const scanResults = document.getElementById('scan-results');
const resultsContainer = document.getElementById('results-container');
const cameraScanner = document.getElementById('camera-scanner');
const fileScanner = document.getElementById('file-scanner');

// Initialize scanner
document.addEventListener('DOMContentLoaded', () => {
    setupModeToggle();
    setupCameraControls();
    setupFileUpload();
    setupFileDropZone();
});

// Mode toggle functionality
function setupModeToggle() {
    const modeButtons = document.querySelectorAll('.mode-btn');
    
    modeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const mode = btn.dataset.mode;
            
            // Update active button
            modeButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Show/hide sections
            if (mode === 'camera') {
                cameraScanner.style.display = 'block';
                fileScanner.style.display = 'none';
            } else {
                cameraScanner.style.display = 'none';
                fileScanner.style.display = 'block';
                stopCamera(); // Stop camera if switching to file mode
            }
            
            // Hide results when switching modes
            hideResults();
        });
    });
}

// Camera controls
function setupCameraControls() {
    startCameraBtn.addEventListener('click', startCamera);
    stopCameraBtn.addEventListener('click', stopCamera);
    captureBtn.addEventListener('click', captureAndScan);
}

// Start camera
async function startCamera() {
    try {
        utils.showLoading();
        
        const constraints = {
            video: {
                facingMode: 'environment', // Use back camera on mobile
                width: { ideal: 640 },
                height: { ideal: 480 }
            }
        };

        currentStream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = currentStream;
        
        video.onloadedmetadata = () => {
            video.play();
            startCameraBtn.style.display = 'none';
            stopCameraBtn.style.display = 'inline-flex';
            captureBtn.style.display = 'inline-flex';
            
            // Start continuous scanning
            startContinuousScanning();
            utils.hideLoading();
            utils.showToast('Camera started successfully!', 'success');
        };
        
    } catch (error) {
        console.error('Error starting camera:', error);
        utils.hideLoading();
        utils.showToast('Failed to start camera. Please check permissions.', 'error');
    }
}

// Stop camera
function stopCamera() {
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
        currentStream = null;
    }
    
    stopContinuousScanning();
    video.srcObject = null;
    
    startCameraBtn.style.display = 'inline-flex';
    stopCameraBtn.style.display = 'none';
    captureBtn.style.display = 'none';
}

// Start continuous scanning
function startContinuousScanning() {
    if (isScanning) return;
    
    isScanning = true;
    scanInterval = setInterval(() => {
        if (video.videoWidth > 0 && video.videoHeight > 0) {
            scanVideoFrame();
        }
    }, 500); // Scan every 500ms
}

// Stop continuous scanning
function stopContinuousScanning() {
    isScanning = false;
    if (scanInterval) {
        clearInterval(scanInterval);
        scanInterval = null;
    }
}

// Scan video frame
function scanVideoFrame() {
    if (!video.videoWidth || !video.videoHeight) return;
    
    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert to base64 and scan
    const imageData = canvas.toDataURL('image/png');
    scanImageData(imageData, false); // Don't show loading for continuous scan
}

// Capture and scan
function captureAndScan() {
    if (!video.videoWidth || !video.videoHeight) {
        utils.showToast('Camera not ready', 'error');
        return;
    }
    
    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert to base64 and scan
    const imageData = canvas.toDataURL('image/png');
    scanImageData(imageData, true); // Show loading for manual capture
}

// File upload setup
function setupFileUpload() {
    fileInput.addEventListener('change', handleFileSelect);
}

// File drop zone setup
function setupFileDropZone() {
    fileDropArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        fileDropArea.style.borderColor = '#764ba2';
        fileDropArea.style.backgroundColor = 'rgba(102, 126, 234, 0.1)';
    });
    
    fileDropArea.addEventListener('dragleave', (e) => {
        e.preventDefault();
        fileDropArea.style.borderColor = '#667eea';
        fileDropArea.style.backgroundColor = 'transparent';
    });
    
    fileDropArea.addEventListener('drop', (e) => {
        e.preventDefault();
        fileDropArea.style.borderColor = '#667eea';
        fileDropArea.style.backgroundColor = 'transparent';
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    });
    
    fileDropArea.addEventListener('click', () => {
        fileInput.click();
    });
}

// Handle file selection
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        handleFile(file);
    }
}

// Handle file
function handleFile(file) {
    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/bmp', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
        utils.showToast('Please select a valid image file', 'error');
        return;
    }
    
    // Check file size (16MB limit)
    if (file.size > 16 * 1024 * 1024) {
        utils.showToast('File size too large. Maximum 16MB allowed.', 'error');
        return;
    }
    
    // Show file preview
    const reader = new FileReader();
    reader.onload = (e) => {
        previewImage.src = e.target.result;
        fileName.textContent = file.name;
        filePreview.style.display = 'block';
        
        // Store file for scanning
        window.selectedFile = file;
    };
    reader.readAsDataURL(file);
}

// Scan from file
async function scanFromFile() {
    if (!window.selectedFile) {
        utils.showToast('No file selected', 'error');
        return;
    }
    
    try {
        utils.showLoading();
        hideResults();
        
        const result = await api.scanFromFile(window.selectedFile);
        
        if (result.success && result.results.length > 0) {
            displayResults(result.results);
            utils.showToast(`Found ${result.results.length} QR code(s)!`, 'success');
        } else {
            utils.showToast('No QR codes found in the image', 'error');
        }
        
    } catch (error) {
        console.error('Scan error:', error);
        utils.showToast(error.message || 'Failed to scan QR code', 'error');
    } finally {
        utils.hideLoading();
    }
}

// Scan image data
async function scanImageData(imageData, showLoading = true) {
    try {
        if (showLoading) {
            utils.showLoading();
            hideResults();
        }
        
        const result = await api.scanFromData(imageData);
        
        if (result.success && result.results.length > 0) {
            displayResults(result.results);
            if (showLoading) {
                utils.showToast(`Found ${result.results.length} QR code(s)!`, 'success');
            }
            
            // Stop continuous scanning when QR code is found
            if (isScanning && !showLoading) {
                stopContinuousScanning();
                utils.showToast('QR code detected!', 'success');
            }
        } else if (showLoading) {
            utils.showToast('No QR codes found', 'error');
        }
        
    } catch (error) {
        console.error('Scan error:', error);
        if (showLoading) {
            utils.showToast(error.message || 'Failed to scan QR code', 'error');
        }
    } finally {
        if (showLoading) {
            utils.hideLoading();
        }
    }
}

// Display scan results
function displayResults(results) {
    resultsContainer.innerHTML = '';
    
    results.forEach((result, index) => {
        const resultElement = createResultElement(result, index);
        resultsContainer.appendChild(resultElement);
    });
    
    scanResults.style.display = 'block';
    scanResults.classList.add('fade-in');
}

// Create result element
function createResultElement(result, index) {
    const div = document.createElement('div');
    div.className = 'result-item';
    
    // Get content type info
    const contentInfo = getContentTypeInfo(result.data);
    
    div.innerHTML = `
        <div class="result-header">
            <div class="result-type">
                <i class="${utils.getContentTypeIcon(contentInfo.type)}"></i>
                <span>${contentInfo.description}</span>
            </div>
            <span class="result-position">
                ${result.position.width}×${result.position.height} px
            </span>
        </div>
        
        <div class="result-content">${result.data}</div>
        
        <div class="result-actions">
            <button class="btn btn-primary" onclick="copyResultContent('${escapeHtml(result.data)}')">
                <i class="fas fa-copy"></i> Copy
            </button>
            <button class="btn btn-success" onclick="openResultContent('${escapeHtml(result.data)}', '${contentInfo.type}')">
                <i class="fas fa-external-link-alt"></i> Open
            </button>
            <button class="btn btn-info" onclick="shareResultContent('${escapeHtml(result.data)}')">
                <i class="fas fa-share"></i> Share
            </button>
            <button class="btn btn-secondary" onclick="generateFromResult('${escapeHtml(result.data)}')">
                <i class="fas fa-qrcode"></i> Generate
            </button>
        </div>
    `;
    
    return div;
}

// Get content type info
function getContentTypeInfo(data) {
    const dataLower = data.toLowerCase();
    
    if (dataLower.startsWith('http://') || dataLower.startsWith('https://')) {
        return { type: 'url', description: 'Website URL' };
    } else if (dataLower.startsWith('mailto:')) {
        return { type: 'email', description: 'Email Address' };
    } else if (dataLower.startsWith('tel:')) {
        return { type: 'phone', description: 'Phone Number' };
    } else if (dataLower.startsWith('sms:')) {
        return { type: 'sms', description: 'SMS Message' };
    } else if (dataLower.startsWith('wifi:')) {
        return { type: 'wifi', description: 'WiFi Network' };
    } else if (data.toUpperCase().includes('BEGIN:VCARD')) {
        return { type: 'vcard', description: 'Contact Card' };
    } else if (data.toUpperCase().includes('BEGIN:VEVENT')) {
        return { type: 'event', description: 'Calendar Event' };
    } else {
        return { type: 'text', description: 'Plain Text' };
    }
}

// Utility functions for results
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function copyResultContent(content) {
    utils.copyToClipboard(content);
}

function openResultContent(content, type) {
    if (type === 'url' && (content.startsWith('http://') || content.startsWith('https://'))) {
        window.open(content, '_blank');
    } else if (type === 'email' && content.startsWith('mailto:')) {
        window.open(content, '_blank');
    } else if (type === 'phone' && content.startsWith('tel:')) {
        window.open(content, '_blank');
    } else if (type === 'sms' && content.startsWith('sms:')) {
        window.open(content, '_blank');
    } else {
        utils.copyToClipboard(content);
        utils.showToast('Content copied to clipboard', 'success');
    }
}

function shareResultContent(content) {
    const shareData = {
        title: 'QR Code Content',
        text: content
    };
    
    if (content.startsWith('http://') || content.startsWith('https://')) {
        shareData.url = content;
    }
    
    utils.shareContent(shareData);
}

function generateFromResult(content) {
    // Store content in sessionStorage and navigate to generator
    sessionStorage.setItem('qr_generate_text', content);
    navigateTo('/generator');
}

// Hide results
function hideResults() {
    scanResults.style.display = 'none';
    scanResults.classList.remove('fade-in');
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    stopCamera();
});

// Handle visibility change to pause/resume camera
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        if (isScanning) {
            stopContinuousScanning();
        }
    } else {
        if (currentStream && !isScanning) {
            setTimeout(() => {
                startContinuousScanning();
            }, 1000);
        }
    }
});

console.log('Scanner module loaded');