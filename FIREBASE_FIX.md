# 🚨 URGENT: Firebase Permissions Fix

If you're getting **"Missing or insufficient permissions"** error when adding entries, follow these steps:

## Quick Fix Steps:

### 1. Go to Firebase Console
- Visit [Firebase Console](https://console.firebase.google.com/)
- Select your project: `pegion-tracker`

### 2. Update Firestore Rules
- Click on **"Firestore Database"**
- Go to **"Rules"** tab
- Replace the existing rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

### 3. Publish the Rules
- Click **"Publish"** button
- Wait for the rules to deploy (usually takes a few seconds)

### 4. Test the Application
- Refresh your web application
- Try adding a new entry
- The error should be resolved

## Why This Happens:
- Firebase Firestore has security rules that block unauthorized access
- Since we're using simple password authentication (not Firebase Auth), we need to allow all users to write
- This is safe for your private application but should be secured for public use

## Alternative Solution:
If you prefer not to change Firebase rules, you can use the application in **offline mode**:
- The app will automatically fall back to localStorage
- All data will be saved locally in your browser
- No internet connection required for basic functionality

---
**Need Help?** Check the main `FIREBASE_SETUP.md` file for complete setup instructions.