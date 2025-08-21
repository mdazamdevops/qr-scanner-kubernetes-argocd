// DOM elements
const qrTextArea = document.getElementById('qr-text');
const generateBtn = document.getElementById('generate-btn');
const generatedQRSection = document.getElementById('generated-qr');
const qrImage = document.getElementById('qr-image');
const qrContentInfo = document.getElementById('qr-content-info');
const downloadBtn = document.getElementById('download-btn');
const copyBtn = document.getElementById('copy-btn');
const shareBtn = document.getElementById('share-btn');
const qrSizeSelect = document.getElementById('qr-size');
const errorCorrectionSelect = document.getElementById('error-correction');
const borderSizeSelect = document.getElementById('border-size');

let currentQRData = null;

// Initialize generator
document.addEventListener('DOMContentLoaded', () => {
    setupPresets();
    setupGenerateButton();
    setupQRActions();
    loadSavedText();
});

// Setup preset buttons
function setupPresets() {
    const presetButtons = document.querySelectorAll('.preset-btn');
    
    const presets = {
        url: 'https://example.com',
        email: 'mailto:example@email.com',
        phone: 'tel:+1234567890',
        sms: 'sms:+1234567890?body=Hello!',
        wifi: 'WIFI:T:WPA;S:NetworkName;P:Password;H:false;;'
    };
    
    presetButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const preset = btn.dataset.preset;
            if (presets[preset]) {
                qrTextArea.value = presets[preset];
                qrTextArea.focus();
                
                // Move cursor to appropriate position for editing
                if (preset === 'url') {
                    qrTextArea.setSelectionRange(8, 19); // Select "example.com"
                } else if (preset === 'email') {
                    qrTextArea.setSelectionRange(7, 22); // Select "example@email.com"
                } else if (preset === 'phone' || preset === 'sms') {
                    qrTextArea.setSelectionRange(4, 15); // Select phone number
                } else if (preset === 'wifi') {
                    const text = qrTextArea.value;
                    const networkStart = text.indexOf('S:') + 2;
                    const networkEnd = text.indexOf(';', networkStart);
                    qrTextArea.setSelectionRange(networkStart, networkEnd);
                }
            }
        });
    });
}

// Setup generate button
function setupGenerateButton() {
    generateBtn.addEventListener('click', generateQRCode);
    
    // Allow Enter key to generate (Ctrl+Enter for new line)
    qrTextArea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey) {
            e.preventDefault();
            generateQRCode();
        }
    });
    
    // Auto-resize textarea
    qrTextArea.addEventListener('input', () => {
        qrTextArea.style.height = 'auto';
        qrTextArea.style.height = Math.min(qrTextArea.scrollHeight, 300) + 'px';
    });
}

// Setup QR code actions
function setupQRActions() {
    downloadBtn.addEventListener('click', downloadQRCode);
    copyBtn.addEventListener('click', copyQRCode);
    shareBtn.addEventListener('click', shareQRCode);
}

// Load saved text from sessionStorage
function loadSavedText() {
    const savedText = sessionStorage.getItem('qr_generate_text');
    if (savedText) {
        qrTextArea.value = savedText;
        sessionStorage.removeItem('qr_generate_text');
        
        // Auto-generate if text is present
        setTimeout(() => {
            generateQRCode();
        }, 500);
    }
}

// Generate QR code
async function generateQRCode() {
    const text = qrTextArea.value.trim();
    
    if (!text) {
        utils.showToast('Please enter text to generate QR code', 'error');
        qrTextArea.focus();
        return;
    }
    
    try {
        utils.showLoading();
        hideGeneratedQR();
        
        // Get options
        const sizeValue = qrSizeSelect.value.split(',');
        const size = [parseInt(sizeValue[0]), parseInt(sizeValue[1])];
        const errorCorrection = errorCorrectionSelect.value;
        const border = parseInt(borderSizeSelect.value);
        
        const options = {
            size: size,
            border: border,
            errorCorrection: errorCorrection
        };
        
        const result = await api.generateQR(text, options);
        
        if (result.success) {
            currentQRData = {
                text: text,
                image: result.qr_code.image,
                options: options
            };
            
            displayGeneratedQR(result.qr_code, text);
            utils.showToast('QR code generated successfully!', 'success');
        } else {
            utils.showToast('Failed to generate QR code', 'error');
        }
        
    } catch (error) {
        console.error('Generate error:', error);
        utils.showToast(error.message || 'Failed to generate QR code', 'error');
    } finally {
        utils.hideLoading();
    }
}

// Display generated QR code
function displayGeneratedQR(qrData, text) {
    // Set QR code image
    qrImage.src = qrData.image;
    qrImage.alt = `QR Code for: ${utils.truncateText(text, 50)}`;
    
    // Set content info
    const contentInfo = getContentTypeInfo(text);
    qrContentInfo.innerHTML = `
        <div class="content-type-info">
            <div class="content-type">
                <i class="${utils.getContentTypeIcon(contentInfo.type)}"></i>
                <span>${contentInfo.description}</span>
            </div>
            <div class="content-preview">
                ${utils.truncateText(text, 100)}
            </div>
            <div class="qr-details">
                <span>Size: ${qrData.size[0]}×${qrData.size[1]}px</span>
                <span>Error Correction: ${errorCorrectionSelect.options[errorCorrectionSelect.selectedIndex].text}</span>
            </div>
        </div>
    `;
    
    // Show generated QR section
    generatedQRSection.style.display = 'block';
    generatedQRSection.classList.add('fade-in');
    
    // Scroll to result
    generatedQRSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
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

// Download QR code
function downloadQRCode() {
    if (!currentQRData) {
        utils.showToast('No QR code to download', 'error');
        return;
    }
    
    const filename = `qr_code_${Date.now()}.png`;
    utils.downloadFile(currentQRData.image, filename);
}

// Copy QR code image
async function copyQRCode() {
    if (!currentQRData) {
        utils.showToast('No QR code to copy', 'error');
        return;
    }
    
    try {
        // Convert data URL to blob
        const response = await fetch(currentQRData.image);
        const blob = await response.blob();
        
        // Copy to clipboard
        await navigator.clipboard.write([
            new ClipboardItem({
                [blob.type]: blob
            })
        ]);
        
        utils.showToast('QR code copied to clipboard!', 'success');
    } catch (error) {
        console.error('Copy error:', error);
        // Fallback - copy the text content
        utils.copyToClipboard(currentQRData.text);
    }
}

// Share QR code
async function shareQRCode() {
    if (!currentQRData) {
        utils.showToast('No QR code to share', 'error');
        return;
    }
    
    try {
        if (navigator.share && navigator.canShare) {
            // Convert data URL to blob
            const response = await fetch(currentQRData.image);
            const blob = await response.blob();
            const file = new File([blob], 'qr_code.png', { type: 'image/png' });
            
            const shareData = {
                title: 'QR Code',
                text: `QR Code containing: ${utils.truncateText(currentQRData.text, 50)}`,
                files: [file]
            };
            
            if (navigator.canShare(shareData)) {
                await navigator.share(shareData);
                utils.showToast('QR code shared successfully!', 'success');
                return;
            }
        }
        
        // Fallback - share text content
        const shareData = {
            title: 'QR Code Content',
            text: currentQRData.text
        };
        
        if (currentQRData.text.startsWith('http://') || currentQRData.text.startsWith('https://')) {
            shareData.url = currentQRData.text;
        }
        
        await utils.shareContent(shareData);
        
    } catch (error) {
        console.error('Share error:', error);
        if (error.name !== 'AbortError') {
            utils.showToast('Failed to share QR code', 'error');
        }
    }
}

// Hide generated QR
function hideGeneratedQR() {
    generatedQRSection.style.display = 'none';
    generatedQRSection.classList.remove('fade-in');
}

// Advanced QR code templates
const advancedTemplates = {
    vcard: (name, phone, email, organization) => {
        return `BEGIN:VCARD
VERSION:3.0
FN:${name || 'John Doe'}
ORG:${organization || 'Company'}
TEL:${phone || '+1234567890'}
EMAIL:${email || 'john@example.com'}
END:VCARD`;
    },
    
    event: (title, date, location, description) => {
        const startDate = date || new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        return `BEGIN:VEVENT
SUMMARY:${title || 'Event Title'}
DTSTART:${startDate}
LOCATION:${location || 'Event Location'}
DESCRIPTION:${description || 'Event Description'}
END:VEVENT`;
    },
    
    wifi: (ssid, password, security) => {
        return `WIFI:T:${security || 'WPA'};S:${ssid || 'NetworkName'};P:${password || 'Password'};H:false;;`;
    }
};

// Add advanced template functionality (can be extended)
function showAdvancedTemplate(type) {
    // This could open a modal with form fields for advanced templates
    console.log('Advanced template:', type);
}

console.log('Generator module loaded');