# Firebase Setup Guide for Pigeon Racing Tracker

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter project name: `pigeon-racing-tracker` (or your preferred name)
4. Enable Google Analytics (optional)
5. Click "Create project"

## Step 2: Enable Firestore Database

1. In your Firebase project console, click "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode" (for development) or "Start in production mode" (for production)
4. Select a location for your database (choose closest to your users)
5. Click "Done"

## Step 3: Get Firebase Configuration

1. In your Firebase project console, click the gear icon (⚙️) → "Project settings"
2. Scroll down to "Your apps" section
3. Click the web icon (`</>`) to add a web app
4. Enter app nickname: `pigeon-racing-web`
5. Check "Also set up Firebase Hosting" (optional)
6. Click "Register app"
7. Copy the Firebase configuration object

## Step 4: Firebase Configuration ✅ COMPLETED

✅ **Configuration Updated**: The `firebase-config.js` file has been configured with your Firebase project settings:

- **Project ID**: pegion-tracker
- **Auth Domain**: pegion-tracker.firebaseapp.com
- **Storage Bucket**: pegion-tracker.firebasestorage.app

Your Firebase configuration is ready to use!

## Step 5: Configure Firestore Security Rules

1. In Firebase Console, go to "Firestore Database" → "Rules"
2. For development/testing, use these rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write access to all documents for development
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

3. For production, use more restrictive rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read access to races
    match /races/{raceId} {
      allow read: if true;
      allow write: if request.auth != null; // Requires authentication
    }
  }
}
```

## Step 6: Test the Connection

1. Open your web application
2. Check the browser console for any Firebase connection messages
3. Look for the connection status indicator in the top-right corner
4. Try creating a new race to test database functionality

## Features Enabled with Firebase

✅ **Real-time Data Sync**: Changes appear instantly across all devices
✅ **Cloud Storage**: Data is safely stored in the cloud
✅ **Offline Support**: Works offline and syncs when connection returns
✅ **Multi-device Access**: Access your data from any device
✅ **Automatic Backups**: Firebase handles data backups
✅ **Scalability**: Handles growing amounts of data automatically

## Troubleshooting

### Connection Issues
- Check your internet connection
- Verify Firebase configuration values are correct
- Check browser console for error messages
- Ensure Firestore is enabled in Firebase Console

### Permission Errors
- Check Firestore security rules
- Ensure rules allow read/write access
- For production, implement proper authentication

### Data Not Syncing
- Check connection status indicator
- Verify Firebase project is active
- Check browser network tab for failed requests

## Fallback Mode

If Firebase is not configured or unavailable, the application automatically falls back to local storage mode:
- Data is stored in browser's local storage
- No real-time sync between devices
- Data persists only on the current device
- Perfect for offline use or development

## Optional: Enable Authentication

For production use, consider enabling Firebase Authentication:

1. In Firebase Console, go to "Authentication" → "Get started"
2. Choose sign-in methods (Email/Password, Google, etc.)
3. Update security rules to require authentication
4. Implement login/logout functionality in the app

## Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify all configuration steps were completed
3. Test with Firebase Console directly
4. Check Firebase status page for service issues

The application will work with or without Firebase - it automatically detects availability and provides appropriate functionality.