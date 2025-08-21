// Global configuration
const API_BASE_URL = 'http://localhost:5000/api';

// Utility functions
const utils = {
    // Show loading state
    showLoading: (elementId = 'loading') => {
        const loading = document.getElementById(elementId);
        if (loading) loading.style.display = 'block';
    },

    // Hide loading state
    hideLoading: (elementId = 'loading') => {
        const loading = document.getElementById(elementId);
        if (loading) loading.style.display = 'none';
    },

    // Show toast notification
    showToast: (message, type = 'info') => {
        // Remove existing toast
        const existingToast = document.querySelector('.toast');
        if (existingToast) existingToast.remove();

        // Create toast
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas fa-${type === 'error' ? 'exclamation-circle' : 'check-circle'}"></i>
                <span>${message}</span>
            </div>
            <button class="toast-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;

        // Add toast styles
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? '#dc3545' : '#28a745'};
            color: white;
            padding: 15px;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: space-between;
            min-width: 300px;
            animation: slideIn 0.3s ease;
        `;

        document.body.appendChild(toast);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (toast.parentElement) {
                toast.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => toast.remove(), 300);
            }
        }, 5000);
    },

    // Format date
    formatDate: (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        
        return date.toLocaleDateString();
    },

    // Copy text to clipboard
    copyToClipboard: async (text) => {
        try {
            await navigator.clipboard.writeText(text);
            utils.showToast('Copied to clipboard!', 'success');
            return true;
        } catch (err) {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            try {
                document.execCommand('copy');
                utils.showToast('Copied to clipboard!', 'success');
                return true;
            } catch (err) {
                utils.showToast('Failed to copy to clipboard', 'error');
                return false;
            } finally {
                document.body.removeChild(textArea);
            }
        }
    },

    // Download file
    downloadFile: (dataUrl, filename) => {
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        utils.showToast('File downloaded!', 'success');
    },

    // Share content (Web Share API)
    shareContent: async (data) => {
        if (navigator.share) {
            try {
                await navigator.share(data);
                utils.showToast('Shared successfully!', 'success');
            } catch (err) {
                if (err.name !== 'AbortError') {
                    utils.showToast('Failed to share', 'error');
                }
            }
        } else {
            // Fallback - copy to clipboard
            const text = data.text || data.url || data.title || '';
            await utils.copyToClipboard(text);
        }
    },

    // Get content type icon
    getContentTypeIcon: (type) => {
        const icons = {
            'url': 'fas fa-link',
            'email': 'fas fa-envelope',
            'phone': 'fas fa-phone',
            'sms': 'fas fa-sms',
            'wifi': 'fas fa-wifi',
            'vcard': 'fas fa-address-card',
            'event': 'fas fa-calendar',
            'text': 'fas fa-text'
        };
        return icons[type] || 'fas fa-text';
    },

    // Truncate text
    truncateText: (text, maxLength = 100) => {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }
};

// API functions
const api = {
    // Make API request
    request: async (endpoint, options = {}) => {
        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    },

    // Upload file request
    uploadFile: async (endpoint, file) => {
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('File upload failed:', error);
            throw error;
        }
    },

    // Scan QR from file
    scanFromFile: (file) => api.uploadFile('/scan/file', file),

    // Scan QR from image data
    scanFromData: (imageData) => api.request('/scan/data', {
        method: 'POST',
        body: JSON.stringify({ image: imageData })
    }),

    // Generate QR code
    generateQR: (text, options = {}) => api.request('/generate', {
        method: 'POST',
        body: JSON.stringify({ text, ...options })
    }),

    // Get QR info
    getQRInfo: (text) => api.request('/info', {
        method: 'POST',
        body: JSON.stringify({ text })
    }),

    // Get history
    getHistory: (limit = 50) => api.request(`/history?limit=${limit}`),

    // Delete history record
    deleteHistoryRecord: (id) => api.request(`/history/${id}`, {
        method: 'DELETE'
    }),

    // Clear history
    clearHistory: () => api.request('/history/clear', {
        method: 'DELETE'
    }),

    // Get history stats
    getHistoryStats: () => api.request('/history/stats')
};

// Navigation function
function navigateTo(path) {
    window.location.href = path;
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    // Add CSS animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
        
        .toast-content {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .toast-close {
            background: none;
            border: none;
            color: white;
            cursor: pointer;
            padding: 5px;
            margin-left: 10px;
        }
        
        .fade-in {
            animation: fadeIn 0.3s ease;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
    `;
    document.head.appendChild(style);

    // Set active navigation item
    const currentPath = window.location.pathname;
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        const href = item.getAttribute('href');
        if (href === currentPath || (currentPath === '/' && href === '/')) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    console.log('QR Scanner App initialized');
});