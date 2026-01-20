# Quick Setup Guide

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Firebase Configuration

1. Go to https://console.firebase.google.com/
2. Create a new project
3. Enable **Authentication** → **Sign-in method** → Enable **Email/Password**
4. Create a **Firestore Database** (start in test mode for development)
5. Copy your Firebase config from Project Settings → General → Your apps

## Step 3: Cloudinary Configuration

1. Go to https://cloudinary.com/
2. Sign up for a free account
3. Go to Dashboard and copy:
   - Cloud Name
   - API Key
   - API Secret

## Step 4: Create Environment File

Create `.env.local` in the root directory:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## Step 5: Create First Admin User

You need to create your first admin user. You can do this by:

1. Using Firebase Console → Authentication → Add user manually
2. Then go to Firestore → `users` collection → Add document with:
   - `email`: the email you created
   - `name`: Admin Name
   - `role`: "admin"
   - `createdAt`: Timestamp (current time)

Or use Firebase Admin SDK to create users programmatically.

## Step 6: Run the Application

```bash
npm run dev
```

Visit http://localhost:3000 and login with your admin credentials.

## Important Notes

- **HTTPS Required**: Camera and location features require HTTPS in production (localhost works for development)
- **Firestore Rules**: Make sure to set up proper security rules in Firebase Console
- **Cloudinary**: Free tier includes 25GB storage and 25GB bandwidth per month

## Firestore Security Rules (Development)

For development, you can use these rules (update for production):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Next Steps

1. Login as admin
2. Create employees (sellers, foremen, etc.)
3. Test the workflow:
   - Seller creates a contract
   - Foreman selects contract and creates project
   - Foreman sends reports and warnings
   - Admin/Director views reports and warnings

