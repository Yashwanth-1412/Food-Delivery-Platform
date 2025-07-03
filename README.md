# Food Delivery Platform

A full-stack food delivery application with role-based access control, featuring customer ordering, restaurant management, delivery agent tracking, and admin dashboard.

## 🚀 Quick Start

```bash
git clone <https://github.com/Yashwanth-1412/food-delivery2/>
cd food-delivery2
```

## 📋 Prerequisites

Before installation, ensure you have:

- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **Python** (3.8 or higher) - [Download here](https://python.org/)
- **Git** - [Download here](https://git-scm.com/)
- **Firebase Account** - [Create here](https://console.firebase.google.com/)
- **Cashfree Account** (for payments) - [Sign up here](https://www.cashfree.com/)

## 🔧 Installation Guide

### Step 1: Clone and Setup Project Structure

```bash
# Clone the repository
git clone <https://github.com/Yashwanth-1412/food-delivery2/>
cd food-delivery2

# Verify project structure
ls -la
# Should show: frontend/, backend/, README.md, .gitignore
```

### Step 2: Firebase Setup

#### 2.1 Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name: `food-delivery-app`
4. Disable Google Analytics (optional)
5. Create project

#### 2.2 Enable Authentication
1. Go to **Authentication > Sign-in method**
2. Enable **Email/Password**
3. Enable **Google** (optional)

#### 2.3 Create Firestore Database
1. Go to **Firestore Database**
2. Click "Create database"
3. Start in **test mode**
4. Choose your preferred region

#### 2.4 Get Firebase Configuration
1. Go to **Project Settings > General**
2. Scroll to "Your apps"
3. Click **Web icon** `</>`
4. Register app name: `food-delivery-frontend`
5. Copy the configuration object

#### 2.5 Download Service Account Key
1. Go to **Project Settings > Service accounts**
2. Click "Generate new private key"
3. Download the JSON file
4. Rename it to `firebase-config.json`
5. Place it in the `backend/` directory

### Step 3: Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create environment file
cp .env.example .env  # Or create manually
```

#### 3.1 Configure Backend Environment

Create `backend/.env` file:

```env
# Flask Configuration
FLASK_ENV=development
FLASK_DEBUG=True

# Cashfree Payment Gateway (Get from Cashfree Dashboard)
CASHFREE_APP_ID=your_cashfree_app_id
CASHFREE_SECRET_KEY=your_cashfree_secret_key
CASHFREE_API_VERSION=2025-01-01
CASHFREE_BASE_URL=https://sandbox.cashfree.com/pg

# Firebase Admin SDK
# No environment variables needed - uses firebase-config.json

# Security
SECRET_KEY=your-super-secret-key-here
```

#### 3.2 Place Firebase Config
- Move your downloaded `firebase-config.json` to `backend/` directory
- Ensure it's in the same folder as `app.py`

### Step 4: Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Create environment file
touch .env  # Linux/Mac
# Or create manually on Windows
```

#### 4.1 Configure Frontend Environment

Create `frontend/.env` file:

```env
# API Configuration
VITE_API_URL=http://localhost:5000/api

# Firebase Configuration (from your Firebase project settings)
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456
```

### Step 5: Database Initialization

The application uses Firestore and will automatically create collections on first use. No additional database setup required.

## 🚦 Running the Application

### Start Backend Server

```bash
cd backend

# Activate virtual environment (if not already active)
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Start the server
python app.py
```

Backend will be available at: `http://localhost:5000`

### Start Frontend Server

```bash
cd frontend

# Start development server
npm run dev
```

Frontend will be available at: `http://localhost:5173`

## 👥 User Roles & Access

The application supports 4 user roles:

### 🛒 Customer
- Browse restaurants and menus
- Place and track orders
- Manage delivery addresses
- Save favorite restaurants

### 🏪 Restaurant
- Manage restaurant profile
- Create and edit menu items
- Process incoming orders
- View analytics and reports

### 🚚 Delivery Agent
- View available delivery orders
- Accept and complete deliveries
- Track earnings and history
- Update delivery status

### 👨‍💼 Admin
- Manage all users and restaurants
- View system analytics
- Configure platform settings
- Monitor system health

## 🔑 First Time Setup

1. **Create Admin User:**
   - Register through the frontend
   - Manually assign admin role in Firestore:
     ```json
     // In collection: user_roles
     {
       "uid": "your-firebase-uid",
       "role": "admin",
       "created_at": "timestamp",
       "permissions": ["all"]
     }
     ```

2. **Test the System:**
   - Login as admin
   - Create test restaurant
   - Create test customer
   - Place a test order

## 🛠️ Development Commands

### Frontend Commands
```bash
cd frontend

# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

### Backend Commands
```bash
cd backend

# Development server with auto-reload
python app.py

# Run with specific environment
FLASK_ENV=development python app.py

# Install new dependencies
pip install package-name
pip freeze > requirements.txt
```

## 📁 Project Structure

```
food-delivery2/
├── frontend/                 # React + Vite frontend
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── services/        # API services
│   │   ├── firebase/        # Firebase configuration
│   │   └── App.jsx          # Main app component
│   ├── public/              # Static assets
│   └── package.json         # Dependencies
├── backend/                 # Flask backend
│   ├── routes/              # API route handlers
│   ├── services/            # Business logic
│   ├── middleware/          # Authentication middleware
│   ├── config/              # Configuration files
│   ├── app.py               # Main application
│   └── requirements.txt     # Python dependencies
├── firebase-config.json     # Firebase service account (backend only)
└── README.md               # This file
```

## 🔒 Security Features

- ✅ Environment variables for sensitive data
- ✅ Firebase Authentication
- ✅ Role-based access control
- ✅ API token validation
- ✅ CORS protection
- ✅ Input validation
- ✅ Secure payment processing

## 🚨 Troubleshooting

### Common Issues

#### Firebase Connection Error
```bash
❌ firebase-config.json not found!
```
**Solution:** Ensure `firebase-config.json` is in the `backend/` directory

#### Port Already in Use
```bash
Address already in use
```
**Solution:** 
```bash
# Kill process on port 5000 (backend)
npx kill-port 5000

# Kill process on port 5173 (frontend)  
npx kill-port 5173
```

#### Environment Variables Not Loading
**Solution:** Ensure `.env` files are in correct directories and restart servers

#### CORS Errors
**Solution:** Verify `VITE_API_URL` in frontend `.env` matches backend URL

#### Payment Gateway Issues
**Solution:** 
1. Verify Cashfree credentials in backend `.env`
2. Ensure you're using sandbox/production URLs correctly
3. Check Cashfree dashboard for API key status

### Getting Help

1. Check the error logs in terminal
2. Verify all environment variables are set
3. Ensure all dependencies are installed
4. Check Firebase project settings


## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit pull request

## 📄 License

This project is licensed under the MIT License.

## 💡 Features

- 🔐 **Authentication:** Firebase Auth with role-based access
- 🍕 **Restaurant Management:** Menu creation, order processing
- 🛒 **Customer Portal:** Browse, order, track deliveries
- 🚚 **Delivery Tracking:** Real-time order tracking
- 💳 **Payments:** Integrated Cashfree payment gateway
- 📊 **Analytics:** Comprehensive dashboards and reports
- 📱 **Responsive:** Works on desktop and mobile
- ⚡ **Real-time:** Live updates using Firebase

## 🚀 Tech Stack

**Frontend:**
- React 19 + Vite
- Tailwind CSS v4
- Firebase SDK
- Axios for API calls

**Backend:**
- Python Flask
- Firebase Admin SDK
- Cashfree Payment Gateway
- Flask-CORS

**Database:**
- Firebase Firestore

**Authentication:**
- Firebase Authentication

---

Made with ❤️ for the food delivery community
