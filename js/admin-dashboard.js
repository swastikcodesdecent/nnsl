/**
 * Netaji Nagar Super League - Admin Dashboard Logic
 * Real-time Firestore sync, stats calculations, position distribution,
 * search & multi-filter, player details modal, notes saving, status transitions, and CSV export.
 * Zero Emojis. Built with Lucide Icons.
 */

import { 
    subscribeToPlayers, 
    updatePlayerStatus, 
    updatePlayerAdminNotes 
} from './firebase-service.js';
import { 
    refreshIcons, 
    formatDate, 
    escapeHtml, 
    showToast, 
    showConfirmModal, 
    exportPlayersToCSV 
} from './utils.js';

let allPlayers = [];
let selectedPlayer = null;
let unsubscribeFirestore = null;

document.addEventListener('DOMContentLoaded', () => {
    // 1. Sidebar and Tab Navigation
    const navItems = document.querySelectorAll('.admin-nav-item');
    const tabContents = document.querySelectorAll('.admin-tab-content');
    const pageTitle = document.getElementById('current-view-title');
    const sidebar = document.getElementById('admin-sidebar');
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebarBackdrop = document.getElementById('admin-sidebar-backdrop');
    const viewAllPlayersBtn = document.getElementById('view-all-players-btn');

    function switchTab(tabId) {
        navItems.forEach(item => {
            if (item.getAttribute('data-tab') === tabId) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        tabContents.forEach(tab => {
            if (tab.id === `tab-${tabId}`) {
                tab.style.display = 'block';
            } else {
                tab.style.display = 'none';
            }
        });

        if (pageTitle) {
            if (tabId === 'overview') pageTitle.textContent = 'Overview';
            if (tabId === 'players') pageTitle.textContent = 'Player Management';
            if (tabId === 'settings') pageTitle.textContent = 'Tournament Info';
        }

        // Close sidebar on mobile
        sidebar.classList.remove('open');
        sidebarBackdrop.classList.remove('active');
        refreshIcons();
    }

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const tabId = item.getAttribute('data-tab');
            switchTab(tabId);
        });
    });

    if (viewAllPlayersBtn) {
        viewAllPlayersBtn.addEventListener('click', () => switchTab('players'));
    }

    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
            sidebarBackdrop.classList.toggle('active');
        });
    }

    if (sidebarBackdrop) {
        sidebarBackdrop.addEventListener('click', () => {
            sidebar.classList.remove('open');
            sidebarBackdrop.classList.remove('active');
        });
    }

    // 2. Listen for Authenticated Event
    window.addEventListener('nnsl-admin-ready', () => {
        startRealtimeListener();
    });

    // 3. Search and Filters
    const searchInput = document.getElementById('player-search-input');
    const filterStatus = document.getElementById('filter-status');
    const filterPosition = document.getElementById('filter-position');
    const exportCsvBtn = document.getElementById('export-csv-btn');
    const topbarExportBtn = document.getElementById('topbar-export-btn');

    if (searchInput) searchInput.addEventListener('input', renderPlayersTable);
    if (filterStatus) filterStatus.addEventListener('change', renderPlayersTable);
    if (filterPosition) filterPosition.addEventListener('change', renderPlayersTable);

    if (exportCsvBtn) {
        exportCsvBtn.addEventListener('click', () => exportCurrentPlayers());
    }
    if (topbarExportBtn) {
        topbarExportBtn.addEventListener('click', () => exportCurrentPlayers());
    }

    // 4. Modal Handlers
    const modal = document.getElementById('player-detail-modal');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const saveNotesBtn = document.getElementById('save-notes-btn');
    const modalAdminNotes = document.getElementById('modal-admin-notes');

    function closeModal() {
        modal.classList.remove('modal-visible');
        modal.setAttribute('aria-hidden', 'true');
        selectedPlayer = null;
    }

    if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
    }

    // Save internal notes
    if (saveNotesBtn) {
        saveNotesBtn.addEventListener('click', async () => {
            if (!selectedPlayer) return;
            const newNotes = modalAdminNotes.value;
            saveNotesBtn.disabled = true;
            saveNotesBtn.innerHTML = `
                <i data-lucide="loader-2" class="btn-spinner"></i>
                <span>Saving...</span>
            `;
            refreshIcons();

            try {
                await updatePlayerAdminNotes(selectedPlayer.registrationId, newNotes);
                selectedPlayer.adminNotes = newNotes;
                showToast("Admin notes saved successfully.", "success");
            } catch (err) {
                console.error("Failed to save notes:", err);
                showToast("Failed to save notes. Please try again.", "error");
            } finally {
                saveNotesBtn.disabled = false;
                saveNotesBtn.innerHTML = `
                    <i data-lucide="save"></i>
                    <span>Save Notes</span>
                `;
                refreshIcons();
            }
        });
    }
});

/**
 * Start Realtime Firestore Listener
 */
function startRealtimeListener() {
    if (unsubscribeFirestore) {
        unsubscribeFirestore();
    }

    unsubscribeFirestore = subscribeToPlayers((players) => {
        allPlayers = players || [];
        updateDashboardStats(allPlayers);
        renderPositionDistribution(allPlayers);
        renderRecentRegistrations(allPlayers);
        renderPlayersTable();

        // If the detail modal is currently open, refresh its data live!
        if (selectedPlayer) {
            const updated = allPlayers.find(p => p.registrationId === selectedPlayer.registrationId);
            if (updated) {
                openPlayerModal(updated);
            }
        }
    }, (error) => {
        console.error("Firestore sync error:", error);
        showToast("Error connecting to Firestore. Please check your network and rules.", "error");
    });
}

/**
 * Update Dashboard Statistics Cards
 * @param {Array<Object>} players 
 */
function updateDashboardStats(players) {
    const total = players.length;
    let pending = 0;
    let approved = 0;
    let rejected = 0;
    let withdrawn = 0;

    players.forEach(p => {
        const s = (p.status || 'pending').toLowerCase();
        if (s === 'pending') pending++;
        else if (s === 'approved') approved++;
        else if (s === 'rejected') rejected++;
        else if (s === 'withdrawn') withdrawn++;
    });

    const elTotal = document.getElementById('stat-total');
    const elPending = document.getElementById('stat-pending');
    const elApproved = document.getElementById('stat-approved');
    const elRejected = document.getElementById('stat-rejected');
    const elWithdrawn = document.getElementById('stat-withdrawn');

    if (elTotal) elTotal.textContent = total;
    if (elPending) elPending.textContent = pending;
    if (elApproved) elApproved.textContent = approved;
    if (elRejected) elRejected.textContent = rejected;
    if (elWithdrawn) elWithdrawn.textContent = withdrawn;
}

/**
 * Render Position Distribution Breakdown
 * @param {Array<Object>} players 
 */
function renderPositionDistribution(players) {
    const container = document.getElementById('position-bars-container');
    if (!container) return;

    const positions = ['Goalkeeper', 'Defender', 'Midfielder', 'Forward', 'Utility Player'];
    const counts = {
        'Goalkeeper': 0,
        'Defender': 0,
        'Midfielder': 0,
        'Forward': 0,
        'Utility Player': 0
    };

    players.forEach(p => {
        if (counts[p.preferredPosition] !== undefined) {
            counts[p.preferredPosition]++;
        }
    });

    const total = players.length || 1; // avoid divide by zero

    container.innerHTML = positions.map(pos => {
        const count = counts[pos];
        const pct = Math.round((count / total) * 100);
        return `
            <div class="position-bar-item">
                <div class="position-bar-header">
                    <span style="color: var(--text-primary); font-weight: 700;">${pos}</span>
                    <span style="color: var(--text-secondary); font-size: 0.8125rem;">${count} players (${pct}%)</span>
                </div>
                <div class="position-bar-track">
                    <div class="position-bar-fill" style="width: ${pct}%;"></div>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Render Recent Registrations Table (Dashboard Tab)
 * @param {Array<Object>} players 
 */
function renderRecentRegistrations(players) {
    const wrap = document.getElementById('recent-registrations-table-wrap');
    if (!wrap) return;

    if (!players.length) {
        wrap.innerHTML = `
            <div style="padding: 32px; text-align: center; color: var(--text-muted); font-size: 0.875rem;">
                No player registrations received yet.
            </div>
        `;
        return;
    }

    const recent = players.slice(0, 6);

    wrap.innerHTML = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>REG ID</th>
                    <th>PLAYER</th>
                    <th>POSITION</th>
                    <th>STATUS</th>
                    <th>REGISTERED ON</th>
                    <th style="text-align: right;">ACTION</th>
                </tr>
            </thead>
            <tbody>
                ${recent.map(p => `
                    <tr data-id="${p.registrationId}">
                        <td class="player-id-cell">${escapeHtml(p.registrationId)}</td>
                        <td class="player-name-cell">${escapeHtml(p.name)}</td>
                        <td>${escapeHtml(p.preferredPosition)}</td>
                        <td>${renderStatusBadge(p.status)}</td>
                        <td>${formatDate(p.createdAt)}</td>
                        <td style="text-align: right;">
                            <button type="button" class="btn btn-secondary action-view-btn" data-id="${p.registrationId}" style="padding: 4px 10px; font-size: 0.75rem;">
                                <i data-lucide="eye"></i>
                                <span>View</span>
                            </button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    refreshIcons();

    // Attach click listeners to rows & view buttons
    wrap.querySelectorAll('tr[data-id]').forEach(row => {
        row.addEventListener('click', (e) => {
            const id = row.getAttribute('data-id');
            const player = allPlayers.find(p => p.registrationId === id);
            if (player) openPlayerModal(player);
        });
    });
}

/**
 * Filter players and render Desktop Table & Mobile Cards
 */
function renderPlayersTable() {
    const searchVal = (document.getElementById('player-search-input')?.value || '').trim().toLowerCase();
    const statusVal = document.getElementById('filter-status')?.value || 'all';
    const positionVal = document.getElementById('filter-position')?.value || 'all';

    const tableBody = document.getElementById('players-table-body');
    const cardsContainer = document.getElementById('players-cards-container');
    const emptyState = document.getElementById('players-empty-state');
    const tableEl = document.getElementById('players-table');

    if (!tableBody || !cardsContainer) return;

    const filtered = allPlayers.filter(p => {
        // Status filter
        if (statusVal !== 'all' && (p.status || 'pending').toLowerCase() !== statusVal.toLowerCase()) {
            return false;
        }

        // Position filter
        if (positionVal !== 'all' && p.preferredPosition !== positionVal) {
            return false;
        }

        // Text search
        if (searchVal) {
            const idMatch = (p.registrationId || '').toLowerCase().includes(searchVal);
            const nameMatch = (p.name || '').toLowerCase().includes(searchVal);
            const emailMatch = (p.email || '').toLowerCase().includes(searchVal);
            const phoneMatch = (p.phone || '').includes(searchVal);
            if (!idMatch && !nameMatch && !emailMatch && !phoneMatch) {
                return false;
            }
        }

        return true;
    });

    if (filtered.length === 0) {
        tableEl.style.display = 'none';
        cardsContainer.style.display = 'none';
        emptyState.style.display = 'flex';
        refreshIcons();
        return;
    }

    emptyState.style.display = 'none';
    tableEl.style.display = 'table';
    cardsContainer.style.display = '';

    // Render Desktop Table Rows
    tableBody.innerHTML = filtered.map(p => `
        <tr data-id="${p.registrationId}">
            <td class="player-id-cell">${escapeHtml(p.registrationId)}</td>
            <td class="player-name-cell">${escapeHtml(p.name)}</td>
            <td>${escapeHtml(p.email)}</td>
            <td>${escapeHtml(p.phone)}</td>
            <td>${escapeHtml(p.preferredPosition)}</td>
            <td>${renderStatusBadge(p.status)}</td>
            <td>${formatDate(p.createdAt)}</td>
            <td style="text-align: right;">
                <button type="button" class="btn btn-secondary action-view-btn" data-id="${p.registrationId}" style="padding: 4px 10px; font-size: 0.75rem;">
                    <i data-lucide="eye"></i>
                    <span>Details</span>
                </button>
            </td>
        </tr>
    `).join('');

    // Render Mobile Cards
    cardsContainer.innerHTML = filtered.map(p => `
        <div class="player-card-mobile" data-id="${p.registrationId}">
            <div class="mobile-card-header">
                <div>
                    <span class="player-id-cell">${escapeHtml(p.registrationId)}</span>
                    <h4 style="font-weight: 800; font-size: 1.05rem; margin-top: 2px;">${escapeHtml(p.name)}</h4>
                </div>
                ${renderStatusBadge(p.status)}
            </div>

            <div class="mobile-card-meta">
                <div>
                    <span style="color: var(--text-muted); font-size: 0.7rem; text-transform: uppercase;">Position</span>
                    <div style="font-weight: 600;">${escapeHtml(p.preferredPosition)}</div>
                </div>
                <div>
                    <span style="color: var(--text-muted); font-size: 0.7rem; text-transform: uppercase;">Phone</span>
                    <div style="font-weight: 600;">${escapeHtml(p.phone)}</div>
                </div>
            </div>

            <div class="mobile-card-actions">
                <button type="button" class="btn btn-secondary" data-id="${p.registrationId}" style="width: 100%; padding: 8px; font-size: 0.8125rem;">
                    <i data-lucide="eye"></i>
                    <span>View & Manage</span>
                </button>
            </div>
        </div>
    `).join('');

    refreshIcons();

    // Attach row clicks
    document.querySelectorAll('[data-id]').forEach(el => {
        el.addEventListener('click', (e) => {
            const id = el.getAttribute('data-id');
            const player = allPlayers.find(p => p.registrationId === id);
            if (player) openPlayerModal(player);
        });
    });
}

/**
 * Open Player Detail Modal
 * @param {Object} player 
 */
function openPlayerModal(player) {
    selectedPlayer = player;
    const modal = document.getElementById('player-detail-modal');

    document.getElementById('modal-player-name').textContent = player.name || 'Player';
    document.getElementById('modal-player-id').textContent = player.registrationId || '';
    
    const badgeWrap = document.getElementById('modal-player-status-badge');
    badgeWrap.className = `badge badge-${(player.status || 'pending').toLowerCase()}`;
    badgeWrap.innerHTML = `
        <i data-lucide="${getStatusIcon(player.status)}"></i>
        <span>${getStatusLabel(player.status)}</span>
    `;

    document.getElementById('modal-email').textContent = player.email || '-';
    document.getElementById('modal-phone').innerHTML = player.phone ? `<a href="tel:${escapeHtml(player.phone)}" style="color: var(--accent-primary);">${escapeHtml(player.phone)}</a>` : '-';
    document.getElementById('modal-whatsapp').innerHTML = player.whatsapp ? `<a href="https://wa.me/${escapeHtml(player.whatsapp.replace(/\+/g, ''))}" target="_blank" rel="noopener" style="color: var(--accent-primary); display: inline-flex; align-items: center; gap: 4px;">${escapeHtml(player.whatsapp)} <i data-lucide="external-link" style="width: 14px; height: 14px;"></i></a>` : '-';
    document.getElementById('modal-position').textContent = player.preferredPosition || '-';
    document.getElementById('modal-date').textContent = formatDate(player.createdAt);
    document.getElementById('modal-terms').textContent = player.termsAccepted ? "Accepted" : "Not accepted";

    const notesTextarea = document.getElementById('modal-admin-notes');
    notesTextarea.value = player.adminNotes || '';

    // Render Contextual Action Buttons
    const actionsContainer = document.getElementById('modal-action-buttons');
    const currentStatus = (player.status || 'pending').toLowerCase();
    let buttonsHtml = '';

    if (currentStatus === 'pending') {
        buttonsHtml = `
            <button type="button" class="btn btn-primary" id="btn-action-approve" style="padding: 6px 14px; font-size: 0.8125rem;">
                <i data-lucide="check"></i>
                <span>Approve</span>
            </button>
            <button type="button" class="btn btn-danger" id="btn-action-reject" style="padding: 6px 14px; font-size: 0.8125rem;">
                <i data-lucide="x"></i>
                <span>Reject</span>
            </button>
        `;
    } else if (currentStatus === 'approved') {
        buttonsHtml = `
            <button type="button" class="btn btn-secondary" id="btn-action-withdraw" style="padding: 6px 14px; font-size: 0.8125rem; color: var(--warning);">
                <i data-lucide="user-minus"></i>
                <span>Mark as Withdrawn</span>
            </button>
        `;
    } else if (currentStatus === 'rejected') {
        buttonsHtml = `
            <button type="button" class="btn btn-secondary" id="btn-action-pending" style="padding: 6px 14px; font-size: 0.8125rem;">
                <i data-lucide="rotate-ccw"></i>
                <span>Move to Pending</span>
            </button>
        `;
    } else if (currentStatus === 'withdrawn') {
        buttonsHtml = `
            <span style="font-size: 0.8125rem; color: var(--text-muted);">Player record is marked as withdrawn.</span>
        `;
    }

    actionsContainer.innerHTML = buttonsHtml;
    refreshIcons();

    // Attach Status Action Handlers with Confirmation Modals
    const btnApprove = document.getElementById('btn-action-approve');
    const btnReject = document.getElementById('btn-action-reject');
    const btnWithdraw = document.getElementById('btn-action-withdraw');
    const btnPending = document.getElementById('btn-action-pending');

    if (btnApprove) {
        btnApprove.addEventListener('click', async () => {
            const confirmed = await showConfirmModal({
                title: "Approve Player Registration",
                message: `Are you sure you want to approve registration for ${player.name} (${player.registrationId})?`,
                confirmText: "Approve Registration",
                type: "primary"
            });
            if (confirmed) {
                await executeStatusChange(player.registrationId, 'approved');
            }
        });
    }

    if (btnReject) {
        btnReject.addEventListener('click', async () => {
            const confirmed = await showConfirmModal({
                title: "Reject Player Registration",
                message: `Are you sure you want to reject registration for ${player.name} (${player.registrationId})?`,
                confirmText: "Reject Registration",
                type: "danger"
            });
            if (confirmed) {
                await executeStatusChange(player.registrationId, 'rejected');
            }
        });
    }

    if (btnWithdraw) {
        btnWithdraw.addEventListener('click', async () => {
            const confirmed = await showConfirmModal({
                title: "Mark as Withdrawn",
                message: `Are you sure you want to mark ${player.name} as withdrawn? 50% participation fee refund policy applies.`,
                confirmText: "Mark Withdrawn",
                type: "warning"
            });
            if (confirmed) {
                await executeStatusChange(player.registrationId, 'withdrawn');
            }
        });
    }

    if (btnPending) {
        btnPending.addEventListener('click', async () => {
            const confirmed = await showConfirmModal({
                title: "Restore to Pending",
                message: `Restore ${player.name} (${player.registrationId}) back to pending review status?`,
                confirmText: "Restore to Pending",
                type: "primary"
            });
            if (confirmed) {
                await executeStatusChange(player.registrationId, 'pending');
            }
        });
    }

    modal.classList.add('modal-visible');
    modal.setAttribute('aria-hidden', 'false');
}

/**
 * Execute Status Change in Firestore
 * @param {string} registrationId 
 * @param {string} newStatus 
 */
async function executeStatusChange(registrationId, newStatus) {
    try {
        await updatePlayerStatus(registrationId, newStatus);
        showToast(`Registration status updated to ${newStatus}.`, "success");
    } catch (err) {
        console.error("Status update error:", err);
        showToast("Failed to update status. Please try again.", "error");
    }
}

/**
 * Export Current Filtered Players to CSV
 */
function exportCurrentPlayers() {
    exportPlayersToCSV(allPlayers, `NNSL_Players_${new Date().toISOString().slice(0, 10)}.csv`);
}

/**
 * Helper to render status badge HTML
 * @param {string} status 
 * @returns {string}
 */
function renderStatusBadge(status) {
    const s = (status || 'pending').toLowerCase();
    const icon = getStatusIcon(s);
    const label = getStatusLabel(s);
    return `<span class="badge badge-${s}"><i data-lucide="${icon}"></i> <span>${label}</span></span>`;
}

function getStatusIcon(status) {
    const s = (status || 'pending').toLowerCase();
    if (s === 'approved') return 'check-circle-2';
    if (s === 'rejected') return 'x-circle';
    if (s === 'withdrawn') return 'user-minus';
    return 'clock';
}

function getStatusLabel(status) {
    const s = (status || 'pending').toLowerCase();
    if (s === 'approved') return 'Approved';
    if (s === 'rejected') return 'Rejected';
    if (s === 'withdrawn') return 'Withdrawn';
    return 'Pending';
}
