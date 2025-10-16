# 📱 **MOBILE-FIRST LEAD-GEN TEST PLAN**

## **Test Environment Setup**

### **Required Devices & Browsers**
- **iPhone SE (375px)** - Chrome, Safari
- **iPhone 13 Pro (390px)** - Chrome, Safari  
- **Pixel 6 (412px)** - Chrome, Edge
- **iPad (768px)** - Chrome, Safari
- **Desktop (1440px)** - Chrome, Safari, Edge

### **Testing Tools**
- Chrome DevTools Device Simulation
- Lighthouse Performance Audit
- WAVE Accessibility Checker
- Color Contrast Analyzer

---

## **🧪 CRITICAL TEST SCENARIOS**

### **1. Cold Load Performance**
**Test Steps:**
1. Clear browser cache and cookies
2. Navigate to https://visiblelegal.co.uk/
3. Measure Core Web Vitals:
   - **LCP** (Largest Contentful Paint) < 2.5s
   - **FID** (First Input Delay) < 100ms  
   - **CLS** (Cumulative Layout Shift) < 0.1

**Expected Results:**
- ✅ Hero image loads without layout shift
- ✅ Fonts load without FOUT
- ✅ Cookie banner appears within 1s
- ✅ All tap targets ≥44px

### **2. Cookie Consent Flow**
**Test Steps:**
1. Fresh page load
2. Cookie banner should appear
3. Test both "Accept" and "Reject" buttons
4. Verify GA4 tracking behavior
5. Test "Manage Cookie Settings" link

**Expected Results:**
- ✅ Banner appears on first visit only
- ✅ Choice persists across page reloads
- ✅ Analytics only load after "Accept"
- ✅ Banner accessible via keyboard navigation

### **3. Modal Interactions**
**Test Steps:**
1. Click Privacy Policy link (footer)
2. Verify modal opens with content
3. Test ESC key and outside click to close
4. Test keyboard navigation within modal
5. Repeat for Terms and Cookie Policy

**Expected Results:**
- ✅ Content loads dynamically
- ✅ Focus trapped within modal
- ✅ Scrollable on mobile devices
- ✅ Close button ≥44px tap target

### **4. Lead Capture Form**
**Test Steps:**
1. Navigate to #register section
2. Fill form with valid data:
   - Name: "John Smith"
   - Email: "john@example.com"  
   - Phone: "07123 456789"
   - Claim Type: "IVA"
3. Test form validation with invalid data
4. Submit form and verify success state

**Expected Results:**
- ✅ Real-time validation feedback
- ✅ IVA reference field shows/hides correctly
- ✅ Honeypot prevents bot submissions
- ✅ Success message displays clearly
- ✅ No double-submission possible

### **5. Coming Soon Modal**
**Test Steps:**
1. Click "Car Finance Claim" or "Business Energy Claim"
2. Modal should open with options
3. Click claim type button
4. Should close modal and scroll to form
5. Verify claim type pre-selected

**Expected Results:**
- ✅ Modal centers on all screen sizes
- ✅ Claim type auto-populates in form
- ✅ Smooth scroll to form section
- ✅ Focus moves to first form field

### **6. Navigation & Back/Forward**
**Test Steps:**
1. Navigate through all pages:
   - Main page → Privacy Policy → Terms → Cookies
2. Use browser back/forward buttons
3. Test deep linking to sections (#register, #services)
4. Test sticky header behavior on scroll

**Expected Results:**
- ✅ All links work correctly
- ✅ Back/forward maintains state
- ✅ Deep links scroll to correct sections
- ✅ Header shrinks on scroll

### **7. Offline Behavior**
**Test Steps:**
1. Load page completely
2. Disconnect network
3. Try to submit form
4. Try to navigate to other pages

**Expected Results:**
- ✅ Clear error message for form submission
- ✅ Cached pages still accessible
- ✅ Graceful degradation

---

## **📊 PERFORMANCE BENCHMARKS**

### **Mobile Performance Targets**
- **Lighthouse Score:** ≥90
- **Page Load Time:** <3s on 3G
- **Time to Interactive:** <5s
- **Bundle Size:** <500KB total

### **Accessibility Targets**
- **WCAG 2.1 AA Compliance**
- **Color Contrast:** ≥4.5:1 for normal text
- **Keyboard Navigation:** All interactive elements
- **Screen Reader:** Proper ARIA labels

---

## **🐛 COMMON ISSUES TO CHECK**

### **Mobile-Specific**
- [ ] Horizontal scrolling on narrow screens
- [ ] Touch targets too small (<44px)
- [ ] Text too small to read comfortably
- [ ] Buttons overlap or misalign
- [ ] Modal doesn't fit viewport

### **Form Issues**
- [ ] Validation errors not visible
- [ ] Success state unclear
- [ ] Double submission possible
- [ ] Bot protection bypassed
- [ ] Required fields not marked

### **Performance Issues**
- [ ] Images cause layout shift
- [ ] Fonts cause text flash
- [ ] JavaScript blocks rendering
- [ ] Unused CSS/JS loaded
- [ ] No compression/caching

### **Accessibility Issues**
- [ ] Missing alt text on images
- [ ] Poor color contrast
- [ ] No focus indicators
- [ ] Broken keyboard navigation
- [ ] Missing ARIA labels

---

## **✅ SIGN-OFF CHECKLIST**

### **Before Go-Live**
- [ ] All test scenarios pass on target devices
- [ ] Lighthouse scores meet benchmarks
- [ ] WAVE accessibility scan clean
- [ ] Form submissions reach webhook correctly
- [ ] Analytics tracking verified
- [ ] Cookie consent legally compliant
- [ ] All links and CTAs functional
- [ ] Error handling graceful
- [ ] Loading states implemented
- [ ] SEO meta tags complete

### **Post-Launch Monitoring**
- [ ] Real User Metrics (RUM) tracking
- [ ] Form conversion rate monitoring
- [ ] Core Web Vitals in Search Console
- [ ] Error logging and alerts
- [ ] A/B testing setup for optimization

---

## **🚀 OPTIMIZATION OPPORTUNITIES**

### **Immediate (Week 1)**
1. Implement WebP images with fallbacks
2. Add service worker for offline support
3. Optimize font loading strategy
4. Compress and minify assets

### **Short-term (Month 1)**
1. A/B test form layouts
2. Add progressive form validation
3. Implement lazy loading for below-fold content
4. Add micro-interactions for better UX

### **Long-term (Quarter 1)**
1. Implement AMP versions for key pages
2. Add chatbot for lead qualification
3. Create video testimonials
4. Build comprehensive FAQ section

---

**Last Updated:** January 2025  
**Next Review:** February 2025
