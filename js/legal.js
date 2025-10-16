// Standalone Page Content Loader
// Simplified version for policy pages only

(function() {
    'use strict';
    
    // Prevent duplicate initialization
    if (window.__vlmLegalInit) return;
    window.__vlmLegalInit = true;

    // --- Helper Functions ---
    async function loadPartialInto(selector, url) {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const html = await response.text();
            const el = document.querySelector(selector);
            if (el) {
                el.innerHTML = html;
                return true;
            }
        } catch (err) {
            console.warn('Partial load failed:', url, err);
            return false;
        }
        return false;
    }

    // --- Page Content Loading (for standalone pages) ---
    async function loadPageContent() {
        const policyBody = document.getElementById('policy-body');
        if (!policyBody) return;

        const path = window.location.pathname;
        let partialUrl = '';
        
        if (path.includes('/privacy-policy/')) {
            partialUrl = '../partials/privacy-policy.html';
        } else if (path.includes('/terms/')) {
            partialUrl = '../partials/terms.html';
        } else if (path.includes('/cookies/')) {
            partialUrl = '../partials/cookies.html';
        }
        
        if (partialUrl) {
            await loadPartialInto('#policy-body', partialUrl);
        }
    }

    // --- Cookie Banner Management for standalone pages ---
    function setupCookieManagement() {
        // Handle "Manage cookie settings" button on /cookies/ page
        document.addEventListener('click', (e) => {
            const target = e.target.closest('#manage-cookie-settings');
            if (!target) return;
            
            e.preventDefault();
            document.dispatchEvent(new CustomEvent('vlm:cookie:manage'));
        });

        // Listen for cookie management events
        document.addEventListener('vlm:cookie:manage', () => {
            const banner = document.getElementById('cookie-banner');
            if (banner) {
                banner.classList.remove('hidden');
                banner.style.display = 'flex';
            }
        });
    }

    // --- Initialization ---
    function init() {
        setupCookieManagement();
        
        // Load content for standalone pages
        if (document.getElementById('policy-body')) {
            loadPageContent();
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
