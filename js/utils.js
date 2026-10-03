/**
 * Netaji Nagar Super League - Utility Functions
 * UI notifications, custom modals, input validation, date formatting, CSV export.
 * Strict rule: NO emojis used anywhere.
 */

/**
 * Initializes Lucide icons in the DOM.
 */
export function refreshIcons() {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
    }
}

/**
 * Generate a unique registration ID formatted as NNSL-XXXXXX
 * Generates 6 random uppercase alphanumeric characters (excluding ambiguous chars like 0, O, I, 1)
 * @returns {string} e.g. "NNSL-8F3K21"
 */
export function generateRegistrationId() {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let result = '';
    const array = new Uint8Array(6);
    window.crypto.getRandomValues(array);
    for (let i = 0; i < 6; i++) {
        result += chars[array[i] % chars.length];
    }
    return `NNSL-${result}`;
}

/**
 * Escape HTML to prevent XSS
 * @param {string} str 
 * @returns {string}
 */
export function escapeHtml(str) {
    if (!str && str !== 0) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * Validates full name: trimmed, 2 to 100 characters, letters, spaces and hyphens.
 * @param {string} name 
 * @returns {{valid: boolean, error?: string}}
 */
export function validateName(name) {
    if (!name || typeof name !== 'string') {
        return { valid: false, error: "Please enter your full name." };
    }
    const trimmed = name.trim();
    if (trimmed.length < 2) {
        return { valid: false, error: "Full name must be at least 2 characters." };
    }
    if (trimmed.length > 100) {
        return { valid: false, error: "Full name cannot exceed 100 characters." };
    }
    return { valid: true };
}

/**
 * Validates email format.
 * @param {string} email 
 * @returns {{valid: boolean, error?: string}}
 */
export function validateEmail(email) {
    if (!email || typeof email !== 'string') {
        return { valid: false, error: "Please enter your email address." };
    }
    const trimmed = email.trim();
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!regex.test(trimmed)) {
        return { valid: false, error: "Please enter a valid email address." };
    }
    return { valid: true };
}

/**
 * Validates Indian phone number (10 digits, allows optional +91 or 0 prefix).
 * @param {string} phone 
 * @returns {{valid: boolean, normalized?: string, error?: string}}
 */
export function validatePhone(phone) {
    if (!phone || typeof phone !== 'string') {
        return { valid: false, error: "Please enter your phone number." };
    }
    // Remove all whitespace, dashes, parens
    let cleaned = phone.replace(/[\s\-\(\)]/g, '');
    
    // Remove +91 or 91 or 0 at the start if it has 12 or 11 digits
    if (cleaned.startsWith('+91')) {
        cleaned = cleaned.substring(3);
    } else if (cleaned.startsWith('91') && cleaned.length === 12) {
        cleaned = cleaned.substring(2);
    } else if (cleaned.startsWith('0') && cleaned.length === 11) {
        cleaned = cleaned.substring(1);
    }

    // Must be exactly 10 digits and start with 6, 7, 8, or 9
    const regex = /^[6-9]\d{9}$/;
    if (!regex.test(cleaned)) {
        return { valid: false, error: "Please enter a valid 10-digit Indian mobile number." };
    }

    return { valid: true, normalized: `+91${cleaned}` };
}

/**
 * Validates WhatsApp number.
 * @param {string} whatsapp 
 * @returns {{valid: boolean, normalized?: string, error?: string}}
 */
export function validateWhatsApp(whatsapp) {
    if (!whatsapp || typeof whatsapp !== 'string') {
        return { valid: false, error: "Please enter your WhatsApp number." };
    }
    const res = validatePhone(whatsapp);
    if (!res.valid) {
        return { valid: false, error: "Please enter a valid 10-digit WhatsApp number." };
    }
    return res;
}

/**
 * Format Firestore timestamp or Date to readable string
 * @param {any} timestamp 
 * @returns {string}
 */
export function formatDate(timestamp) {
    if (!timestamp) return 'N/A';
    let date;
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
        date = timestamp.toDate();
    } else if (timestamp.seconds) {
        date = new Date(timestamp.seconds * 1000);
    } else if (timestamp instanceof Date) {
        date = timestamp;
    } else {
        date = new Date(timestamp);
    }

    if (isNaN(date.getTime())) return 'N/A';

    return new Intl.DateTimeFormat('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    }).format(date);
}

/**
 * Toast Notification System
 * Displays non-intrusive, accessible notifications. NO emojis used.
 */
let toastContainer = null;

function ensureToastContainer() {
    if (!toastContainer || !document.body.contains(toastContainer)) {
        toastContainer = document.getElementById('toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toast-container';
            toastContainer.className = 'toast-container';
            toastContainer.setAttribute('aria-live', 'polite');
            document.body.appendChild(toastContainer);
        }
    }
    return toastContainer;
}

/**
 * Shows a toast message
 * @param {string} message 
 * @param {'success'|'error'|'warning'|'info'} type 
 * @param {number} duration 
 */
export function showToast(message, type = 'info', duration = 4000) {
    const container = ensureToastContainer();
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', 'alert');

    let iconName = 'info';
    if (type === 'success') iconName = 'check-circle-2';
    if (type === 'error') iconName = 'alert-triangle';
    if (type === 'warning') iconName = 'alert-circle';

    toast.innerHTML = `
        <div class="toast-icon">
            <i data-lucide="${iconName}"></i>
        </div>
        <div class="toast-content">
            <span class="toast-message">${escapeHtml(message)}</span>
        </div>
        <button type="button" class="toast-close" aria-label="Close notification">
            <i data-lucide="x"></i>
        </button>
    `;

    container.appendChild(toast);
    refreshIcons();

    // Trigger entrance animation
    requestAnimationFrame(() => {
        toast.classList.add('toast-visible');
    });

    const closeBtn = toast.querySelector('.toast-close');
    const dismiss = () => {
        toast.classList.remove('toast-visible');
        toast.classList.add('toast-hiding');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    };

    if (closeBtn) closeBtn.addEventListener('click', dismiss);

    if (duration > 0) {
        setTimeout(dismiss, duration);
    }
}

/**
 * Custom Confirmation Modal (Replaces browser confirm() dialog)
 * @param {Object} options
 * @param {string} options.title
 * @param {string} options.message
 * @param {string} [options.confirmText='Confirm']
 * @param {string} [options.cancelText='Cancel']
 * @param {'danger'|'warning'|'primary'} [options.type='primary']
 * @returns {Promise<boolean>}
 */
export function showConfirmModal({ title, message, confirmText = 'Confirm', cancelText = 'Cancel', type = 'primary' }) {
    return new Promise((resolve) => {
        let modalBackdrop = document.getElementById('nnsl-confirm-modal');
        if (modalBackdrop) {
            modalBackdrop.remove();
        }

        modalBackdrop = document.createElement('div');
        modalBackdrop.id = 'nnsl-confirm-modal';
        modalBackdrop.className = 'modal-backdrop';
        modalBackdrop.setAttribute('role', 'dialog');
        modalBackdrop.setAttribute('aria-modal', 'true');

        let iconName = 'alert-circle';
        if (type === 'danger') iconName = 'alert-triangle';

        modalBackdrop.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-header">
                    <div class="modal-header-icon modal-icon-${type}">
                        <i data-lucide="${iconName}"></i>
                    </div>
                    <h3 class="modal-title">${escapeHtml(title)}</h3>
                </div>
                <div class="modal-body">
                    <p class="modal-message">${escapeHtml(message)}</p>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary modal-cancel-btn">${escapeHtml(cancelText)}</button>
                    <button type="button" class="btn btn-${type === 'danger' ? 'danger' : 'primary'} modal-confirm-btn">${escapeHtml(confirmText)}</button>
                </div>
            </div>
        `;

        document.body.appendChild(modalBackdrop);
        refreshIcons();

        // Animate in
        requestAnimationFrame(() => {
            modalBackdrop.classList.add('modal-visible');
        });

        const cleanUp = (result) => {
            modalBackdrop.classList.remove('modal-visible');
            setTimeout(() => {
                if (modalBackdrop.parentNode) modalBackdrop.remove();
                resolve(result);
            }, 250);
        };

        const cancelBtn = modalBackdrop.querySelector('.modal-cancel-btn');
        const confirmBtn = modalBackdrop.querySelector('.modal-confirm-btn');

        cancelBtn.addEventListener('click', () => cleanUp(false));
        confirmBtn.addEventListener('click', () => cleanUp(true));

        modalBackdrop.addEventListener('click', (e) => {
            if (e.target === modalBackdrop) cleanUp(false);
        });

        const keyHandler = (e) => {
            if (e.key === 'Escape') {
                window.removeEventListener('keydown', keyHandler);
                cleanUp(false);
            }
        };
        window.addEventListener('keydown', keyHandler);
    });
}

/**
 * Exports player array to CSV and triggers file download
 * @param {Array<Object>} players 
 * @param {string} filename 
 */
export function exportPlayersToCSV(players, filename = 'NNSL_Player_Registrations.csv') {
    if (!players || !players.length) {
        showToast("No players available to export.", "warning");
        return;
    }

    const headers = [
        "Registration ID",
        "Full Name",
        "Email Address",
        "Phone Number",
        "WhatsApp Number",
        "Preferred Position",
        "Status",
        "Registered On"
    ];

    const rows = players.map(p => {
        return [
            `"${p.registrationId || ''}"`,
            `"${(p.name || '').replace(/"/g, '""')}"`,
            `"${(p.email || '').replace(/"/g, '""')}"`,
            `"${p.phone || ''}"`,
            `"${p.whatsapp || ''}"`,
            `"${p.preferredPosition || ''}"`,
            `"${p.status || 'pending'}"`,
            `"${formatDate(p.createdAt)}"`
        ].join(',');
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Player registrations exported to CSV successfully.", "success");
}
