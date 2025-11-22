# Feature Testing Guide - Step-by-Step

## **Quick Start**

1. Run the dev server:
   ```bash
   npm run dev
   ```

2. Open in browser: `http://localhost:5173` (or the URL shown)

3. Sign in or create an account (features require authentication)

---

## **Test 1: Noise Cancellation** 🎤

### **Steps:**
1. Navigate to **Video Recorder** section
2. Click the **Effects** button (wand icon)
3. Look for **"Noise Cancellation"** checkbox
4. ✅ Check the box to enable
5. Click **Start Recording**
6. Make loud background noises (tap desk, rustle papers)
7. Stop recording and playback

### **Expected Results:**
- ✅ Checkbox appears in effects panel
- ✅ Background noise reduced during recording
- ✅ Audio quality improved

### **Troubleshooting:**
- If "Not Supported" appears, try Chrome/Edge
- Ensure microphone permissions granted

---

## **Test 2: Emotion Detection** 😊

### **Steps:**
1. Navigate to **Video Recorder**
2. Ensure camera is enabled
3. Click **Start Recording**
4. Look at the **Coach Score panel** (top right)
5. Make different facial expressions:
   - Smile broadly (should detect "happy")
   - Neutral face
   - Look surprised
   - Frown
6. Watch the emotion update in real-time

### **Expected Results:**
- ✅ "Current Emotion" section appears in coach panel
- ✅ Shows emotion name (e.g., "happy")
- ✅ Shows confidence percentage (e.g., "85%")
- ✅ Shows approximate age and gender
- ✅ Emotion samples counter increases
- ✅ "AI Models Loaded" green checkmark appears

### **What You'll See:**
```
Current Emotion
happy                    85%
Age: ~30 | male

Emotion Samples: 15
✓ AI Models Loaded
```

### **Troubleshooting:**
- If "⏳ Loading Models..." persists, check console for errors
- Models load from CDN (may take 5-10 seconds first time)
- Ensure good lighting for face detection

---

## **Test 3: Background Removal** 🎭

### **Steps:**
1. Navigate to **Video Recorder**
2. Click **Effects** button
3. You'll see 4 background options:
   - **None** (default)
   - **Blur** (blurred background)
   - **Remove** (AI removes background - NEW!)
   - **Image** (custom background)

### **Test Each Option:**

#### **A. Blur Background:**
1. Click **"Blur"**
2. Start recording
3. Move around
4. Background should be blurred

#### **B. Remove Background (AI):**
1. Click **"Remove"**
2. Start recording
3. Background should turn transparent/black
4. Only your silhouette visible

#### **C. Custom Image:**
1. Click **"Image"**
2. Upload a background image
3. Start recording
4. You should appear in front of custom background

### **Expected Results:**
- ✅ All 4 buttons visible in effects panel
- ✅ Selected button highlighted
- ✅ Background effect applies during recording
- ✅ Real-time processing (slight delay is normal)

### **Performance Notes:**
- First use may be slower (model loading)
- 100-200ms latency is normal
- Works best with solid background behind you

---

## **Test 4: Contact Management** 📇

### **Steps:**

#### **A. Open Contact Manager:**
1. Navigate to **Email Composer**
2. Look for **"Contacts"** button (should be near email input)
3. Click **"Contacts"**
4. Modal should open

#### **B. Add Contact Manually:**
1. Click **"Add Contact"**
2. Fill in:
   - Email: `test@example.com`
   - First Name: `John`
   - Last Name: `Doe`
   - Company: `Test Corp`
   - Tags: `vip, lead`
3. Click **"Save"**
4. Contact should appear in list

#### **C. Test CSV Import:**
1. Create a test CSV file:
   ```csv
   email,first_name,last_name,company
   jane@example.com,Jane,Smith,ABC Inc
   bob@example.com,Bob,Johnson,XYZ Ltd
   ```
2. In Contact Manager, click **"Import CSV"**
3. Select your CSV file
4. Verify contacts imported

#### **D. Export Contacts:**
1. Click **"Export CSV"**
2. File should download
3. Open CSV to verify data

#### **E. Search and Filter:**
1. Type in search box
2. Contacts should filter in real-time

#### **F. Select for Email:**
1. Click **"Select"** on a contact
2. Modal should close
3. Email field should be populated

### **Expected Results:**
- ✅ Contact Manager modal opens
- ✅ Can add contacts manually
- ✅ CSV import works
- ✅ CSV export downloads
- ✅ Search filters correctly
- ✅ Contact selection populates email field
- ✅ Data persists in Supabase database

### **Database Check:**
Open Supabase dashboard and verify `contacts` table has your data.

---

## **Test 5: QR Code Generation** 📱

### **Steps:**
1. Record a video (or use existing)
2. Navigate to **Email Composer**
3. Enter a video URL in the message field (or leave default)
4. Look for **"QR Code"** button
5. Click **"QR Code"**
6. QR Code modal should appear

### **Expected Results:**
- ✅ QR Code displayed in modal
- ✅ Shows the URL below QR code
- ✅ **"Download QR Code"** button present
- ✅ **"Copy URL"** button present
- ✅ Click Download → PNG file downloads
- ✅ Click Copy → URL copied to clipboard

### **Test Scanning:**
1. Use phone camera or QR scanner app
2. Scan the QR code on screen
3. Should open the video URL

---

## **Test 6: Keyboard Shortcuts** ⌨️

### **Steps:**

#### **A. Show Help Modal:**
1. Press **`?`** key (Shift + /)
2. Keyboard shortcuts help modal should appear

#### **B. Test Save Shortcut:**
1. Make some changes in the app
2. Press **Ctrl + S** (or **Cmd + S** on Mac)
3. Should trigger save action

#### **C. View All Shortcuts:**
Check the help modal for these shortcuts:
- `?` - Show/hide shortcuts help
- `Ctrl/Cmd + S` - Save
- `Esc` - Close modals
- More shortcuts listed

### **Expected Results:**
- ✅ `?` key opens help modal
- ✅ Modal shows all available shortcuts
- ✅ Shortcuts are organized by category
- ✅ `Ctrl/Cmd + S` works
- ✅ `Esc` closes modals

---

## **Test 7: PWA (Progressive Web App)** 📱

### **Steps:**

#### **A. Check Service Worker:**
1. Open browser DevTools (F12)
2. Go to **Application** tab
3. Click **Service Workers** in sidebar
4. Should see service worker registered

#### **B. Test Offline Mode:**
1. With app open, go to **Network** tab in DevTools
2. Check **"Offline"** box
3. Refresh the page
4. App should still load (cached)

#### **C. Install as App:**

**On Desktop (Chrome/Edge):**
1. Look for install icon in address bar
2. Click install
3. App opens in standalone window

**On Mobile:**
1. Open in Chrome/Safari
2. Tap browser menu (3 dots)
3. Select "Add to Home Screen"
4. App icon appears on home screen

#### **D. Test Updates:**
1. Make changes to the code
2. Rebuild app
3. Refresh page
4. Should see update notification

### **Expected Results:**
- ✅ Service worker registered successfully
- ✅ App works offline
- ✅ Can install as standalone app
- ✅ Updates detected automatically

---

## **Database Tests** 🗄️

### **Verify Tables in Supabase:**

1. Go to Supabase dashboard
2. Navigate to **Table Editor**
3. Check these tables exist:
   - ✅ `contacts`
   - ✅ `video_analytics_enhanced`
   - ✅ `keyboard_shortcuts`

### **Test Row Level Security:**

1. Create contact as User A
2. Try to view as User B
3. Should NOT see User A's contacts (RLS working)

### **Check Data Persistence:**

1. Add contact
2. Refresh page
3. Contact should still be there

---

## **Performance Tests** ⚡

### **Check Loading Times:**

1. Open DevTools → Performance tab
2. Reload page
3. Check metrics:
   - Initial load: < 3 seconds
   - Time to Interactive: < 5 seconds

### **Check Memory Usage:**

1. DevTools → Memory tab
2. Take heap snapshot before recording
3. Record video with all effects
4. Take heap snapshot after
5. Memory should not continuously grow (no leaks)

---

## **Browser Console Checks** 🔍

### **Expected Messages:**

```javascript
// Good messages:
✓ Service worker registered
✓ PWA ready for offline use
✓ Emotion models loading...
✓ Emotion models loaded successfully

// No errors expected for:
- Noise cancellation
- Background removal
- Contact operations
- QR code generation
```

### **Check for Errors:**

1. Open DevTools Console (F12)
2. Filter by "Errors" (red)
3. Should see NO errors related to:
   - noiseCancellation
   - emotionDetection
   - backgroundRemoval
   - contactService
   - qrCodeService
   - keyboardShortcuts
   - pwaService

---

## **Integration Tests** 🔗

### **Test Complete Workflow:**

1. **Record a video:**
   - Enable noise cancellation ✅
   - Set background to "Remove" ✅
   - Start recording ✅
   - See emotion feedback ✅
   - Stop recording ✅

2. **Send via email:**
   - Go to Email Composer ✅
   - Open Contacts ✅
   - Select a contact ✅
   - Generate QR code ✅
   - Send email ✅

3. **Use shortcuts:**
   - Press `?` to see help ✅
   - Use `Ctrl+S` to save ✅
   - Press `Esc` to close ✅

---

## **Known Issues & Limitations** ⚠️

### **Emotion Detection:**
- Requires good lighting
- Models download from CDN (10-20MB first time)
- May take 5-10 seconds to load initially

### **Background Removal:**
- Best with solid background
- 100-200ms processing delay normal
- High CPU usage on older devices

### **Noise Cancellation:**
- Browser-based (not as strong as RNNoise)
- Works best on Chrome/Edge

### **PWA:**
- Requires HTTPS (or localhost)
- iOS Safari has limited support

---

## **Success Criteria** ✅

All features passing if:

- ✅ Noise cancellation checkbox appears and works
- ✅ Emotion detection shows in coach panel
- ✅ Background "Remove" option works
- ✅ Contacts can be added/imported/exported
- ✅ QR codes generate and download
- ✅ `?` key shows shortcuts help
- ✅ Service worker registered
- ✅ No console errors
- ✅ Data persists in Supabase
- ✅ App works offline

---

## **Quick Test Checklist** 📋

```
[ ] Noise cancellation checkbox visible
[ ] Noise cancellation applies to recording
[ ] Emotion detection shows in coach panel
[ ] Emotions change with facial expressions
[ ] Background blur works
[ ] Background remove works (NEW)
[ ] Contact manager opens
[ ] Can add contact manually
[ ] CSV import works
[ ] CSV export works
[ ] QR code generates
[ ] QR code downloads
[ ] Press ? shows shortcuts
[ ] Ctrl+S triggers save
[ ] Service worker registered (check DevTools)
[ ] App works offline (test in DevTools)
[ ] Data saves to Supabase
[ ] No console errors
```

---

## **Troubleshooting** 🔧

### **If emotion detection doesn't work:**
```bash
# Check if models are loading
# Open Console, should see:
"Loading emotion models..."
"Emotion models loaded"
```

### **If background removal fails:**
```bash
# TensorFlow.js requires WebGL
# Check: chrome://gpu
# Ensure WebGL enabled
```

### **If PWA doesn't install:**
- Ensure running on HTTPS or localhost
- Check manifest.json is accessible
- Clear cache and reload

### **If database operations fail:**
- Check Supabase connection in .env
- Verify RLS policies in Supabase dashboard
- Check browser console for auth errors

---

## **Next Steps After Testing** 🚀

1. **If all tests pass:** Deploy to production!
2. **If issues found:** Check console for specific errors
3. **Optional enhancements:**
   - Add OCR integration (~30 min)
   - Add analytics dashboard trigger (~10 min)

---

**Happy Testing!** 🎉

For issues, check console errors and refer to service files for implementation details.
