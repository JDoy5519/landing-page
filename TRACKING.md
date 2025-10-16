# Meta Pixel + CAPI Integration

This document describes the Meta Pixel and Conversions API (CAPI) integration with Make webhook pass-through architecture.

## Environment Variables

Set these in your Netlify environment:

- **META_PIXEL_ID** (string): Your Meta Pixel ID (8+ digits)
- **MAKE_CAPI_WEBHOOK_URL** (string): Make.com webhook URL for CAPI forwarding
- **FBCAPTURE_DEBUG** (string): Set to "true" for debug logging, "false" for production

## Architecture

### Pixel Layer (`assets/js/pixel.js`)
- **Singleton Pattern**: `window.VLM_PIXEL` with exposed `_state` for debugging
- **Idempotent Initialization**: Guards prevent double initialization across page loads
- **Consent Management**: Only loads when `localStorage.vlm_consent === 'accepted'`
- **Lead Deduplication**: Sets `sessionStorage.lead_fired = 'true'` on Lead events

### CAPI Layer (`assets/js/capi.js`)
- **Make Pass-Through**: Builds complete CAPI JSON payload in browser
- **Auto-Detection**: Automatically includes `_fbp` cookie and builds `fbc` from `fbclid`
- **Standard Format**: Returns exact CAPI JSON that Make forwards 1:1 to Meta
- **No Server Processing**: Make webhook receives pre-built payload

## Code Location

- **assets/js/pixel.js**: Meta Pixel singleton with deduplication
- **assets/js/capi.js**: CAPI payload builder for Make webhook
- **iva/index.html**: Main landing page (lines 1065: init, 1086: Lead, 1114: fallback)
- **thankyou.html**: Thank you page (lines 64: init, 72: Lead)
- **iva/script.js**: Legacy script with VLM_PIXEL wrapper (line 1045: Lead)

## How It Works

### 1. **Pixel Initialization** (Once Per Page)
```javascript
VLM_PIXEL.init('{{ META_PIXEL_ID }}');
```
- Validates pixel ID (8+ digits)
- Checks consent status
- Injects fbevents.js only if not present
- Calls `fbq('init', pixelId)` and `fbq('track', 'PageView')` once
- Sets `window.__VLM_FB_INITED = true` to prevent duplicates

### 2. **Event Tracking**
```javascript
VLM_PIXEL.track('ViewContent', { content_category: 'IVA' });
VLM_PIXEL.track('Lead', { content_category: 'IVA' }, eventId);
```
- ViewContent: Fires on page load
- Lead: Fires on form submission with event ID for deduplication

### 3. **CAPI Integration**
```javascript
VLM_CAPI.sendLeadToMake('{{ MAKE_CAPI_WEBHOOK_URL }}', {
  eventId,
  sourceUrl: location.href,
  extraUserData: {}
});
```
- Builds complete CAPI JSON payload
- Includes `_fbp` cookie, `fbc` from fbclid, user agent
- Sends to Make webhook for 1:1 forwarding to Meta

## Deduplication Mechanisms

### Multi-Layer Protection:
1. **Pixel Level**: `window.__VLM_FB_INITED` prevents double pixel initialization
2. **Session Level**: `sessionStorage.lead_fired` prevents duplicate Lead events
3. **Event ID Level**: Consistent UUIDs ensure Meta-side deduplication
4. **Consent Level**: All tracking respects `vlm_consent` status

### Lead Event Sources (in execution order):
1. **Form Submit** (iva/index.html:1086) - Primary source
2. **Modal Fallback** (iva/index.html:1114) - If form tracking failed
3. **Thankyou Fallback** (thankyou.html:72) - If user navigates to thankyou page
4. **Legacy Script** (iva/script.js:1045) - Uses VLM_PIXEL wrapper

## CAPI Payload Structure

The browser builds this exact JSON for Make webhook:

```json
{
  "data": [{
    "event_name": "Lead",
    "event_time": 1703123456,
    "action_source": "website",
    "event_id": "550e8400-e29b-41d4-a716-446655440000",
    "event_source_url": "https://example.com/iva/",
    "user_data": {
      "fbp": "fb.1.1703123456789.AbCdEfGhIjKlMnOp",
      "fbc": "fb.1.1703123456.AbCdEfGhIjKlMnOp",
      "client_user_agent": "Mozilla/5.0..."
    }
  }]
}
```

**Make Integration**: This JSON is forwarded 1:1 to Meta's CAPI endpoint. No server-side processing required.

## Testing

### Pixel Helper
1. Install Meta Pixel Helper Chrome extension
2. Visit `/iva/` with consent accepted
3. Verify exactly one PageView and one ViewContent event
4. Submit form and verify exactly one Lead event

### Make Integration
1. Test Make scenario with "Run once" feature
2. Verify webhook receives complete CAPI JSON payload
3. Check Meta Events Manager for proper event delivery

### Debug Mode
Set `FBCAPTURE_DEBUG="true"` for console logs:
- `[PIXEL]` messages for pixel events
- `[CAPI]` messages for webhook requests
- `window.__VLM_STATE` exposed for debugging

### UTM Testing
Test with UTM parameters: `?utm_source=meta&utm_medium=cpc&utm_campaign=iva_launch`

## Event Flow

1. **Page Load**: 
   - Pixel initialization (once per page)
   - ViewContent event (if consent accepted)

2. **Form Submit**: 
   - Generate event ID
   - Track Lead event (Pixel)
   - Send CAPI payload (Make webhook)
   - Set `lead_fired` flag

3. **Fallback Mechanisms** (only if primary failed):
   - Check `lead_fired` flag first
   - Reuse existing event ID or generate new one
   - Track Lead event + send CAPI payload

## Build Process

Environment variables injected at build time via `netlify.toml`:
- Replaces `{{ META_PIXEL_ID }}` with actual pixel ID
- Replaces `{{ MAKE_CAPI_WEBHOOK_URL }}` with webhook URL
- Replaces `{{ FBCAPTURE_DEBUG }}` with debug setting

## Troubleshooting

### Common Issues:
- **Pixel not loading**: Check consent status and debug logs
- **Events not firing**: Verify pixel ID format (8+ digits) and consent
- **CAPI issues**: Check Make webhook URL and scenario status
- **Deduplication problems**: Verify event ID consistency

### Debug Steps:
1. Check browser console for `[PIXEL]` and `[CAPI]` debug messages
2. Verify `window.__VLM_STATE` shows `loaded: true`
3. Check `sessionStorage.getItem('lead_fired')` in dev tools
4. Use Meta Pixel Helper to verify no duplicate events
5. Check Make webhook logs for CAPI payload receipt

### Verification Checklist:
- [ ] Only one PageView event per page load
- [ ] Only one ViewContent event per page load  
- [ ] Only one Lead event per form submission
- [ ] Same event ID used for Pixel and CAPI
- [ ] Make webhook receives complete CAPI JSON
- [ ] No direct `fbq()` calls outside VLM_PIXEL wrapper
- [ ] All Lead tracking respects session deduplication

## Make Webhook Configuration

The Make webhook should:
1. Receive the complete CAPI JSON payload
2. Forward it 1:1 to Meta's CAPI endpoint
3. Include proper authentication headers
4. Handle response logging for debugging

**No server-side processing required** - the browser builds the complete payload.