# Cookie Banner Smoke Test

## Manual Testing Steps

### Test 1: Index Page (index.html)
1. Open `index.html` in browser
2. Clear localStorage: `localStorage.clear()` in console
3. Refresh page
4. **Expected**: Cookie banner appears at bottom with highest z-index
5. Click "Accept analytics" button
6. **Expected**: 
   - Banner disappears
   - Console shows: `[cookies] Accept button clicked`
   - Console shows: `[cookies] accepted analytics at [timestamp]`
   - Console shows: `[cookies] Banner hidden`
7. Refresh page
8. **Expected**: Banner stays hidden (consent persisted)

### Test 2: Cookie Policy Page (cookies/index.html)
1. Navigate to `/cookies/index.html`
2. Clear localStorage: `localStorage.clear()` in console
3. Refresh page
4. **Expected**: Cookie banner appears at bottom, clickable
5. Click "Reject analytics" button
6. **Expected**:
   - Banner disappears
   - Console shows: `[cookies] Reject button clicked`
   - Console shows: `[cookies] rejected analytics at [timestamp]`
   - Console shows: `[cookies] Banner hidden`
7. Click "Manage Cookie Settings" button in page content
8. **Expected**: Banner reappears
9. Click "Accept analytics"
10. **Expected**: Banner disappears, consent updated

### Test 3: Privacy Policy Page (privacy-policy/index.html)
1. Navigate to `/privacy-policy/index.html`
2. Clear localStorage: `localStorage.clear()` in console
3. Refresh page
4. **Expected**: Cookie banner appears and is clickable
5. Test accept/reject functionality as above

### Test 4: Mobile Testing
1. Open Chrome DevTools, switch to mobile view
2. Repeat tests above
3. **Expected**: Banner is properly sized and buttons are tappable
4. Test on actual mobile device if possible

### Test 5: Z-Index/Stacking Test
1. Open any page with cookie banner
2. Open a modal (Privacy Policy, Terms, etc.)
3. Clear localStorage to trigger banner
4. **Expected**: Cookie banner appears above modal
5. Banner buttons should be clickable even with modal open

## Console Debug Output

When working correctly, you should see:
```
[cookies] Banner shown
[cookies] Accept button clicked  // or Reject
[cookies] accepted analytics at 2025-01-02T...
[cookies] Banner hidden
```

## Troubleshooting

If buttons don't work:
1. Check console for errors
2. Verify button elements exist: `document.getElementById('acceptAnalytics')`
3. Check z-index: Cookie banner should have `z-index: 10002`
4. Verify no overlapping elements capture clicks

## Fixed Issues

1. **Z-Index**: Cookie banner now has `z-index: 10002` (above modals)
2. **Button Types**: Added `type="button"` to prevent form submission
3. **Duplicate Init**: Added guard to prevent multiple event listener binding
4. **Pointer Events**: Added `pointer-events: auto` to ensure clickability
5. **Error Handling**: Added console logging and error checking
6. **Event Prevention**: Added `e.preventDefault()` to button handlers
