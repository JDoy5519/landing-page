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
});



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
  if (claimTypeSelect.value === "IVA") {
    ivaRefGroup.classList.remove("hidden");
  } else {
    ivaRefGroup.classList.add("hidden");
  }
}

// Run once on page load
toggleIVAField();

// Run every time claim type changes
claimTypeSelect.addEventListener("change", toggleIVAField);


// Inline thank you message (FormSubmit trick)
// --- Submit with enriched JSON payload + UX states ---
const form = document.getElementById("claimForm");
const submitBtn = document.getElementById("submitBtn");
const thankYou = document.getElementById("thankYouMessage");

let errorMsg = document.getElementById("errorMessage");
if (!errorMsg) {
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

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  submitBtn.disabled = true;
  submitBtn.textContent = 'Submitting…';
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
    errorMsg.textContent = "Sorry, we couldn’t submit your details. Please try again in a minute or email support@visiblelegal.co.uk.";
    errorMsg.classList.remove('hidden');
    console.error('Submit error:', err);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit';
  }
});



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
   Modal Manager — capture-phase + DRY mapping
   =========================================== */
(function () {
  const $  = (s, c=document) => c.querySelector(s);
  const $$ = (s, c=document) => Array.from(c.querySelectorAll(s));

  // Map keys from data-open-modal="…" to modal selectors
  const MODAL_MAP = {
    privacy: '#privacy-policy-modal',
    terms:   '#terms-modal',
    cookie:  '#cookie-policy-modal', // ready for future use
    comingsoon: '#coming-soon-modal' // <-- add this
  };

  function getModalEl(key) {
    const sel = MODAL_MAP[key];
    return sel ? $(sel) : null;
  }

  function bodyLock(lock) {
    document.body.style.overflow = lock ? 'hidden' : '';
  }

  function closeAllModals() {
    $$('.modal').forEach(m => {
      m.classList.remove('show');
      m.setAttribute('aria-hidden', 'true');
    });
    bodyLock(false);
  }

  function openModalByKey(key) {
    const modal = getModalEl(key);
    if (!modal) return;
    closeAllModals();
    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');
    bodyLock(true);
    // focus first sensible control
    (modal.querySelector('#close-privacy, #close-terms, button, [href], input, select, textarea') || modal)
      ?.focus?.({ preventScroll: true });
  }

  // Close actions (outside click + Esc + specific close buttons)
  document.addEventListener('click', (e) => {
    const m = e.target.closest('.modal');
    if (m && e.target === m) closeAllModals(); // click backdrop
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAllModals();
  });
  $('#close-privacy')?.addEventListener('click', closeAllModals);
  $('#close-terms')?.addEventListener('click', closeAllModals);
  $('#close-cookie-policy')?.addEventListener('click', closeAllModals);


  // SAFETY: ensure closed on load
  document.addEventListener('DOMContentLoaded', closeAllModals);

  // ======= CAPTURE-PHASE DELEGATE =======
  // This guarantees we see the click before any bubbling handler calls stopPropagation().
  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-open-modal]');
    if (!trigger) return;

    const key = (trigger.getAttribute('data-open-modal') || '').trim().toLowerCase();
    if (!key) return;

    // If we recognise the key, open modal and block navigation
    if (MODAL_MAP[key]) {
      e.preventDefault();
      openModalByKey(key);
    }
  }, true); // <-- capture phase
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
   Cookie Consent + Analytics (Consent Mode in <head>)
   ========================= */
(function () {
  const BANNER_ID = 'cookie-banner';
  const STORAGE_KEY = 'vlm_cookie_consent';
  const POLICY_VERSION = '2025-08-15'; // keep this in sync with your policy dates

  const $ = (s, c=document) => c.querySelector(s);

  const bannerEl  = $('#' + BANNER_ID);
  const btnAccept = $('#acceptAnalytics');
  const btnReject = $('#rejectAnalytics');

  function getConsent() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); }
    catch { return null; }
  }
  function setConsent(accepted) {
    const payload = { analytics: !!accepted, version: POLICY_VERSION, ts: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    return payload;
  }
  function showBanner(show) {
    if (!bannerEl) return;
    bannerEl.style.display = show ? 'flex' : 'none';
  }

  // Safety: wrapper around gtag so we don't crash if GA hasn't loaded yet
  function safeGtag() {
    if (typeof window.gtag === 'function') return window.gtag;
    // Create a no-op that still queues into dataLayer
    window.dataLayer = window.dataLayer || [];
    window.gtag = function(){ window.dataLayer.push(arguments); };
    return window.gtag;
  }

  // Apply saved choice at startup
  function applyConsent(consent) {
    const gtag = safeGtag();
    if (consent?.analytics) {
      // User already accepted earlier
      console.log('[cookies] prior acceptance found → grant analytics & config');
      gtag('consent', 'update', { analytics_storage: 'granted' });
      // Fire config now (queue-safe if library still loading)
      const id = window.GA_MEASUREMENT_ID || 'G-P36T39LW3D';
      gtag('config', id, { debug_mode: true }); // debug_mode helps you see hits in DebugView
      showBanner(false);
    } else {
      // No choice yet → show banner
      showBanner(true);
    }
  }

  // Wire buttons
  btnAccept?.addEventListener('click', () => {
    const c = setConsent(true);
    console.log('[cookies] accepted analytics at', c.ts);
    const gtag = safeGtag();
    gtag('consent', 'update', { analytics_storage: 'granted' });

    // Send config now that consent is granted
    const id = window.GA_MEASUREMENT_ID || 'G-P36T39LW3D';
    gtag('config', id, { debug_mode: true });

    showBanner(false);
  });

  btnReject?.addEventListener('click', () => {
    const c = setConsent(false);
    console.log('[cookies] rejected analytics at', c.ts);
    const gtag = safeGtag();
    // Optional: explicitly update to denied again
    gtag('consent', 'update', { analytics_storage: 'denied' });
    showBanner(false);
  });

  // “Change cookie settings” link in the cookie modal → clear and show banner
  document.addEventListener('click', (e) => {
    const a = e.target.closest('#change-cookie-settings');
    if (!a) return;
    e.preventDefault();
    localStorage.removeItem(STORAGE_KEY);
    const openModals = document.querySelectorAll('.modal.show');
    openModals.forEach(m => m.classList.remove('show'));
    document.body.style.overflow = '';
    showBanner(true);
  });

  // Init on load
  document.addEventListener('DOMContentLoaded', () => {
    applyConsent(getConsent());
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

// build payload
const rawPhone = document.getElementById('phone').value.trim();
const phoneDigits = digitsOnly(rawPhone);
const phoneE164 = toE164UK(rawPhone);

const payload = {
  fullName: document.getElementById('fullName').value.trim(),
  email: document.getElementById('email').value.trim(),
  phoneRaw: rawPhone,            // as typed (passes your pattern)
  phoneDigits: phoneDigits,      // 07123456789 -> 07123456789 (no spaces)
  phoneE164: phoneE164,          // -> +447123456789
  claimType: document.getElementById('claimType').value,
  ivaRef: document.getElementById('ivaRef')?.value.trim() || '',
  notes: document.getElementById('message')?.value.trim() || '',
  contactConsent: document.getElementById('contactConsent').checked,
  marketingOptIn: document.getElementById('marketingOptIn').checked,
  consentTimestamp: new Date().toISOString(),
  utm_source: document.getElementById('utm_source').value,
  utm_medium: document.getElementById('utm_medium').value,
  utm_campaign: document.getElementById('utm_campaign').value,
  utm_term: document.getElementById('utm_term').value,
  utm_content: document.getElementById('utm_content').value,
  source_url: document.getElementById('source_url').value,
  userAgent: navigator.userAgent
};






