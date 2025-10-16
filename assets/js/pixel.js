/**
 * Facebook Pixel + CAPI wrapper for Visible Legal Marketing
 * Implements consent-aware tracking with Lead events and CAPI integration
 */

(function() {
  'use strict';

  // Check if environment variables are available
  if (typeof window.ENV === 'undefined') {
    console.warn('[FBCapture] Environment variables not loaded. Make sure env.js is included.');
    return;
  }

  // Helper functions for user data normalization and hashing
  async function sha256Hex(str) {
    const enc = new TextEncoder().encode(str);
    const buf = await crypto.subtle.digest('SHA-256', enc);
    const bytes = new Uint8Array(buf);
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  function normalizeEmail(s) {
    if (!s) return null;
    const v = String(s).trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(v)) return null;
    return v;
  }

  function normalizePhoneUK(s) {
    if (!s) return null;
    let v = String(s).replace(/\D+/g, '');
    if (!v) return null;
    if (v.startsWith('0')) v = '44' + v.slice(1); // 0XXXXXXXXXX -> 44XXXXXXXXXX
    // Accept 10–15 digits as a sanity window
    if (v.length < 10 || v.length > 15) return null;
    return v;
  }

  // Global FBCapture object
  window.FBCapture = {
    pixelLoaded: false,
    pixelId: null,
    
    // Expose helper functions globally
    sha256Hex: sha256Hex,
    normalizeEmail: normalizeEmail,
    normalizePhoneUK: normalizePhoneUK,

    /**
     * Initialize Facebook Pixel with consent guard
     * @param {string} pixelId - Facebook Pixel ID
     */
    init: function(pixelId) {
      if (!pixelId) {
        console.warn('[FBCapture] No pixel ID provided');
        return;
      }

      this.pixelId = pixelId;
      
      // Check consent before loading pixel
      if (this.hasConsent()) {
        this.loadPixel();
      } else {
        console.log('[FBCapture] Pixel initialization deferred - waiting for consent');
      }
    },

    /**
     * Check if user has given consent for analytics
     * @returns {boolean}
     */
    hasConsent: function() {
      return localStorage.getItem('vlm_consent') === 'accepted';
    },

    /**
     * Load Facebook Pixel script
     */
    loadPixel: function() {
      if (this.pixelLoaded) return;

      try {
        // Load Facebook Pixel script
        (function(f,b,e,v,n,t,s) {
          if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)
        })(window, document,'script','https://connect.facebook.net/en_US/fbevents.js');

        // Initialize pixel
        fbq('init', this.pixelId);
        fbq('track', 'PageView');
        
        this.pixelLoaded = true;
        console.log('[FBCapture] Pixel loaded and initialized');
      } catch (error) {
        console.error('[FBCapture] Error loading pixel:', error);
      }
    },

    /**
     * Ensure pixel is loaded (call before tracking events)
     */
    ensurePixel: function() {
      if (!this.pixelLoaded && this.hasConsent()) {
        this.loadPixel();
      }
    },

    /**
     * Track a Facebook event
     * @param {string} eventName - Event name (e.g., 'Lead', 'ViewContent')
     * @param {Object} eventData - Event parameters
     * @param {string} eventId - Optional event ID for deduplication
     */
    track: function(eventName, eventData, eventId) {
      if (!this.hasConsent()) {
        console.log('[FBCapture] Event tracking skipped - no consent');
        return;
      }

      this.ensurePixel();

      try {
        if (eventId) {
          fbq('track', eventName, eventData, { eventID: eventId });
        } else {
          fbq('track', eventName, eventData);
        }
        
        if (window.ENV.FBCAPTURE_DEBUG === 'true') {
          console.log('[FBCapture] Tracked event:', eventName, eventData, eventId);
        }
      } catch (error) {
        console.error('[FBCapture] Error tracking event:', error);
      }
    },

    /**
     * Track ViewContent event (for IVA pages)
     */
    trackView: function() {
      this.track('ViewContent', {
        content_category: 'IVA',
        content_name: 'IVA Claim Checker'
      });
    },

    /**
     * Send Lead event with CAPI integration
     * @param {string} makeWebhookUrl - Make.com webhook URL for CAPI
     * @param {Object} extraUserData - Additional user data (optional)
     */
    sendLead: function(makeWebhookUrl, extraUserData) {
      if (!this.hasConsent()) {
        console.log('[FBCapture] Lead tracking skipped - no consent');
        return;
      }

      try {
        // Generate event ID for deduplication
        const eventId = this.generateEventId();
        
        // Track browser pixel event
        this.track('Lead', {
          content_category: 'IVA',
          content_name: 'IVA Claim Submission'
        }, eventId);

        // Send to CAPI via Make.com webhook
        this.sendToCAPI(makeWebhookUrl, eventId, extraUserData);

        if (window.ENV.FBCAPTURE_DEBUG === 'true') {
          console.log('[FBCapture] Lead event sent:', eventId);
        }
      } catch (error) {
        console.error('[FBCapture] Error sending lead:', error);
      }
    },

    /**
     * Generate unique event ID
     * @returns {string}
     */
    generateEventId: function() {
      if (crypto && crypto.randomUUID) {
        return crypto.randomUUID();
      }
      return 'evt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },

    /**
     * Send event to CAPI via Make.com webhook
     * @param {string} webhookUrl - Make.com webhook URL
     * @param {string} eventId - Event ID for deduplication
     * @param {Object} extraUserData - Additional user data
     */
    sendToCAPI: function(webhookUrl, eventId, extraUserData) {
      if (!webhookUrl) {
        console.warn('[FBCapture] No CAPI webhook URL provided');
        return;
      }

      try {
        // Get Facebook browser identifiers
        const fbp = this.getCookie('_fbp');
        const fbc = this.getCookie('_fbc');

        // Build CAPI payload
        const user_data = {
          fbp: fbp,
          fbc: fbc,
          client_user_agent: navigator.userAgent
        };
        
        // Merge extraUserData keys em/ph if present
        if (extraUserData && typeof extraUserData === 'object') {
          if (extraUserData.em) user_data.em = extraUserData.em;
          if (extraUserData.ph) user_data.ph = extraUserData.ph;
        }
        
        const capiPayload = {
          data: [{
            event_name: 'Lead',
            event_time: Math.floor(Date.now() / 1000),
            action_source: 'website',
            event_id: eventId,
            event_source_url: window.location.href,
            user_data: user_data,
            custom_data: {
              content_category: 'IVA',
              content_name: 'IVA Claim Submission'
            }
          }]
        };

        // Send to Make.com webhook
        fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(capiPayload),
          keepalive: true
        }).catch(error => {
          console.error('[FBCapture] CAPI webhook error:', error);
        });

      } catch (error) {
        console.error('[FBCapture] Error building CAPI payload:', error);
      }
    },

    /**
     * Get cookie value by name
     * @param {string} name - Cookie name
     * @returns {string|null}
     */
    getCookie: function(name) {
      const value = "; " + document.cookie;
      const parts = value.split("; " + name + "=");
      if (parts.length === 2) {
        return parts.pop().split(";").shift();
      }
      return null;
    },

    /**
     * Make.com webhook helpers
     */
    MAKE: {
      /**
       * Send IVA capture data to Make.com
       * @param {Object} payload - Data to send
       */
      sendIvaCapture: function(payload) {
        const webhookUrl = window.ENV.MAKE_IVA_CAPTURE_WEBHOOK_URL;
        if (!webhookUrl) {
          console.warn('[FBCapture] No IVA capture webhook URL configured');
          return;
        }

        fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload),
          keepalive: true
        }).catch(error => {
          console.error('[FBCapture] IVA capture webhook error:', error);
        });
      },

      /**
       * Send general query data to Make.com
       * @param {Object} payload - Data to send
       */
      sendGeneralQuery: function(payload) {
        const webhookUrl = window.ENV.MAKE_GENERAL_QUERY_WEBHOOK_URL;
        if (!webhookUrl) {
          console.warn('[FBCapture] No general query webhook URL configured');
          return;
        }

        fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload),
          keepalive: true
        }).catch(error => {
          console.error('[FBCapture] General query webhook error:', error);
        });
      }
    }
  };

  // Auto-initialize on DOM ready
  document.addEventListener('DOMContentLoaded', function() {
    // Initialize pixel if we have a pixel ID
    if (window.ENV.META_PIXEL_ID) {
      FBCapture.init(window.ENV.META_PIXEL_ID);
    }

    // Auto-track ViewContent for IVA pages
    if (window.location.pathname.endsWith('/iva.html') || 
        window.location.pathname.includes('/iva/')) {
      FBCapture.trackView();
    }
  });

})();