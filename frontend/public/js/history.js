// DOM elements
const historyList = document.getElementById('history-list');
const emptyState = document.getElementById('empty-state');
const clearHistoryBtn = document.getElementById('clear-history');
const refreshHistoryBtn = document.getElementById('refresh-history');
const filterButtons = document.querySelectorAll('.filter-btn');
const totalRecordsSpan = document.getElementById('total-records');
const totalScansSpan = document.getElementById('total-scans');
const totalGenerationsSpan = document.getElementById('total-generations');

let historyData = [];
let currentFilter = 'all';

// Initialize history page
document.addEventListener('DOMContentLoaded', () => {
    setupFilterButtons();
    setupHistoryActions();
    loadHistory();
    loadStats();
});

// Setup filter buttons
function setupFilterButtons() {
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const filter = btn.dataset.filter;
            
            // Update active button
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Apply filter
            currentFilter = filter;
            filterHistory();
        });
    });
}

// Setup history actions
function setupHistoryActions() {
    clearHistoryBtn.addEventListener('click', clearAllHistory);
    refreshHistoryBtn.addEventListener('click', () => {
        loadHistory();
        loadStats();
    });
}

// Load history from API
async function loadHistory() {
    try {
        utils.showLoading();
        hideEmptyState();
        
        const result = await api.getHistory(100); // Load more records for better UX
        
        if (result.success) {
            historyData = result.history;
            filterHistory();
        } else {
            utils.showToast('Failed to load history', 'error');
            showEmptyState();
        }
        
    } catch (error) {
        console.error('Load history error:', error);
        utils.showToast(error.message || 'Failed to load history', 'error');
        showEmptyState();
    } finally {
        utils.hideLoading();
    }
}

// Load statistics
async function loadStats() {
    try {
        const result = await api.getHistoryStats();
        
        if (result.success) {
            const stats = result.stats;
            totalRecordsSpan.textContent = stats.total_records;
            totalScansSpan.textContent = stats.scans;
            totalGenerationsSpan.textContent = stats.generations;
        }
        
    } catch (error) {
        console.error('Load stats error:', error);
    }
}

// Filter history
function filterHistory() {
    let filteredData = historyData;
    
    if (currentFilter !== 'all') {
        filteredData = historyData.filter(item => item.type === currentFilter);
    }
    
    if (filteredData.length === 0) {
        showEmptyState();
    } else {
        hideEmptyState();
        displayHistory(filteredData);
    }
}

// Display history
function displayHistory(data) {
    historyList.innerHTML = '';
    
    data.forEach(item => {
        const historyItem = createHistoryItem(item);
        historyList.appendChild(historyItem);
    });
    
    // Add animation
    const items = historyList.querySelectorAll('.history-item');
    items.forEach((item, index) => {
        item.style.animationDelay = `${index * 0.1}s`;
        item.classList.add('fade-in');
    });
}

// Create history item element
function createHistoryItem(item) {
    const div = document.createElement('div');
    div.className = 'history-item';
    div.dataset.id = item.id;
    
    const qrInfo = item.data?.qr_info || { type: 'text', description: 'Plain Text' };
    const method = item.data?.method || 'unknown';
    const timestamp = utils.formatDate(item.timestamp);
    
    div.innerHTML = `
        <div class="history-header">
            <div class="history-type ${item.type}">
                <i class="fas fa-${item.type === 'scan' ? 'camera' : 'plus-square'}"></i>
                <span>${item.type === 'scan' ? 'Scanned' : 'Generated'}</span>
            </div>
            <div class="history-date">${timestamp}</div>
        </div>
        
        <div class="history-content">${utils.truncateText(item.content, 200)}</div>
        
        <div class="history-meta">
            <div class="meta-info">
                <span class="content-type">${qrInfo.description}</span>
                <span class="method-info">
                    <i class="fas fa-${getMethodIcon(method)}"></i>
                    ${getMethodText(method)}
                </span>
            </div>
            
            <div class="history-actions">
                <button class="btn btn-primary" onclick="copyHistoryContent('${escapeHtml(item.content)}')">
                    <i class="fas fa-copy"></i>
                </button>
                <button class="btn btn-success" onclick="openHistoryContent('${escapeHtml(item.content)}', '${qrInfo.type}')">
                    <i class="fas fa-external-link-alt"></i>
                </button>
                ${item.type === 'scan' ? `
                    <button class="btn btn-info" onclick="regenerateFromHistory('${escapeHtml(item.content)}')">
                        <i class="fas fa-qrcode"></i>
                    </button>
                ` : ''}
                <button class="btn btn-secondary" onclick="shareHistoryContent('${escapeHtml(item.content)}')">
                    <i class="fas fa-share"></i>
                </button>
                <button class="btn btn-danger" onclick="deleteHistoryItem(${item.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `;
    
    // Add click handler for content expansion
    const content = div.querySelector('.history-content');
    if (item.content.length > 200) {
        content.style.cursor = 'pointer';
        content.title = 'Click to expand';
        content.addEventListener('click', () => {
            if (content.textContent === utils.truncateText(item.content, 200)) {
                content.textContent = item.content;
                content.title = 'Click to collapse';
            } else {
                content.textContent = utils.truncateText(item.content, 200);
                content.title = 'Click to expand';
            }
        });
    }
    
    return div;
}

// Get method icon
function getMethodIcon(method) {
    const icons = {
        'camera_capture': 'camera',
        'file_upload': 'upload',
        'text_input': 'keyboard'
    };
    return icons[method] || 'question';
}

// Get method text
function getMethodText(method) {
    const texts = {
        'camera_capture': 'Camera',
        'file_upload': 'File Upload',
        'text_input': 'Manual Input'
    };
    return texts[method] || 'Unknown';
}

// Escape HTML for onclick attributes
function escapeHtml(text) {
    return text.replace(/'/g, '&#39;').replace(/"/g, '&quot;');
}

// Copy history content
function copyHistoryContent(content) {
    const unescaped = content.replace(/&#39;/g, "'").replace(/&quot;/g, '"');
    utils.copyToClipboard(unescaped);
}

// Open history content
function openHistoryContent(content, type) {
    const unescaped = content.replace(/&#39;/g, "'").replace(/&quot;/g, '"');
    
    if (type === 'url' && (unescaped.startsWith('http://') || unescaped.startsWith('https://'))) {
        window.open(unescaped, '_blank');
    } else if (type === 'email' && unescaped.startsWith('mailto:')) {
        window.open(unescaped, '_blank');
    } else if (type === 'phone' && unescaped.startsWith('tel:')) {
        window.open(unescaped, '_blank');
    } else if (type === 'sms' && unescaped.startsWith('sms:')) {
        window.open(unescaped, '_blank');
    } else {
        copyHistoryContent(content);
        utils.showToast('Content copied to clipboard', 'success');
    }
}

// Regenerate QR from history
function regenerateFromHistory(content) {
    const unescaped = content.replace(/&#39;/g, "'").replace(/&quot;/g, '"');
    sessionStorage.setItem('qr_generate_text', unescaped);
    navigateTo('/generator');
}

// Share history content
function shareHistoryContent(content) {
    const unescaped = content.replace(/&#39;/g, "'").replace(/&quot;/g, '"');
    
    const shareData = {
        title: 'QR Code Content',
        text: unescaped
    };
    
    if (unescaped.startsWith('http://') || unescaped.startsWith('https://')) {
        shareData.url = unescaped;
    }
    
    utils.shareContent(shareData);
}

// Delete history item
async function deleteHistoryItem(id) {
    if (!confirm('Are you sure you want to delete this item?')) {
        return;
    }
    
    try {
        const result = await api.deleteHistoryRecord(id);
        
        if (result.success) {
            // Remove from UI
            const item = document.querySelector(`.history-item[data-id="${id}"]`);
            if (item) {
                item.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => {
                    item.remove();
                    
                    // Update data
                    historyData = historyData.filter(h => h.id !== id);
                    
                    // Check if empty
                    if (historyData.length === 0 || 
                        (currentFilter !== 'all' && historyData.filter(h => h.type === currentFilter).length === 0)) {
                        showEmptyState();
                    }
                    
                    // Update stats
                    loadStats();
                }, 300);
            }
            
            utils.showToast('Item deleted successfully', 'success');
        } else {
            utils.showToast('Failed to delete item', 'error');
        }
        
    } catch (error) {
        console.error('Delete error:', error);
        utils.showToast(error.message || 'Failed to delete item', 'error');
    }
}

// Clear all history
async function clearAllHistory() {
    if (!confirm('Are you sure you want to clear all history? This action cannot be undone.')) {
        return;
    }
    
    try {
        utils.showLoading();
        
        const result = await api.clearHistory();
        
        if (result.success) {
            historyData = [];
            showEmptyState();
            loadStats(); // Update stats
            utils.showToast(result.message || 'History cleared successfully', 'success');
        } else {
            utils.showToast('Failed to clear history', 'error');
        }
        
    } catch (error) {
        console.error('Clear history error:', error);
        utils.showToast(error.message || 'Failed to clear history', 'error');
    } finally {
        utils.hideLoading();
    }
}

// Show empty state
function showEmptyState() {
    historyList.style.display = 'none';
    emptyState.style.display = 'block';
}

// Hide empty state
function hideEmptyState() {
    historyList.style.display = 'block';
    emptyState.style.display = 'none';
}

// Export history data
function exportHistory() {
    if (historyData.length === 0) {
        utils.showToast('No history to export', 'error');
        return;
    }
    
    const exportData = historyData.map(item => ({
        type: item.type,
        content: item.content,
        timestamp: item.timestamp,
        content_type: item.data?.qr_info?.type || 'text',
        method: item.data?.method || 'unknown'
    }));
    
    const csv = convertToCSV(exportData);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const filename = `qr_history_${new Date().toISOString().split('T')[0]}.csv`;
    
    utils.downloadFile(url, filename);
    utils.showToast('History exported successfully', 'success');
}

// Convert data to CSV
function convertToCSV(data) {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvHeaders = headers.join(',');
    
    const csvRows = data.map(row => {
        return headers.map(header => {
            const value = row[header] || '';
            // Escape quotes and wrap in quotes if contains comma or newline
            if (typeof value === 'string' && (value.includes(',') || value.includes('\n') || value.includes('"'))) {
                return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
        }).join(',');
    });
    
    return [csvHeaders, ...csvRows].join('\n');
}

// Search history
function searchHistory(query) {
    if (!query.trim()) {
        filterHistory();
        return;
    }
    
    const filtered = historyData.filter(item => {
        const searchText = `${item.content} ${item.type} ${item.data?.qr_info?.description || ''}`.toLowerCase();
        return searchText.includes(query.toLowerCase());
    });
    
    if (filtered.length === 0) {
        showEmptyState();
    } else {
        hideEmptyState();
        displayHistory(filtered);
    }
}

// Add search functionality (if search input exists)
const searchInput = document.getElementById('search-input');
if (searchInput) {
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            searchHistory(e.target.value);
        }, 300);
    });
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl+R or F5 - Refresh
    if ((e.ctrlKey && e.key === 'r') || e.key === 'F5') {
        e.preventDefault();
        loadHistory();
        loadStats();
    }
    
    // Delete key - Clear all (with confirmation)
    if (e.key === 'Delete' && e.ctrlKey && e.shiftKey) {
        e.preventDefault();
        clearAllHistory();
    }
    
    // Ctrl+E - Export
    if (e.ctrlKey && e.key === 'e') {
        e.preventDefault();
        exportHistory();
    }
});

// Add additional CSS for animations
const additionalStyles = `
    @keyframes slideOut {
        from { 
            transform: translateX(0); 
            opacity: 1; 
        }
        to { 
            transform: translateX(-100%); 
            opacity: 0; 
        }
    }
    
    .history-item {
        transition: all 0.3s ease;
    }
    
    .history-item:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(0,0,0,0.15);
    }
    
    .meta-info {
        display: flex;
        align-items: center;
        gap: 15px;
        flex-wrap: wrap;
    }
    
    .method-info {
        display: flex;
        align-items: center;
        gap: 5px;
        color: #6c757d;
        font-size: 0.8rem;
    }
    
    .history-actions {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
    }
    
    .history-actions .btn {
        padding: 4px 8px;
        font-size: 0.7rem;
        min-width: auto;
    }
    
    @media (max-width: 768px) {
        .history-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
        }
        
        .meta-info {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
        }
        
        .history-actions {
            justify-content: flex-start;
        }
    }
`;

// Add styles to document
const styleElement = document.createElement('style');
styleElement.textContent = additionalStyles;
document.head.appendChild(styleElement);

console.log('History module loaded');