/**
 * Accessibility Utilities (WCAG 2.1 AA Compliance)
 * Ensures Obfusi-Bob is accessible to all users
 */

/**
 * Keyboard navigation manager
 */
export class KeyboardNavigationManager {
    constructor() {
        this.focusableElements = [
            'a[href]',
            'button:not([disabled])',
            'input:not([disabled])',
            'select:not([disabled])',
            'textarea:not([disabled])',
            '[tabindex]:not([tabindex="-1"])'
        ].join(', ');
        
        this.init();
    }

    init() {
        // Trap focus in modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeActiveModal();
            }
        });

        // Skip to main content
        this.setupSkipLink();
    }

    setupSkipLink() {
        const skipLink = document.createElement('a');
        skipLink.href = '#main-content';
        skipLink.className = 'skip-link';
        skipLink.textContent = 'Skip to main content';
        skipLink.style.cssText = `
            position: absolute;
            top: -40px;
            left: 0;
            background: #667eea;
            color: white;
            padding: 8px 16px;
            text-decoration: none;
            z-index: 10000;
            border-radius: 0 0 4px 0;
        `;
        
        skipLink.addEventListener('focus', () => {
            skipLink.style.top = '0';
        });
        
        skipLink.addEventListener('blur', () => {
            skipLink.style.top = '-40px';
        });
        
        document.body.insertBefore(skipLink, document.body.firstChild);
    }

    trapFocus(container) {
        const focusable = container.querySelectorAll(this.focusableElements);
        const firstFocusable = focusable[0];
        const lastFocusable = focusable[focusable.length - 1];

        container.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    if (document.activeElement === firstFocusable) {
                        e.preventDefault();
                        lastFocusable.focus();
                    }
                } else {
                    if (document.activeElement === lastFocusable) {
                        e.preventDefault();
                        firstFocusable.focus();
                    }
                }
            }
        });

        // Focus first element
        firstFocusable?.focus();
    }

    closeActiveModal() {
        const activeModal = document.querySelector('[role="dialog"][aria-hidden="false"]');
        if (activeModal) {
            const closeButton = activeModal.querySelector('[data-dismiss="modal"]');
            closeButton?.click();
        }
    }
}

/**
 * ARIA live region announcer
 */
export class LiveRegionAnnouncer {
    constructor() {
        this.politeRegion = this.createLiveRegion('polite');
        this.assertiveRegion = this.createLiveRegion('assertive');
    }

    createLiveRegion(politeness) {
        const region = document.createElement('div');
        region.setAttribute('role', 'status');
        region.setAttribute('aria-live', politeness);
        region.setAttribute('aria-atomic', 'true');
        region.className = 'sr-only';
        region.style.cssText = `
            position: absolute;
            left: -10000px;
            width: 1px;
            height: 1px;
            overflow: hidden;
        `;
        document.body.appendChild(region);
        return region;
    }

    announce(message, priority = 'polite') {
        const region = priority === 'assertive' ? this.assertiveRegion : this.politeRegion;
        
        // Clear and set new message
        region.textContent = '';
        setTimeout(() => {
            region.textContent = message;
        }, 100);
    }

    announceError(message) {
        this.announce(`Error: ${message}`, 'assertive');
    }

    announceSuccess(message) {
        this.announce(`Success: ${message}`, 'polite');
    }

    announceLoading(message = 'Loading...') {
        this.announce(message, 'polite');
    }
}

/**
 * Color contrast checker
 */
export class ContrastChecker {
    /**
     * Calculate relative luminance
     */
    getLuminance(r, g, b) {
        const [rs, gs, bs] = [r, g, b].map(c => {
            c = c / 255;
            return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    }

    /**
     * Calculate contrast ratio
     */
    getContrastRatio(color1, color2) {
        const lum1 = this.getLuminance(...this.hexToRgb(color1));
        const lum2 = this.getLuminance(...this.hexToRgb(color2));
        const lighter = Math.max(lum1, lum2);
        const darker = Math.min(lum1, lum2);
        return (lighter + 0.05) / (darker + 0.05);
    }

    /**
     * Convert hex to RGB
     */
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? [
            parseInt(result[1], 16),
            parseInt(result[2], 16),
            parseInt(result[3], 16)
        ] : null;
    }

    /**
     * Check if contrast meets WCAG AA standards
     */
    meetsWCAG_AA(foreground, background, isLargeText = false) {
        const ratio = this.getContrastRatio(foreground, background);
        return isLargeText ? ratio >= 3 : ratio >= 4.5;
    }

    /**
     * Check if contrast meets WCAG AAA standards
     */
    meetsWCAG_AAA(foreground, background, isLargeText = false) {
        const ratio = this.getContrastRatio(foreground, background);
        return isLargeText ? ratio >= 4.5 : ratio >= 7;
    }
}

/**
 * Focus management
 */
export class FocusManager {
    constructor() {
        this.focusHistory = [];
    }

    /**
     * Save current focus
     */
    saveFocus() {
        this.focusHistory.push(document.activeElement);
    }

    /**
     * Restore previous focus
     */
    restoreFocus() {
        const element = this.focusHistory.pop();
        if (element && element.focus) {
            element.focus();
        }
    }

    /**
     * Set focus with visible indicator
     */
    setFocus(element, options = {}) {
        if (!element) return;

        element.focus(options);
        
        // Add visible focus indicator
        if (options.preventScroll !== true) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    /**
     * Create focus trap
     */
    createTrap(container) {
        const focusableElements = container.querySelectorAll(
            'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        const handleTabKey = (e) => {
            if (e.key !== 'Tab') return;

            if (e.shiftKey) {
                if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement.focus();
                }
            } else {
                if (document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement.focus();
                }
            }
        };

        container.addEventListener('keydown', handleTabKey);

        return () => {
            container.removeEventListener('keydown', handleTabKey);
        };
    }
}

/**
 * Screen reader utilities
 */
export class ScreenReaderUtils {
    /**
     * Create visually hidden but screen reader accessible text
     */
    static createSROnly(text) {
        const span = document.createElement('span');
        span.className = 'sr-only';
        span.textContent = text;
        span.style.cssText = `
            position: absolute;
            width: 1px;
            height: 1px;
            padding: 0;
            margin: -1px;
            overflow: hidden;
            clip: rect(0, 0, 0, 0);
            white-space: nowrap;
            border: 0;
        `;
        return span;
    }

    /**
     * Add descriptive label to element
     */
    static addLabel(element, labelText) {
        const id = element.id || `element-${Date.now()}`;
        element.id = id;

        const label = document.createElement('label');
        label.htmlFor = id;
        label.textContent = labelText;
        label.className = 'sr-only';
        
        element.parentNode.insertBefore(label, element);
    }

    /**
     * Add ARIA description
     */
    static addDescription(element, description) {
        const descId = `desc-${Date.now()}`;
        const descElement = document.createElement('span');
        descElement.id = descId;
        descElement.className = 'sr-only';
        descElement.textContent = description;
        
        element.setAttribute('aria-describedby', descId);
        element.parentNode.appendChild(descElement);
    }

    /**
     * Update loading state
     */
    static setLoadingState(element, isLoading, loadingText = 'Loading...') {
        if (isLoading) {
            element.setAttribute('aria-busy', 'true');
            element.setAttribute('aria-live', 'polite');
            
            const loadingSpan = this.createSROnly(loadingText);
            loadingSpan.id = `loading-${Date.now()}`;
            element.appendChild(loadingSpan);
        } else {
            element.removeAttribute('aria-busy');
            const loadingSpan = element.querySelector('.sr-only');
            loadingSpan?.remove();
        }
    }
}

/**
 * Form accessibility enhancer
 */
export class FormAccessibility {
    constructor(form) {
        this.form = form;
        this.init();
    }

    init() {
        this.addRequiredIndicators();
        this.setupErrorAnnouncements();
        this.addFieldDescriptions();
    }

    addRequiredIndicators() {
        const requiredFields = this.form.querySelectorAll('[required]');
        
        requiredFields.forEach(field => {
            const label = this.form.querySelector(`label[for="${field.id}"]`);
            if (label && !label.querySelector('.required-indicator')) {
                const indicator = document.createElement('span');
                indicator.className = 'required-indicator';
                indicator.setAttribute('aria-label', 'required');
                indicator.textContent = ' *';
                indicator.style.color = '#e53e3e';
                label.appendChild(indicator);
            }
        });
    }

    setupErrorAnnouncements() {
        const inputs = this.form.querySelectorAll('input, select, textarea');
        
        inputs.forEach(input => {
            input.addEventListener('invalid', (e) => {
                e.preventDefault();
                this.showError(input, input.validationMessage);
            });

            input.addEventListener('input', () => {
                if (input.validity.valid) {
                    this.clearError(input);
                }
            });
        });
    }

    showError(field, message) {
        // Remove existing error
        this.clearError(field);

        // Create error message
        const errorId = `error-${field.id || Date.now()}`;
        const errorElement = document.createElement('div');
        errorElement.id = errorId;
        errorElement.className = 'error-message';
        errorElement.setAttribute('role', 'alert');
        errorElement.textContent = message;
        errorElement.style.cssText = `
            color: #e53e3e;
            font-size: 14px;
            margin-top: 4px;
        `;

        // Add error styling to field
        field.setAttribute('aria-invalid', 'true');
        field.setAttribute('aria-describedby', errorId);
        field.style.borderColor = '#e53e3e';

        // Insert error message
        field.parentNode.appendChild(errorElement);

        // Announce error
        const announcer = new LiveRegionAnnouncer();
        announcer.announceError(message);
    }

    clearError(field) {
        const errorId = field.getAttribute('aria-describedby');
        if (errorId) {
            const errorElement = document.getElementById(errorId);
            errorElement?.remove();
        }

        field.removeAttribute('aria-invalid');
        field.removeAttribute('aria-describedby');
        field.style.borderColor = '';
    }

    addFieldDescriptions() {
        const fields = this.form.querySelectorAll('[data-description]');
        
        fields.forEach(field => {
            const description = field.getAttribute('data-description');
            ScreenReaderUtils.addDescription(field, description);
        });
    }
}

/**
 * Initialize all accessibility features
 */
export function initializeAccessibility() {
    // Setup keyboard navigation
    const keyboardNav = new KeyboardNavigationManager();

    // Setup live region announcer
    window.announcer = new LiveRegionAnnouncer();

    // Setup focus management
    window.focusManager = new FocusManager();

    // Enhance all forms
    const forms = document.querySelectorAll('form');
    forms.forEach(form => new FormAccessibility(form));

    // Add ARIA landmarks if missing
    addLandmarks();

    // Setup reduced motion preference
    setupReducedMotion();

    // Add focus visible styles
    addFocusStyles();

    console.log('[Accessibility] All features initialized');
}

/**
 * Add ARIA landmarks
 */
function addLandmarks() {
    const main = document.querySelector('main');
    if (main && !main.getAttribute('role')) {
        main.setAttribute('role', 'main');
        main.id = 'main-content';
    }

    const nav = document.querySelector('nav');
    if (nav && !nav.getAttribute('role')) {
        nav.setAttribute('role', 'navigation');
        nav.setAttribute('aria-label', 'Main navigation');
    }

    const header = document.querySelector('header');
    if (header && !header.getAttribute('role')) {
        header.setAttribute('role', 'banner');
    }

    const footer = document.querySelector('footer');
    if (footer && !footer.getAttribute('role')) {
        footer.setAttribute('role', 'contentinfo');
    }
}

/**
 * Setup reduced motion preference
 */
function setupReducedMotion() {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    if (prefersReducedMotion.matches) {
        document.documentElement.style.setProperty('--animation-duration', '0.01ms');
        document.documentElement.classList.add('reduce-motion');
    }

    prefersReducedMotion.addEventListener('change', (e) => {
        if (e.matches) {
            document.documentElement.style.setProperty('--animation-duration', '0.01ms');
            document.documentElement.classList.add('reduce-motion');
        } else {
            document.documentElement.style.removeProperty('--animation-duration');
            document.documentElement.classList.remove('reduce-motion');
        }
    });
}

/**
 * Add focus visible styles
 */
function addFocusStyles() {
    const style = document.createElement('style');
    style.textContent = `
        /* Focus visible styles */
        *:focus-visible {
            outline: 3px solid #667eea;
            outline-offset: 2px;
        }

        /* Remove default focus for mouse users */
        *:focus:not(:focus-visible) {
            outline: none;
        }

        /* High contrast mode support */
        @media (prefers-contrast: high) {
            * {
                border-width: 2px !important;
            }
            
            button, a {
                text-decoration: underline;
            }
        }

        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
            *,
            *::before,
            *::after {
                animation-duration: 0.01ms !important;
                animation-iteration-count: 1 !important;
                transition-duration: 0.01ms !important;
            }
        }
    `;
    document.head.appendChild(style);
}

// Auto-initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAccessibility);
} else {
    initializeAccessibility();
}

// Made with Bob
