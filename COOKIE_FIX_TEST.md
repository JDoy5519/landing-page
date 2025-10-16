# Cookie Banner Fix - Test Guide

## Root Causes Fixed:
1. **Missing Script**: `/cookies/index.html` only loaded `legal.js`, not the main `script.js` with cookie consent logic
2. **No Event Rebinding**: When "Manage Settings" showed banner, buttons had no event listeners
3. **Path Detection**: No logic to handle cookie page behavior properly

## Fixes Applied:
1. **Added main script**: All policy pages now load `../script.js` before `../js/legal.js`
2. **AbortController Pattern**: Robust event binding/cleanup using `bindCookieEvents()`
3. **Path Detection**: Added regex to detect cookie page: `/^\/cookies(\/index\.html)?\/?$/i`
4. **Smart Banner Logic**: Cookie page hides banner by default, shows only via "Manage Settings"

## Manual Test Steps:

### Test 1: Main Page Behavior (Baseline)
```bash
# Open index.html
localStorage.clear()
# Refresh page
# Expected: Banner appears, Accept/Reject work, persists on reload
```

### Test 2: Cookie Page - Fresh State
```bash
# Navigate to /cookies/index.html
localStorage.clear()
# Refresh page
# Expected: No banner shows (cookie page default behavior)
# Click "Manage Cookie Settings"
# Expected: Banner appears with working Accept/Reject buttons
```

### Test 3: Cookie Page - Accept Flow
```bash
# On /cookies/index.html with banner showing
# Click "Accept analytics"
# Expected: Banner disappears immediately
# Expected: Console shows: "[cookies] Accept button clicked"
# Refresh page
# Expected: Banner stays hidden
```

### Test 4: Cookie Page - Reject Flow
```bash
# Clear localStorage, navigate to /cookies/index.html
# Click "Manage Cookie Settings" → Click "Reject analytics"
# Expected: Banner disappears immediately
# Expected: Console shows: "[cookies] Reject button clicked"
# Refresh page
# Expected: Banner stays hidden
```

### Test 5: Cross-Page Consistency
```bash
# Set consent on main page: Accept analytics
# Navigate to /cookies/index.html
# Expected: Banner hidden (respects prior consent)
# Click "Manage Cookie Settings"
# Expected: Banner appears, buttons still work
```

## Debug Commands:
```javascript
// Check if scripts loaded
console.log('Main script loaded:', typeof SITE_CONFIG !== 'undefined')
console.log('Cookie init done:', window.__cookieInitDone)

// Check button elements
console.log('Accept button:', document.getElementById('acceptAnalytics'))
console.log('Reject button:', document.getElementById('rejectAnalytics'))

// Check consent state
console.log('Consent state:', localStorage.getItem('vlm_consent'))

// Force banner show for testing
document.querySelector('#manage-cookie-settings').click()
```

## Expected Console Output:
```
[cookies] Is cookie page: true Path: /cookies/index.html
[cookies] Current consent state: unset Cookie page: true
[cookies] Cookie page - banner hidden by default, use Manage Settings to show
[cookies] Manage settings clicked - showing banner
[cookies] Binding events to banner buttons
[cookies] Accept button clicked  // (when clicked)
[cookies] Consent state set to: accepted
[cookies] Banner hidden
```

## Success Criteria:
✅ Cookie banner fully interactive on `/cookies/index.html`  
✅ Accept/Reject buttons work and persist state  
✅ "Manage Cookie Settings" shows banner with working buttons  
✅ Banner respects prior consent across all pages  
✅ No console errors, no duplicate event listeners  
✅ Mobile tap works on iOS/Android  
