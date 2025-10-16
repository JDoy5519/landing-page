// --- Modal Management (Enhanced) ---
function shouldOpenModal(e) {
  if (e.defaultPrevented) return false;
  if (e.button !== 0) return false; // left click only
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return false; // modified clicks go to real page
  return true;
}

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

function showModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  
  modal.setAttribute('aria-hidden', 'false');
  modal.classList.add('show');
  document.body.style.overflow = 'hidden';
  
  // Focus management
  const firstFocusable = modal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
  if (firstFocusable) {
    firstFocusable.focus();
  }
}

function hideModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  
  modal.setAttribute('aria-hidden', 'true');
  modal.classList.remove('show');
  document.body.style.overflow = '';
}

function hideAllModals() {
  const modals = ['privacy-policy-modal', 'terms-modal', 'cookie-policy-modal'];
  modals.forEach(hideModal);
}

// --- Enhanced Modal Content Loading ---
async function loadModalContent(modalId, partialUrl) {
  const modalBodySelector = `#${modalId} .modal-body`;
  return await loadPartialInto(modalBodySelector, partialUrl);
}

// --- Cookie banner "Manage" support ---
document.addEventListener('vlm:cookie:manage', () => {
  const banner = document.getElementById('cookie-banner');
  if (banner) {
    banner.classList.remove('hidden');
    banner.style.display = 'flex';
  }
});

// Handle "Change cookie settings" link in modals
document.addEventListener('click', (e) => {
  const target = e.target.closest('#change-cookie-settings');
  if (!target) return;
  
  e.preventDefault();
  hideAllModals();
  document.dispatchEvent(new CustomEvent('vlm:cookie:manage'));
});

// --- Site Configuration ---
const SITE_CONFIG = {
  routes: {
    iva: './iva/',
    contact_email: 'support@visiblelegal.co.uk'
  }
};

// --- UTM + source_url population ---
document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };

  set('utm_source',  params.get('utm_source'));
  set('utm_medium',  params.get('utm_medium'));
  set('utm_campaign',params.get('utm_campaign'));
  set('utm_term',    params.get('utm_term'));
  set('utm_content', params.get('utm_content'));
  set('source_url',  window.location.href);

  // Update IVA links to use internal path
  updateIVALinks();
});

// --- Update IVA Links ---
function updateIVALinks() {
  const ivaLinks = document.querySelectorAll('a[href*="iva-checker.netlify.app"], a[href*="netlify"]');
  ivaLinks.forEach(link => {
    if (link.href.includes('iva')) {
      link.href = SITE_CONFIG.routes.iva;
      console.log('[config] Updated IVA link to internal path');
    }
  });
}



//HEADER LOGIC

const ctaButton = document.querySelector('.cta-button');
const dropdownMenu = document.querySelector('.dropdown-menu');

ctaButton.addEventListener('click', () => {
  dropdownMenu.classList.toggle('hidden');
});

document.addEventListener('click', (e) => {
  if (!ctaButton.contains(e.target) && !dropdownMenu.contains(e.target)) {
    dropdownMenu.classList.add('hidden');
  }
});

//CLAIMS PROCESS ANIMATION
const faders = document.querySelectorAll('.fade-in');

const appearOptions = {
    threshold: 0.3
  };

const appearOnScroll = new IntersectionObserver(function(entries, observer) {
entries.forEach(entry => {
    if (!entry.isIntersecting) return;
      entry.target.classList.add("show");
      observer.unobserve(entry.target);
    });
  }, appearOptions);

faders.forEach(fader => {
    appearOnScroll.observe(fader);
  });

//FORM SUBMIT LOGIC
const claimTypeSelect = document.getElementById("claimType");
const ivaRefGroup = document.getElementById("ivaRefGroup");

function toggleIVAField() {
  // Check if elements exist before trying to use them
  if (!claimTypeSelect || !ivaRefGroup) {
    return;
  }
  
  if (claimTypeSelect.value === "IVA") {
    ivaRefGroup.classList.remove("hidden");
  } else {
    ivaRefGroup.classList.add("hidden");
  }
}

// Run once on page load (only if elements exist)
if (claimTypeSelect && ivaRefGroup) {
  toggleIVAField();
  // Run every time claim type changes
  claimTypeSelect.addEventListener("change", toggleIVAField);
}


// Inline thank you message (FormSubmit trick)
// --- Submit with enriched JSON payload + UX states ---
const form = document.getElementById("claimForm");
const submitBtn = document.getElementById("submitBtn");
const thankYou = document.getElementById("thankYouMessage");

let errorMsg = document.getElementById("errorMessage");
if (!errorMsg && submitBtn) {
  errorMsg = document.createElement('p');
  errorMsg.id = 'errorMessage';
  errorMsg.className = 'error-message hidden';
  submitBtn.insertAdjacentElement('afterend', errorMsg);
}

function digitsOnly(v){ return (v||'').replace(/\D/g,''); }
function toE164UK(v){
  const raw = (v||'').trim();
  let d = digitsOnly(raw);
  if (!d) return '';
  if (raw.startsWith('+')) return raw;
  if (d.startsWith('44')) return `+${d}`;
  if (d.startsWith('0'))  return `+44${d.slice(1)}`;
  return `+${d}`;
}

if (form) {
  form.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Prevent double submission
  if (submitBtn.disabled) return;
  
  // Check honeypot
  const honeypot = form.querySelector('input[name="_honey"]');
  if (honeypot && honeypot.value) {
    console.log('Bot detected via honeypot');
    return;
  }
  
  submitBtn.disabled = true;
  submitBtn.textContent = 'Submitting…';
  submitBtn.setAttribute('aria-busy', 'true');
  thankYou?.classList.add('hidden');
  errorMsg?.classList.add('hidden');
  errorMsg.textContent = '';

  const fullName = document.getElementById('fullName').value.trim();
  const email    = document.getElementById('email').value.trim();
  const phoneRaw = document.getElementById('phone').value.trim();
  const claim    = document.getElementById('claimType').value;
  const ivaRef   = document.getElementById('ivaRef')?.value.trim() || '';
  const notes    = document.getElementById('message')?.value.trim() || '';

  const payload = {
    fullName, email, phoneRaw,
    phoneDigits: digitsOnly(phoneRaw),
    phoneE164: toE164UK(phoneRaw),
    claimType: claim, ivaRef, notes,
    contactConsent: document.getElementById('contactConsent').checked,
    marketingOptIn: document.getElementById('marketingOptIn').checked,
    consentTimestamp: new Date().toISOString(),
    utm_source:  document.getElementById('utm_source').value,
    utm_medium:  document.getElementById('utm_medium').value,
    utm_campaign:document.getElementById('utm_campaign').value,
    utm_term:    document.getElementById('utm_term').value,
    utm_content: document.getElementById('utm_content').value,
    source_url:  document.getElementById('source_url').value,
    userAgent: navigator.userAgent
  };

  try {
    const res = await fetch(form.action, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    form.reset();
    thankYou?.classList.remove('hidden');
    thankYou?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  } catch (err) {
    errorMsg.textContent = `Sorry, we couldn't submit your details. Please try again in a minute or email ${SITE_CONFIG.routes.contact_email}.`;
    errorMsg.classList.remove('hidden');
    console.error('Submit error:', err);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit';
    submitBtn.removeAttribute('aria-busy');
  }
});
}



//ABOUT US SCROLL

const fadeEls = document.querySelectorAll('.fade-in-up');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  });

fadeEls.forEach(el => observer.observe(el));

//Sticky CTA Logic
const stickyCta = document.querySelector(".sticky-cta");
const heroSection = document.querySelector(".hero-section");

window.addEventListener("scroll", () => {
  const heroBottom = heroSection.offsetTop + heroSection.offsetHeight;
  if (window.scrollY > heroBottom - 50) {
    stickyCta.classList.add("visible");
  } else {
    stickyCta.classList.remove("visible");
  }
});

// Reveal-on-scroll for cards
const revealEls = document.querySelectorAll('.reveal');
const revealObs = new IntersectionObserver((entries, obs) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('is-visible');
    obs.unobserve(entry.target);
  });
}, { threshold: 0.2 });

revealEls.forEach(el => revealObs.observe(el));

/* ===========================================
   Footer interactivity (How it works / Privacy / Cookies)
   - Simple, defensive, and self-contained
   =========================================== */

/* ===========================================
   Enhanced Modal Manager with Policy Support
   =========================================== */
(function () {
  const $ = (s, c=document) => c.querySelector(s);
  const $$ = (s, c=document) => Array.from(c.querySelectorAll(s));

  // Map keys from data-open-modal="…" to modal selectors and partial URLs
  const MODAL_MAP = {
    privacy: { 
      selector: '#privacy-policy-modal', 
      partial: '/partials/privacy-policy.html' 
    },
    terms: { 
      selector: '#terms-modal', 
      partial: '/partials/terms.html' 
    },
    cookie: { 
      selector: '#cookie-policy-modal', 
      partial: '/partials/cookies.html' 
    },
    comingsoon: { 
      selector: '#coming-soon-modal', 
      partial: null 
    }
  };

  function getModalEl(key) {
    const config = MODAL_MAP[key];
    return config ? $(config.selector) : null;
  }

  async function openModalByKey(key) {
    const config = MODAL_MAP[key];
    if (!config) return;

    const modal = $(config.selector);
    if (!modal) return;

    // Load content for policy modals
    if (config.partial) {
      const loaded = await loadModalContent(modal.id, config.partial);
      if (!loaded) return;
    }

    hideAllModals();
    showModal(modal.id);
  }

  // Close actions (outside click + Esc + specific close buttons)
  document.addEventListener('click', (e) => {
    const modal = e.target.closest('.modal');
    if (modal && e.target === modal) hideAllModals(); // click backdrop
  });
  
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') hideAllModals();
  });

  // Close button handlers
  $('#close-privacy')?.addEventListener('click', () => hideModal('privacy-policy-modal'));
  $('#close-terms')?.addEventListener('click', () => hideModal('terms-modal'));
  $('#close-cookie-policy')?.addEventListener('click', () => hideModal('cookie-policy-modal'));

  // SAFETY: ensure closed on load
  document.addEventListener('DOMContentLoaded', hideAllModals);

  // ======= CAPTURE-PHASE DELEGATE =======
  document.addEventListener('click', async (e) => {
    const trigger = e.target.closest('[data-open-modal]');
    if (!trigger) return;

    const key = (trigger.getAttribute('data-open-modal') || '').trim().toLowerCase();
    if (!key) return;

    // If we recognise the key, open modal and block navigation
    if (MODAL_MAP[key]) {
      e.preventDefault();
      await openModalByKey(key);
    }
  }, true); // <-- capture phase

  // ======= POLICY LINK HANDLERS =======
  // Handle policy links with IDs (privacy, terms, cookie policy)
  document.addEventListener('click', async (e) => {
    if (!shouldOpenModal(e)) return;

    let modalKey = null;
    if (e.target.closest('#open-privacy')) modalKey = 'privacy';
    else if (e.target.closest('#open-terms')) modalKey = 'terms';
    else if (e.target.closest('#open-cookie-policy')) modalKey = 'cookie';

    if (modalKey) {
      e.preventDefault();
      await openModalByKey(modalKey);
    }
  });
})();


// Smooth scroll for "Start your free check" link
const scrollLink = document.getElementById("scroll-to-form");
const formSection = document.getElementById("register");

if (scrollLink && formSection) {
  scrollLink.addEventListener("click", (e) => {
    e.preventDefault();
    formSection.scrollIntoView({ behavior: "smooth" });
  });
}

// Shrink header on scroll
const siteHeader = document.querySelector('.site-header');
window.addEventListener('scroll', () => {
  if (window.scrollY > 50) {
    siteHeader.classList.add('shrink');
  } else {
    siteHeader.classList.remove('shrink');
  }
});

let isShrunk = false;
const SHRINK_ON  = 80; // scrollY to add .shrink
const EXPAND_ON  = 20; // scrollY to remove .shrink
let ticking = false;

function onScroll() {
  const y = window.scrollY || document.documentElement.scrollTop;

  if (!isShrunk && y > SHRINK_ON) {
    siteHeader.classList.add('shrink');
    isShrunk = true;
  } else if (isShrunk && y < EXPAND_ON) {
    siteHeader.classList.remove('shrink');
    isShrunk = false;
  }

  ticking = false;
}

window.addEventListener('scroll', () => {
  if (!ticking) {
    requestAnimationFrame(onScroll);
    ticking = true;
  }
}, { passive: true });

// Run once on load
onScroll();


/* =========================
   Cookie Consent + Analytics (Robust State Machine)
   ========================= */
(function () {
  // Prevent duplicate initialization
  if (window.__cookieInitDone) return;
  window.__cookieInitDone = true;

  const BANNER_ID = 'cookie-banner';
  const STORAGE_KEY = 'vlm_consent'; // Simplified key
  const POLICY_VERSION = '2025-08-15';

  const $ = (s, c=document) => c.querySelector(s);
  let cookieAC; // AbortController for event cleanup

  // Ensure only one banner exists
  const existingBanners = document.querySelectorAll('#' + BANNER_ID);
  if (existingBanners.length > 1) {
    for (let i = 1; i < existingBanners.length; i++) {
      existingBanners[i].remove();
    }
  }

  // Path detection for cookie page
  const isCookiePage = /^\/cookies(\/index\.html)?\/?$/i.test(location.pathname) || 
                       location.pathname.includes('/cookies/');

  console.log('[cookies] Is cookie page:', isCookiePage, 'Path:', location.pathname);

  // Simple state machine: "unset" | "accepted" | "rejected"
  function getConsentState() {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored || 'unset';
  }
  
  function setConsentState(state) {
    if (!['accepted', 'rejected', 'unset'].includes(state)) {
      console.error('[cookies] Invalid state:', state);
      return;
    }
    localStorage.setItem(STORAGE_KEY, state);
    console.log('[cookies] Consent state set to:', state);
  }
  function bindCookieEvents() {
    // Clean up previous listeners
    if (cookieAC) cookieAC.abort();
    cookieAC = new AbortController();
    const { signal } = cookieAC;

    const bannerEl = $('#' + BANNER_ID);
    const btnAccept = $('#acceptAnalytics');
    const btnReject = $('#rejectAnalytics');

    if (!bannerEl) {
      console.warn('[cookies] Banner element not found for binding');
      return;
    }

    console.log('[cookies] Binding events to banner buttons');

    if (btnAccept) {
      btnAccept.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('[cookies] Accept button clicked');
        
        setConsentState('accepted');
        const gtag = safeGtag();
        gtag('consent', 'update', { analytics_storage: 'granted' });
        
        const id = window.GA_MEASUREMENT_ID || 'G-P36T39LW3D';
        gtag('config', id, { debug_mode: true });
        
        hideBanner();
      }, { signal });
    } else {
      console.warn('[cookies] Accept button not found');
    }

    if (btnReject) {
      btnReject.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('[cookies] Reject button clicked');
        
        setConsentState('rejected');
        const gtag = safeGtag();
        gtag('consent', 'update', { analytics_storage: 'denied' });
        
        hideBanner();
      }, { signal });
    } else {
      console.warn('[cookies] Reject button not found');
    }
  }

  function showBanner(show = true) {
    const bannerEl = $('#' + BANNER_ID);
    if (!bannerEl) {
      console.warn('[cookies] Banner element not found');
      return;
    }
    bannerEl.style.display = show ? 'flex' : 'none';
    console.log('[cookies] Banner', show ? 'shown' : 'hidden');
    
    if (show) {
      // Rebind events when showing
      bindCookieEvents();
      // Focus first button when shown
      const btnAccept = $('#acceptAnalytics');
      if (btnAccept) {
        setTimeout(() => btnAccept.focus({ preventScroll: true }), 100);
      }
    }
  }

  function hideBanner() {
    showBanner(false);
  }

  // Safety: wrapper around gtag so we don't crash if GA hasn't loaded yet
  function safeGtag() {
    if (typeof window.gtag === 'function') return window.gtag;
    // Create a no-op that still queues into dataLayer
    window.dataLayer = window.dataLayer || [];
    window.gtag = function(){ window.dataLayer.push(arguments); };
    return window.gtag;
  }

  // Apply consent based on state machine
  function applyConsent() {
    const state = getConsentState();
    const gtag = safeGtag();
    
    console.log('[cookies] Current consent state:', state, 'Cookie page:', isCookiePage);
    
    if (state === 'accepted') {
      console.log('[cookies] Prior acceptance found → grant analytics & config');
      gtag('consent', 'update', { analytics_storage: 'granted' });
      const id = window.GA_MEASUREMENT_ID || 'G-P36T39LW3D';
      gtag('config', id, { debug_mode: true });
      hideBanner();
    } else if (state === 'rejected') {
      console.log('[cookies] Prior rejection found → keep analytics denied');
      gtag('consent', 'update', { analytics_storage: 'denied' });
      hideBanner();
    } else {
      // state === 'unset' → show banner (but not on cookie page by default)
      if (isCookiePage) {
        console.log('[cookies] Cookie page - banner hidden by default, use Manage Settings to show');
        hideBanner();
      } else {
        console.log('[cookies] No prior choice → show banner');
        showBanner(true);
      }
    }
  }

  // Initial event binding (will be rebound via showBanner when needed)
  bindCookieEvents();

  // "Manage Cookie Settings" handler
  document.addEventListener('click', (e) => {
    const target = e.target.closest('#manage-cookie-settings, #change-cookie-settings');
    if (!target) return;
    
    e.preventDefault();
    console.log('[cookies] Manage settings clicked - showing banner');
    
    // Close any open modals
    const openModals = document.querySelectorAll('.modal.show');
    openModals.forEach(m => {
      m.classList.remove('show');
      m.setAttribute('aria-hidden', 'true');
    });
    document.body.style.overflow = '';
    
    // Show banner regardless of current state
    showBanner(true);
  });

  // Init on load
  document.addEventListener('DOMContentLoaded', () => {
    applyConsent();
  });
})();


// --- Coming Soon modal: UX + accessibility helpers ---
(function () {
  const modal = document.getElementById('coming-soon-modal');
  if (!modal) return;

  const panel = modal.querySelector('.modal-panel');
  const closeEls = modal.querySelectorAll('[data-close-modal]');
  let lastFocused = null;

  function getFocusable(container) {
    return Array.from(container.querySelectorAll(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
    )).filter(el => el.offsetParent !== null);
  }

  function openHook() {
    lastFocused = document.activeElement;
    // Move focus to first focusable in panel
    const focusables = getFocusable(panel);
    focusables[0]?.focus();
  }

  function closeHook() {
    if (lastFocused && document.contains(lastFocused)) lastFocused.focus();
  }

  // Observe show/hide state changes to run hooks once
  const observer = new MutationObserver(() => {
    const isOpen = modal.classList.contains('show');
    if (isOpen) openHook();
    else closeHook();
  });
  observer.observe(modal, { attributes: true, attributeFilter: ['class'] });

  // Close handlers
  closeEls.forEach(el => el.addEventListener('click', () => {
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }));

  // Esc closes the modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('show')) {
      e.preventDefault();
      modal.classList.remove('show');
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }
  });

  // Simple focus trap
  panel.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    const focusables = getFocusable(panel);
    if (!focusables.length) return;

    const first = focusables[0];
    const last  = focusables[focusables.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus();
    }
  });
})();

// --- Coming Soon → preselect claim + scroll to #register ---
(() => {
  const modal       = document.getElementById('coming-soon-modal');
  const registerSec = document.getElementById('register');

  if (!modal || !registerSec) return;

  // Try to find a claim-type control in the register section
  const findClaimControl = () =>
    registerSec.querySelector('#claimType') ||
    registerSec.querySelector('select[name="claimType"]') ||
    registerSec.querySelector('input[type="radio"][name="claimType"]');

  // Helper: set claim on <select> or radio group
  const setClaim = (label) => {
    const wanted = String(label).trim().toLowerCase();

    // 1) <select>
    const select = registerSec.querySelector('#claimType, select[name="claimType"]');
    if (select) {
      const opts = Array.from(select.options);
      const match = opts.find(o =>
        o.value.toLowerCase() === wanted || o.text.toLowerCase() === wanted
      );
      if (match) select.value = match.value;
      // fire change for any conditional UI
      select.dispatchEvent(new Event('change', { bubbles: true }));
      return;
    }

    // 2) radios fallback
    const radios = Array.from(registerSec.querySelectorAll('input[type="radio"][name="claimType"]'));
    if (radios.length) {
      // try value exact, value with underscores, or text content match
      let radio =
        radios.find(r => r.value.toLowerCase() === wanted) ||
        radios.find(r => r.value.toLowerCase() === wanted.replace(/\s+/g, '_')) ||
        null;
      if (!radio) {
        // last resort: match by label text
        radio = radios.find(r => {
          const lab = registerSec.querySelector(`label[for="${r.id}"]`);
          return lab && lab.textContent.trim().toLowerCase() === wanted;
        });
      }
      if (radio) {
        radio.checked = true;
        radio.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
  };

  // Smooth scroll to the form, with a small offset for sticky headers if present
  const scrollToForm = () => {
    // If you have a sticky header, set its height here (px). Otherwise leave 0.
    const STICKY_OFFSET = 0; // change to e.g. 72 if your header is sticky and 72px tall
    const top = registerSec.getBoundingClientRect().top + window.pageYOffset - STICKY_OFFSET;
    window.scrollTo({ top, behavior: 'smooth' });

    // After scrolling, focus the first interactive control
    setTimeout(() => {
      const first = registerSec.querySelector('input, select, textarea, button');
      first?.focus({ preventScroll: true });
    }, 350);
  };

  modal.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-select-claim]');
    if (!btn) return;

    e.preventDefault();

    // 1) Preselect claim (use data attribute or button text)
    const label = btn.getAttribute('data-select-claim') || btn.textContent;
    setClaim(label);

    // 2) Close the modal and unlock body scroll
    modal.classList.remove('show');
    document.body.style.overflow = '';

    // 3) Scroll to form
    scrollToForm();
  });
})();

// ---- phone helpers
function digitsOnly(v) { return (v || '').replace(/\D/g, ''); }
function toE164UK(v) {
  let d = digitsOnly(v);
  if (!d) return '';
  if (d.startsWith('44')) return '+'.concat(d);
  if (d.startsWith('0')) return '+44'.concat(d.slice(1));
  // last fallback: if user pasted '+44...' keep as is
  if (v.trim().startsWith('+')) return v.trim();
  return '+'.concat(d);
}

// Note: Phone helper functions and payload building are handled in the form submission section above
