# Three Targeted Fixes - Test Guide

## Fix 1: IVA Links Point to Internal Page

### Manual Test Steps:
1. **Index Page Test**:
   - Open `index.html`
   - Click header "Start Your Claim ▼" → "IVA Claim"
   - **Expected**: Navigates to `./iva/` (internal page)
   - Click hero section "IVA Claim" button
   - **Expected**: Navigates to `./iva/` (internal page)

2. **Modal Test**:
   - Open "Coming Soon" modal from any Car Finance/Business Energy link
   - Click "Explore IVA claims now" button
   - **Expected**: Navigates to `./iva/` (internal page)

3. **Subpage Test**:
   - Navigate to `/cookies/index.html`
   - Click header "IVA Claim" link
   - **Expected**: Navigates to `../iva/` (relative to cookies page)

4. **Console Check**:
   - Open browser console
   - Refresh any page
   - **Expected**: See `[config] Updated IVA link to internal path` (if any Netlify links were found)

### Acceptance:
- ✅ No external Netlify URLs remain
- ✅ All IVA links point to internal `./iva/` or `../iva/`
- ✅ Links work from all pages (index, cookies, terms, privacy)
- ✅ No 404 errors

---

## Fix 2: Cookie Banner State Machine

### Manual Test Steps:

#### Test A: Fresh State (No Prior Consent)
1. Clear localStorage: `localStorage.clear()` in console
2. Refresh any page
3. **Expected**: Cookie banner appears at bottom
4. **Expected**: Console shows `[cookies] Current consent state: unset`
5. **Expected**: Console shows `[cookies] No prior choice → show banner`

#### Test B: Accept Flow
1. Click "Accept analytics" button
2. **Expected**: Banner disappears immediately
3. **Expected**: Console shows `[cookies] Accept button clicked`
4. **Expected**: Console shows `[cookies] Consent state set to: accepted`
5. Refresh page
6. **Expected**: Banner stays hidden
7. **Expected**: Console shows `[cookies] Prior acceptance found → grant analytics & config`

#### Test C: Reject Flow
1. Clear localStorage: `localStorage.clear()`
2. Refresh page
3. Click "Reject analytics" button
4. **Expected**: Banner disappears immediately
5. **Expected**: Console shows `[cookies] Reject button clicked`
6. **Expected**: Console shows `[cookies] Consent state set to: rejected`
7. Refresh page
8. **Expected**: Banner stays hidden
9. **Expected**: Console shows `[cookies] Prior rejection found → keep analytics denied`

#### Test D: Manage Cookie Settings (cookies.html)
1. Navigate to `/cookies/index.html`
2. Set consent state: `localStorage.setItem('vlm_consent', 'accepted')`
3. Refresh page - banner should be hidden
4. Click "Manage Cookie Settings" button in page content
5. **Expected**: Banner appears immediately
6. **Expected**: Console shows `[cookies] Manage settings clicked - showing banner`
7. Click "Accept analytics"
8. **Expected**: Banner disappears and stays hidden on refresh

#### Test E: Mobile Tap Test
1. Open Chrome DevTools → mobile view
2. Clear localStorage and refresh
3. Tap "Accept analytics" or "Reject analytics"
4. **Expected**: Buttons respond to tap, banner disappears

### Acceptance:
- ✅ Banner appears only when consent is "unset"
- ✅ Accept/Reject immediately hides banner and persists choice
- ✅ "Manage Cookie Settings" always shows banner
- ✅ No duplicate banners in DOM
- ✅ Mobile tap works in Safari/Chrome
- ✅ No console errors

---

## Fix 3: Normalized Contact Emails

### Manual Test Steps:

#### Test A: Form Error Message
1. Open `index.html`
2. Fill out form with invalid data to trigger error
3. **Expected**: Error message shows `support@visiblelegal.co.uk`

#### Test B: Footer Links
1. Check footer on any page
2. Click contact email link
3. **Expected**: Opens mail client to `support@visiblelegal.co.uk`

#### Test C: Policy Pages
1. Open Privacy Policy (modal or standalone page)
2. Check all email links in content
3. **Expected**: All contact emails point to `support@visiblelegal.co.uk`
4. Repeat for Terms and Cookie Policy

#### Test D: Search Verification
Run in browser console:
```javascript
// Check for any remaining old email addresses
const allLinks = document.querySelectorAll('a[href*="mailto:"]');
const emails = Array.from(allLinks).map(a => a.href);
console.log('All email links:', emails);

// Should only show support@visiblelegal.co.uk and complaints@vlmclaims.co.uk
```

### Acceptance:
- ✅ All "Contact us" links point to `support@visiblelegal.co.uk`
- ✅ Form error messages use centralized email
- ✅ No stale email addresses remain (except complaints@vlmclaims.co.uk which is intentionally different)

---

## General Quality Checks

### Console Errors
- Open browser console on any page
- **Expected**: No JavaScript errors
- **Expected**: Cookie banner logging shows proper state transitions

### Mobile Testing
- Test all fixes on mobile Safari and Chrome
- **Expected**: All buttons/links work with touch
- **Expected**: Cookie banner is properly sized and clickable

### Cross-Page Navigation
- Test IVA links from different page depths (index, cookies/, privacy-policy/)
- **Expected**: All relative paths resolve correctly
- **Expected**: No 404 errors

---

## Debugging Commands

```javascript
// Check current consent state
localStorage.getItem('vlm_consent')

// Reset consent (force banner to show)
localStorage.removeItem('vlm_consent'); location.reload()

// Check IVA link configuration
console.log(SITE_CONFIG.routes.iva)

// Find all IVA links
document.querySelectorAll('a[href*="iva"]')

// Check for duplicate banners
document.querySelectorAll('#cookie-banner').length // Should be 1
```
