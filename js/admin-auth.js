/**
 * Netaji Nagar Super League - Admin Authentication Logic
 * Handles Google OAuth admin sign-in, session detection, and sign-out.
 * Zero Emojis.
 */

import { isFirebaseConfigured } from './firebase-config.js';
import { 
    adminSignInWithGoogle, 
    verifyOrRegisterFirstAdmin, 
    adminSignOut, 
    onAdminAuth 
} from './firebase-service.js';
import { refreshIcons, showToast } from './utils.js';

document.addEventListener('DOMContentLoaded', () => {
    const authScreen = document.getElementById('admin-auth-screen');
    const dashboardApp = document.getElementById('admin-dashboard-app');
    const googleLoginBtn = document.getElementById('google-login-btn');
    const logoutBtn = document.getElementById('admin-logout-btn');
    const sidebarUserEmail = document.getElementById('sidebar-user-email');
    const authSetupAlert = document.getElementById('auth-setup-alert');

    // Display configuration alert if Firebase is not configured
    if (!isFirebaseConfigured() && authSetupAlert) {
        authSetupAlert.style.display = 'flex';
        refreshIcons();
    }

    let isAuthenticating = false;

    // Listen to Auth State with First-Admin Verification
    onAdminAuth(async (user) => {
        if (user) {
            try {
                // Verify or automatically assign first login as Primary Admin
                const authCheck = await verifyOrRegisterFirstAdmin(user);

                if (!authCheck.isAuthorized) {
                    showToast("Access Denied: This account is not an authorized administrator.", "error", 6000);
                    await adminSignOut();
                    dashboardApp.style.display = 'none';
                    authScreen.style.display = 'flex';
                    refreshIcons();
                    return;
                }

                // Authorized Admin
                authScreen.style.display = 'none';
                dashboardApp.style.display = 'flex';

                if (sidebarUserEmail) {
                    const identifier = user.displayName ? `${user.displayName} (${user.email})` : user.email;
                    sidebarUserEmail.textContent = identifier || 'Administrator';
                    sidebarUserEmail.title = user.email || '';
                }

                if (authCheck.isFirstAdmin) {
                    showToast("Welcome! Your account is active as the Primary Administrator.", "success", 5000);
                }

                refreshIcons();
                // Dispatch event for admin-dashboard.js to initialize realtime data
                window.dispatchEvent(new CustomEvent('nnsl-admin-ready', { detail: { user } }));
            } catch (err) {
                console.error("Auth verification error:", err);
                // Allow fallback if user is valid
                authScreen.style.display = 'none';
                dashboardApp.style.display = 'flex';
                refreshIcons();
                window.dispatchEvent(new CustomEvent('nnsl-admin-ready', { detail: { user } }));
            }
        } else {
            dashboardApp.style.display = 'none';
            authScreen.style.display = 'flex';
            refreshIcons();
        }
    });

    // Google Sign-In Handler (Exclusive authentication method)
    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', async () => {
            if (isAuthenticating) return;

            if (!isFirebaseConfigured()) {
                showToast("Firebase is not configured. Please verify js/firebase-config.js.", "error");
                return;
            }

            isAuthenticating = true;
            googleLoginBtn.disabled = true;
            const originalHtml = googleLoginBtn.innerHTML;
            googleLoginBtn.innerHTML = `
                <i data-lucide="loader-2" class="btn-spinner"></i>
                <span>Signing in with Google...</span>
            `;
            refreshIcons();

            try {
                const userCredential = await adminSignInWithGoogle();
                const user = userCredential.user;

                // Check or register as first admin
                const authCheck = await verifyOrRegisterFirstAdmin(user);
                if (authCheck.isFirstAdmin) {
                    showToast("First login detected! Your account has been registered as Primary Administrator.", "success", 6000);
                } else if (authCheck.isAuthorized) {
                    showToast("Signed in as Administrator successfully.", "success");
                } else {
                    showToast("Access Denied: Only authorized administrators can access this portal.", "error", 6000);
                    await adminSignOut();
                }
            } catch (err) {
                console.error("Google sign in failed:", err);
                if (err.code !== 'auth/popup-closed-by-user') {
                    showToast("Google sign in failed. Please try again or check Firebase settings.", "error");
                }
            } finally {
                isAuthenticating = false;
                googleLoginBtn.disabled = false;
                googleLoginBtn.innerHTML = originalHtml;
                refreshIcons();
            }
        });
    }

    // Sign Out Handler
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                await adminSignOut();
                showToast("Signed out successfully.", "info");
            } catch (err) {
                console.error("Sign out error:", err);
                showToast("Sign out failed. Please try again.", "error");
            }
        });
    }
});
