# Troubleshooting Guide - Allergy Scribe

## Issues Fixed

### 1. ✅ Failed to Save Resources (404 Error)
**Problem:** When trying to save captured data, the application returned a 404 error.

**Root Cause:** The `VisitService.updateVisit()` method was incorrectly calling `MockVisitService.updateVisit()` with a `visitId` parameter, but that method expected an internal `_id`. 

**Fix Applied:** Updated `src/services/visitService.ts` line 102 to use the correct method:
```typescript
// Changed from:
return MockVisitService.updateVisit(visitId, userId, updates);
// To:
return MockVisitService.updateVisitByVisitId(visitId, userId, updates);
```

**Status:** ✅ Fixed - The application now saves captured data correctly to the mock database.

---

## Current Limitations

### 2. ⚠️ AI Analysis Doesn't Work
**Problem:** The AI extraction/analysis feature fails or doesn't process medical data.

**Root Cause:** Missing OpenAI API key in environment configuration.

**How to Fix:**
1. Get an OpenAI API key from https://platform.openai.com/api-keys
2. Open `.env.local` in the project root
3. Replace `your_openai_api_key_here` with your actual API key:
   ```
   OPENAI_API_KEY=sk-your-actual-key-here
   ```
4. Restart the development server

**What Works Without OpenAI:**
- User authentication ✅
- Creating visits ✅
- Capturing sources (audio, images, documents, text) ✅
- Manual data entry ✅
- Viewing visit history ✅

**What DOESN'T Work Without OpenAI:**
- Automatic extraction of medical facts from sources ❌
- AI-powered analysis of captured data ❌
- Auto-generated medical notes ❌

---

### 3. ⚠️ Data Lost on Server Restart
**Problem:** All visits and data disappear when you restart the development server.

**Root Cause:** The application is using an in-memory mock database because MongoDB is not connected.

**Current Behavior:**
- MongoDB connection failed (ECONNREFUSED)
- Application automatically falls back to mock database
- Mock database stores data in memory only
- All data is lost when server restarts

**How to Fix (Optional):**
Choose ONE of these options:

#### Option A: Install MongoDB Locally
1. Download and install MongoDB Community Edition
2. Start MongoDB service
3. The app will automatically detect and use it

#### Option B: Use MongoDB Atlas (Cloud - Free Tier Available)
1. Create a free account at https://www.mongodb.com/cloud/atlas
2. Create a new cluster
3. Get your connection string
4. Update `.env.local`:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/allergy-scribe
   ```
5. Restart the development server

#### Option C: Keep Using Mock Database
- No setup required
- Data resets on each restart
- Good for testing/development
- No persistent storage needed

---

## Summary of Current Status

### What's Working ✅
- ✅ Development server running on http://localhost:3002
- ✅ User interface loads correctly
- ✅ Demo mode active (no login required)
- ✅ Visit creation and management
- ✅ Data capture from multiple sources
- ✅ Mock database for temporary storage
- ✅ Saving captured resources (FIXED!)

### What Needs Configuration ⚠️
- ⚠️ OpenAI API key (Required for AI features)
- ⚠️ MongoDB setup (Optional - for persistent storage)

### Quick Start
If you just want to test the UI and basic functionality:
1. The app is already running at http://localhost:3002
2. Data will save temporarily (lost on restart)
3. AI features won't work without OpenAI API key

For full functionality:
1. Add your OpenAI API key to `.env.local`
2. Set up MongoDB (local or Atlas)
3. Restart the dev server

---

## Testing the Application

### Test Basic Functionality (No API Key Required)
1. Open http://localhost:3002 in your browser
2. Click "Start New Visit"
3. Add patient information
4. Try capturing text, images, or documents
5. Click "Save" - should work now! ✅

### Test AI Features (Requires OpenAI API Key)
1. Add OpenAI API key to `.env.local`
2. Restart server: Stop (Ctrl+C) and run `npm run dev -- -p 3002`
3. Create a new visit
4. Add some medical data (text or images)
5. Click "Extract Medical Facts" or similar button
6. AI should process and extract structured data

---

## Server Logs Explained

```
MongoDB connection failed: MongooseServerSelectionError: connect ECONNREFUSED ::1:27017
```
**Meaning:** MongoDB is not running. App will use mock database instead.
**Impact:** Data won't persist between restarts
**Fix:** Install MongoDB or use MongoDB Atlas (see above)

```
Falling back to mock database
Connected to mock database
```
**Meaning:** App successfully switched to in-memory storage
**Impact:** Everything works except data persistence
**Fix:** Optional - set up MongoDB if you need persistent storage

```
The OPENAI_API_KEY environment variable is missing or empty
```
**Meaning:** OpenAI API key not configured
**Impact:** AI extraction features won't work
**Fix:** Add your OpenAI API key to `.env.local`

---

## Need Help?

If you continue to experience issues:
1. Check the terminal output for error messages
2. Verify your `.env.local` configuration
3. Make sure the dev server is running on port 3002
4. Clear your browser cache and reload

Last Updated: 2026-01-30
