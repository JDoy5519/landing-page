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
const form = document.getElementById("claimForm");
form.addEventListener("submit", function (e) {
  e.preventDefault();
  
  fetch(form.action, {
    method: "POST",
    body: new FormData(form),
    headers: { Accept: "application/json" }
  }).then(response => {
    if (response.ok) {
      form.reset();
      document.getElementById("thankYouMessage").classList.remove("hidden");
    }
  });
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
    cookie:  '#cookie-policy-modal' // ready for future use
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

/* =========================
   Cookie Consent + Analytics
   ========================= */
(function () {
  const BANNER_ID = 'cookie-banner';
  const STORAGE_KEY = 'vlm_cookie_consent';
  const POLICY_VERSION = '2025-08-15'; // bump when policy changes
  const GA_MEASUREMENT_ID = 'G-XXXXXXXXXX'; // <-- replace with your GA4 ID

  const $ = (s, c=document) => c.querySelector(s);

  const bannerEl = $('#' + BANNER_ID);
  const btnAccept = $('#acceptAnalytics');
  const btnReject = $('#rejectAnalytics');

  function getConsent() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); }
    catch { return null; }
  }

  function setConsent(accepted) {
    const payload = {
      analytics: !!accepted,
      version: POLICY_VERSION,
      ts: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    return payload;
  }

  function showBanner(show) {
    if (!bannerEl) return;
    bannerEl.style.display = show ? 'flex' : 'none';
  }

  // GA4 loader – only runs if consent.analytics === true
  function loadAnalytics() {
    if (!GA_MEASUREMENT_ID || window.__gaLoaded) return;
    window.__gaLoaded = true;

    // (Optional) Consent Mode v2 defaults (blocked until granted)
    window.dataLayer = window.dataLayer || [];
    function gtag(){ dataLayer.push(arguments); }
    gtag('consent', 'default', {
      'ad_user_data': 'denied',
      'ad_personalization': 'denied',
      'ad_storage': 'denied',
      'analytics_storage': 'denied',
      'functionality_storage': 'granted',
      'security_storage': 'granted'
    });

    // Inject GA4
    const s1 = document.createElement('script');
    s1.async = true;
    s1.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    document.head.appendChild(s1);

    const s2 = document.createElement('script');
    s2.text = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){ dataLayer.push(arguments); }
      gtag('js', new Date());
      gtag('consent', 'update', { 'analytics_storage': 'granted' });
      gtag('config', '${GA_MEASUREMENT_ID}');
    `;
    document.head.appendChild(s2);
  }

  function applyConsent(consent) {
    // Respect existing choice
    if (consent?.analytics) {
      loadAnalytics();
    }
    showBanner(!consent); // show banner only if no prior choice
  }

  // Wire buttons
  btnAccept?.addEventListener('click', () => {
    const c = setConsent(true);
    loadAnalytics();
    showBanner(false);
  });
  btnReject?.addEventListener('click', () => {
    setConsent(false);
    showBanner(false);
  });

  // “Change cookie settings” (in cookie modal) -> clear and show banner
  document.addEventListener('click', (e) => {
    const a = e.target.closest('#change-cookie-settings');
    if (!a) return;
    e.preventDefault();
    localStorage.removeItem(STORAGE_KEY);
    // Close any open modal (re-use your modal closer if present)
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

