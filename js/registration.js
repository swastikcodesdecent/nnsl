/**
 * Netaji Nagar Super League - Registration & Public Page Logic
 * Handles interactive navbar, FAQ accordions, position selector,
 * real-time validation, WhatsApp syncing, duplicate checking, and Firestore submission.
 * Zero Emojis.
 */

import { tournamentConfig } from './config.js';
import { isFirebaseConfigured } from './firebase-config.js';
import { 
    checkDuplicateRegistration, 
    registerPlayer 
} from './firebase-service.js';
import { 
    refreshIcons, 
    generateRegistrationId, 
    validateName, 
    validateEmail, 
    validatePhone, 
    validateWhatsApp, 
    showToast, 
    escapeHtml 
} from './utils.js';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Icons
    refreshIcons();

    // 2. Check Firebase Configuration Banner
    const setupAlert = document.getElementById('firebase-setup-alert');
    if (setupAlert && !isFirebaseConfigured()) {
        setupAlert.style.display = 'flex';
        refreshIcons();
    }

    // 3. Navbar scroll effect
    const header = document.getElementById('site-header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 40) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    }, { passive: true });

    // 4. Mobile Drawer Navigation
    const mobileToggle = document.getElementById('mobile-toggle');
    const mobileDrawer = document.getElementById('mobile-drawer');
    const drawerBackdrop = document.getElementById('drawer-backdrop');
    const drawerClose = document.getElementById('drawer-close');
    const drawerLinks = document.querySelectorAll('.drawer-nav-link');

    function openDrawer() {
        mobileDrawer.classList.add('open');
        drawerBackdrop.classList.add('active');
        mobileDrawer.setAttribute('aria-hidden', 'false');
        mobileToggle.setAttribute('aria-expanded', 'true');
        document.body.style.overflow = 'hidden';
    }

    function closeDrawer() {
        mobileDrawer.classList.remove('open');
        drawerBackdrop.classList.remove('active');
        mobileDrawer.setAttribute('aria-hidden', 'true');
        mobileToggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
    }

    if (mobileToggle) mobileToggle.addEventListener('click', openDrawer);
    if (drawerClose) drawerClose.addEventListener('click', closeDrawer);
    if (drawerBackdrop) drawerBackdrop.addEventListener('click', closeDrawer);
    drawerLinks.forEach(link => link.addEventListener('click', closeDrawer));

    // 5. FAQ Accordion
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const btn = item.querySelector('.faq-question-btn');
        const answer = item.querySelector('.faq-answer');

        btn.addEventListener('click', () => {
            const isActive = item.classList.contains('active');
            
            // Close other items
            faqItems.forEach(otherItem => {
                if (otherItem !== item && otherItem.classList.contains('active')) {
                    otherItem.classList.remove('active');
                    otherItem.querySelector('.faq-question-btn').setAttribute('aria-expanded', 'false');
                    otherItem.querySelector('.faq-answer').style.maxHeight = null;
                }
            });

            if (isActive) {
                item.classList.remove('active');
                btn.setAttribute('aria-expanded', 'false');
                answer.style.maxHeight = null;
            } else {
                item.classList.add('active');
                btn.setAttribute('aria-expanded', 'true');
                answer.style.maxHeight = answer.scrollHeight + 'px';
            }
        });
    });

    // 6. WhatsApp Phone Number Syncing
    const phoneInput = document.getElementById('player-phone');
    const whatsappInput = document.getElementById('player-whatsapp');
    const syncCheckbox = document.getElementById('sync-whatsapp-checkbox');

    function handlePhoneSync() {
        if (syncCheckbox.checked) {
            whatsappInput.value = phoneInput.value;
            validateField('whatsapp');
        }
    }

    syncCheckbox.addEventListener('change', () => {
        if (syncCheckbox.checked) {
            whatsappInput.value = phoneInput.value;
            validateField('whatsapp');
        }
    });

    phoneInput.addEventListener('input', () => {
        if (syncCheckbox.checked) {
            whatsappInput.value = phoneInput.value;
        }
    });

    whatsappInput.addEventListener('input', () => {
        if (syncCheckbox.checked && whatsappInput.value !== phoneInput.value) {
            syncCheckbox.checked = false;
        }
    });

    // 7. Preferred Position Selector (Radio cards)
    const positionCards = document.querySelectorAll('.position-card');
    const selectedPositionInput = document.getElementById('selected-position');
    const groupPosition = document.getElementById('group-position');

    function selectPosition(card) {
        positionCards.forEach(c => {
            c.classList.remove('selected');
            c.setAttribute('aria-checked', 'false');
        });

        card.classList.add('selected');
        card.setAttribute('aria-checked', 'true');
        const posValue = card.getAttribute('data-position');
        selectedPositionInput.value = posValue;
        groupPosition.classList.remove('has-error');
    }

    positionCards.forEach(card => {
        card.addEventListener('click', () => selectPosition(card));
        card.addEventListener('keydown', (e) => {
            if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                selectPosition(card);
            }
        });
    });

    // 8. Field Validation Helpers
    const nameInput = document.getElementById('player-name');
    const emailInput = document.getElementById('player-email');
    const termsCheckbox = document.getElementById('terms-checkbox');

    function setFieldError(fieldId, errorMsg) {
        const group = document.getElementById(`group-${fieldId}`);
        const errorEl = document.getElementById(`error-${fieldId}`);
        if (group && errorEl) {
            group.classList.add('has-error');
            const textSpan = errorEl.querySelector('.error-text');
            if (textSpan) textSpan.textContent = errorMsg;
        }
    }

    function clearFieldError(fieldId) {
        const group = document.getElementById(`group-${fieldId}`);
        if (group) {
            group.classList.remove('has-error');
        }
    }

    function validateField(fieldName) {
        switch (fieldName) {
            case 'name': {
                const res = validateName(nameInput.value);
                if (!res.valid) {
                    setFieldError('name', res.error);
                    return false;
                }
                clearFieldError('name');
                return true;
            }
            case 'email': {
                const res = validateEmail(emailInput.value);
                if (!res.valid) {
                    setFieldError('email', res.error);
                    return false;
                }
                clearFieldError('email');
                return true;
            }
            case 'phone': {
                const res = validatePhone(phoneInput.value);
                if (!res.valid) {
                    setFieldError('phone', res.error);
                    return false;
                }
                clearFieldError('phone');
                return true;
            }
            case 'whatsapp': {
                const res = validateWhatsApp(whatsappInput.value);
                if (!res.valid) {
                    setFieldError('whatsapp', res.error);
                    return false;
                }
                clearFieldError('whatsapp');
                return true;
            }
            case 'position': {
                if (!selectedPositionInput.value) {
                    setFieldError('position', "Please select your preferred playing position.");
                    return false;
                }
                clearFieldError('position');
                return true;
            }
            case 'terms': {
                if (!termsCheckbox.checked) {
                    setFieldError('terms', "You must agree to the tournament terms and refund policy to register.");
                    return false;
                }
                clearFieldError('terms');
                return true;
            }
            default:
                return true;
        }
    }

    // Attach real-time clear handlers
    nameInput.addEventListener('input', () => clearFieldError('name'));
    nameInput.addEventListener('blur', () => validateField('name'));

    emailInput.addEventListener('input', () => clearFieldError('email'));
    emailInput.addEventListener('blur', () => validateField('email'));

    phoneInput.addEventListener('input', () => clearFieldError('phone'));
    phoneInput.addEventListener('blur', () => validateField('phone'));

    whatsappInput.addEventListener('input', () => clearFieldError('whatsapp'));
    whatsappInput.addEventListener('blur', () => validateField('whatsapp'));

    termsCheckbox.addEventListener('change', () => {
        if (termsCheckbox.checked) clearFieldError('terms');
    });

    // 9. Multi-Step Form Management (Step 1: Details -> Step 2: Overview & Confirm)
    const step1Panel = document.getElementById('step-1-panel');
    const step2Panel = document.getElementById('step-2-panel');
    const stepNav1 = document.getElementById('step-nav-1');
    const stepNav2 = document.getElementById('step-nav-2');
    const stepDivider = document.getElementById('step-divider');

    const toStep2Btn = document.getElementById('to-step-2-btn');
    const backToStep1Btn = document.getElementById('back-to-step-1-btn');
    const editDetailsShortcutBtn = document.getElementById('edit-details-shortcut-btn');
    const confirmRegistrationBtn = document.getElementById('confirm-registration-btn');

    const formCard = document.getElementById('registration-form-card');
    const successCard = document.getElementById('registration-success-screen');
    const displayRegId = document.getElementById('display-registration-id');
    const copyIdBtn = document.getElementById('copy-id-btn');
    const copyBtnText = document.getElementById('copy-btn-text');
    const registerAnotherBtn = document.getElementById('register-another-btn');

    // Review Summary Elements
    const reviewName = document.getElementById('review-display-name');
    const reviewEmail = document.getElementById('review-display-email');
    const reviewPhone = document.getElementById('review-display-phone');
    const reviewWhatsApp = document.getElementById('review-display-whatsapp');
    const reviewPosition = document.getElementById('review-display-position');

    function goToStep2() {
        // Validate Step 1 fields
        const isNameValid = validateField('name');
        const isEmailValid = validateField('email');
        const isPhoneValid = validateField('phone');
        const isWhatsAppValid = validateField('whatsapp');
        const isPosValid = validateField('position');

        if (!isNameValid || !isEmailValid || !isPhoneValid || !isWhatsAppValid || !isPosValid) {
            showToast("Please complete all required fields correctly before proceeding.", "warning");
            
            // Focus first invalid input
            if (!isNameValid) nameInput.focus();
            else if (!isEmailValid) emailInput.focus();
            else if (!isPhoneValid) phoneInput.focus();
            else if (!isWhatsAppValid) whatsappInput.focus();
            else if (!isPosValid) groupPosition.scrollIntoView({ behavior: 'smooth', block: 'center' });

            return;
        }

        const phoneValidation = validatePhone(phoneInput.value);
        const whatsappValidation = validateWhatsApp(whatsappInput.value);

        if (!phoneValidation.valid || !whatsappValidation.valid) {
            showToast("Please enter valid phone and WhatsApp numbers.", "warning");
            return;
        }

        // Populate Review Summary Card
        reviewName.textContent = nameInput.value.trim();
        reviewEmail.textContent = emailInput.value.trim().toLowerCase();
        reviewPhone.textContent = phoneValidation.normalized;
        reviewWhatsApp.textContent = whatsappValidation.normalized;
        reviewPosition.textContent = selectedPositionInput.value;

        // Switch panels
        step1Panel.classList.remove('active');
        step2Panel.classList.add('active');

        // Update Stepper
        stepNav1.classList.remove('active');
        stepNav1.classList.add('completed');
        stepDivider.classList.add('active');
        stepNav2.classList.add('active');

        refreshIcons();
        step2Panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function goToStep1() {
        step2Panel.classList.remove('active');
        step1Panel.classList.add('active');

        stepNav2.classList.remove('active');
        stepDivider.classList.remove('active');
        stepNav1.classList.remove('completed');
        stepNav1.classList.add('active');

        refreshIcons();
        step1Panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    if (toStep2Btn) toStep2Btn.addEventListener('click', goToStep2);
    if (backToStep1Btn) backToStep1Btn.addEventListener('click', goToStep1);
    if (editDetailsShortcutBtn) editDetailsShortcutBtn.addEventListener('click', goToStep1);

    // Prevent accidental submit via enter on Step 1 inputs
    const form = document.getElementById('player-registration-form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            goToStep2();
        });
    }

    // 10. Step 2 Final Confirmation & Submission
    let isSubmitting = false;

    if (confirmRegistrationBtn) {
        confirmRegistrationBtn.addEventListener('click', async () => {
            if (isSubmitting) return;

            // Validate terms checkbox
            const isTermsValid = validateField('terms');
            if (!isTermsValid) {
                showToast("You must confirm the information and agree to the tournament & refund policy.", "warning");
                termsCheckbox.focus();
                return;
            }

            const phoneValidation = validatePhone(phoneInput.value);
            const whatsappValidation = validateWhatsApp(whatsappInput.value);

            if (!phoneValidation.valid || !whatsappValidation.valid) {
                showToast("Please verify your phone numbers.", "warning");
                goToStep1();
                return;
            }

            // Set Loading State
            isSubmitting = true;
            confirmRegistrationBtn.disabled = true;
            confirmRegistrationBtn.innerHTML = `
                <i data-lucide="loader-2" class="btn-spinner"></i>
                <span>Registering Player...</span>
            `;
            refreshIcons();

            try {
                // Check Firebase Configuration
                if (!isFirebaseConfigured()) {
                    showToast("Firebase credentials have not been configured in js/firebase-config.js.", "error");
                    throw new Error("Firebase configuration incomplete. Please update js/firebase-config.js.");
                }

                // Check Duplicate Registration in Firestore
                const duplicateCheck = await checkDuplicateRegistration(emailInput.value, phoneValidation.normalized);
                if (duplicateCheck.exists) {
                    showToast(`A registration with these details already exists. Please contact the tournament organisers at ${TOURNAMENT_CONFIG.contact.officialEmail} or Instagram @${TOURNAMENT_CONFIG.contact.instagramHandle} / @${TOURNAMENT_CONFIG.contact.instagramHandle2}.`, "error", 7000);
                    resetConfirmButton();
                    return;
                }

                // Generate unique Registration ID
                const newRegId = generateRegistrationId();

                // Submit to Firestore
                await registerPlayer({
                    registrationId: newRegId,
                    name: nameInput.value,
                    email: emailInput.value,
                    phone: phoneValidation.normalized,
                    whatsapp: whatsappValidation.normalized,
                    preferredPosition: selectedPositionInput.value,
                    termsAccepted: true
                });

                // Transition to Success State Screen
                displayRegId.textContent = newRegId;
                formCard.style.display = 'none';
                successCard.classList.add('active');
                refreshIcons();

                showToast("Player registration submitted successfully!", "success");
                successCard.scrollIntoView({ behavior: 'smooth', block: 'center' });

                // Start Auto-Reload for next registration
                startAutoReloadCountdown(7);

            } catch (error) {
                console.error("Registration error:", error);
                let message = "Registration could not be completed. Please try again.";
                if (error?.code === 'permission-denied') {
                    message = "Firestore permission denied. Please paste and publish rules in Firebase Console > Firestore Database > Rules.";
                } else if (error?.code === 'unavailable' || error?.message?.includes('offline')) {
                    message = "Network error. Please check your internet connection.";
                } else if (error?.message && !error.message.includes("Firebase configuration")) {
                    message = error.message;
                }
                showToast(message, "error", 7000);
                resetConfirmButton();
            }
        });
    }

    function resetConfirmButton() {
        isSubmitting = false;
        if (confirmRegistrationBtn) {
            confirmRegistrationBtn.disabled = false;
            confirmRegistrationBtn.innerHTML = `
                <span class="btn-text">Confirm & Register</span>
                <i data-lucide="check"></i>
            `;
            refreshIcons();
        }
    }

    // 11. Copy Registration ID Button
    if (copyIdBtn) {
        copyIdBtn.addEventListener('click', async () => {
            const idText = displayRegId.textContent.trim();
            if (idText) {
                try {
                    await navigator.clipboard.writeText(idText);
                    copyBtnText.textContent = "Copied!";
                    copyIdBtn.style.color = "var(--accent-primary)";
                    setTimeout(() => {
                        copyBtnText.textContent = "Copy ID";
                        copyIdBtn.style.color = "";
                    }, 2500);
                } catch (err) {
                    showToast(`Registration ID: ${idText}`, "info");
                }
            }
        });
    }

    // 12. Auto-Reload Countdown & Form Reset for Consecutive Registrations
    let autoReloadTimer = null;
    let countdownInterval = null;

    function startAutoReloadCountdown(seconds = 7) {
        if (autoReloadTimer) clearTimeout(autoReloadTimer);
        if (countdownInterval) clearInterval(countdownInterval);

        let remaining = seconds;
        const countdownEl = document.getElementById('reload-seconds-count');
        const countdownBox = document.getElementById('reload-countdown-box');
        if (countdownBox) countdownBox.style.display = 'flex';
        if (countdownEl) countdownEl.textContent = remaining;

        countdownInterval = setInterval(() => {
            remaining -= 1;
            if (countdownEl) countdownEl.textContent = remaining;
            if (remaining <= 0) {
                clearInterval(countdownInterval);
            }
        }, 1000);

        autoReloadTimer = setTimeout(() => {
            reloadFormForNewRegistration();
        }, seconds * 1000);
    }

    function reloadFormForNewRegistration() {
        if (autoReloadTimer) clearTimeout(autoReloadTimer);
        if (countdownInterval) clearInterval(countdownInterval);

        // Reset form inputs
        if (form) form.reset();
        nameInput.value = '';
        emailInput.value = '';
        phoneInput.value = '';
        whatsappInput.value = '';
        syncCheckbox.checked = false;
        termsCheckbox.checked = false;
        selectedPositionInput.value = '';

        // Deselect position cards
        positionCards.forEach(c => {
            c.classList.remove('selected');
            c.setAttribute('aria-checked', 'false');
        });

        // Clear all validation errors
        clearFieldError('name');
        clearFieldError('email');
        clearFieldError('phone');
        clearFieldError('whatsapp');
        clearFieldError('position');
        clearFieldError('terms');

        // Reset review summary text
        if (reviewName) reviewName.textContent = '—';
        if (reviewEmail) reviewEmail.textContent = '—';
        if (reviewPhone) reviewPhone.textContent = '—';
        if (reviewWhatsApp) reviewWhatsApp.textContent = '—';
        if (reviewPosition) reviewPosition.textContent = '—';

        // Reset submit button state
        resetConfirmButton();

        // Switch panels back to Step 1
        goToStep1();

        // Reveal form and hide success card
        successCard.classList.remove('active');
        formCard.style.display = 'block';

        refreshIcons();
        formCard.scrollIntoView({ behavior: 'smooth', block: 'start' });

        // Auto focus first input for immediate entry
        setTimeout(() => {
            nameInput.focus();
        }, 300);

        showToast("Form reloaded. Ready for next player registration.", "info", 4000);
    }

    // 13. Register Another Player Button (Instant Reload)
    if (registerAnotherBtn) {
        registerAnotherBtn.addEventListener('click', () => {
            reloadFormForNewRegistration();
        });
    }

    // 14. Scroll-Triggered Reveal Animations Observer
    const revealElements = document.querySelectorAll('.reveal-on-scroll');
    if ('IntersectionObserver' in window && revealElements.length > 0) {
        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                    revealObserver.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.12,
            rootMargin: '0px 0px -40px 0px'
        });

        revealElements.forEach(el => revealObserver.observe(el));
    } else {
        // Fallback for browsers without IntersectionObserver
        revealElements.forEach(el => el.classList.add('revealed'));
    }
});
