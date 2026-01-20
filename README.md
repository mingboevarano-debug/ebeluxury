# Repair Service Management System

A comprehensive web application for managing repair service operations with role-based access control.

## Features

- **Authentication**: Login/password system with Firebase Authentication
- **Role-Based Access**: Director, Admin, HR, Foreman, Seller
- **Contract Management**: Create and manage customer contracts
- **Project Management**: Assign and track repair projects with deadline timers
- **Reporting System**: Camera and location-based project reports with photo/video capture
- **Warning System**: Alert system for material/tool shortages
- **Employee Management**: Admin can create, edit, and delete employees

## Tech Stack

- **Frontend/Backend**: Next.js 14 (App Router)
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Media Storage**: Cloudinary
- **Styling**: Tailwind CSS
- **TypeScript**: Full type safety

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use an existing one
3. Enable Authentication with Email/Password provider
4. Create a Firestore database
5. Copy your Firebase configuration

### 3. Cloudinary Setup

1. Go to [Cloudinary](https://cloudinary.com/)
2. Sign up for a free account
3. Get your Cloud Name, API Key, and API Secret from the dashboard

### 4. Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 6. Create First Admin User

You'll need to create your first admin user manually through Firebase Console or by using Firebase Admin SDK. After that, you can use the Admin dashboard to create more users.

## User Roles and Permissions

### Admin
- Full system access
- Create, edit, and delete employees
- View all reports and warnings
- Manage all contracts and projects

### Director
- View all reports and warnings
- Monitor project progress
- View all contracts

### Seller
- Create contracts with customer information
- View contracts they created
- Contract includes: client name, surname, phone, location, price, deadline, description

### Foreman
- Select projects from available contracts
- Update project details (description, employee count, total workers)
- View deadline countdown timer
- Send reports with camera and location access
- Send warnings about material/tool shortages

### HR
- Human resources management (placeholder for future features)

## Project Workflow

1. **Seller** creates a contract with customer details
2. **Foreman** selects a contract to work on (creates a project)
3. **Foreman** updates project details and manages the project
4. **Foreman** can send reports with photos/videos and location
5. **Foreman** can send warnings about issues
6. **Admin** and **Director** can view all reports and warnings

## API Routes

- `/api/users` - User management (GET, POST, PUT, DELETE)
- `/api/contracts` - Contract management (GET, POST, PUT)
- `/api/projects` - Project management (GET, POST, PUT)
- `/api/reports` - Report management (GET, POST)
- `/api/warnings` - Warning management (GET, POST)
- `/api/upload` - Media upload to Cloudinary (POST)

## Security Notes

- All API routes check user authentication
- Role-based access control enforced on all routes
- Environment variables should never be committed to version control
- Use HTTPS in production

## Browser Requirements

- Modern browser with camera and geolocation API support
- HTTPS required for camera and location access (or localhost for development)

## Troubleshooting

- **Camera not working**: Ensure you're using HTTPS or localhost
- **Location not working**: Check browser permissions for geolocation
- **Firebase errors**: Verify your environment variables are correct
- **Cloudinary errors**: Check your API credentials

## License

This project is private and proprietary.

