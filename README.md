# Netaji Nagar Super League (NNSL) — Tournament Platform

A production-quality, responsive grassroots football tournament registration platform with real-time Firebase backend, player management, and secure admin dashboard.

---

## 1. Features

- **Public Football Tournament Website:**
  - Modern athletic dark aesthetic with stadium lighting and pitch markings
  - Two-step player registration journey:
    - **Step 1:** Enter verified player details (Full Name, Email, Phone, WhatsApp, and Position card selector)
    - **Step 2:** Tournament Overview, official fee cards, refund policy, and player details summary
  - Registration only writes to Firestore upon explicit user confirmation in Step 2
  - Duplicate registration protection (verifies email & phone against Firestore)
  - Non-sequential unique registration ID generation (`NNSL-XXXXXX`)
  - Instant copy registration ID & responsive success screen
  - Interactive FAQ accordions and contact details
  - **Zero emojis** — all visual iconography powered strictly by Lucide Icons

- **Administrative Dashboard (`/admin.html`):**
  - Protected by Firebase Authentication (Email/Password)
  - Live statistics calculated in real-time from Firestore (Total, Pending, Approved, Rejected, Withdrawn)
  - Squad tactical position breakdown (Goalkeeper, Defender, Midfielder, Forward, Utility)
  - Real-time search across Name, Email, Phone, and Registration ID
  - Multi-filtering by registration status and playing position
  - Desktop responsive table & mobile card view
  - Detailed player modal with direct call and WhatsApp messaging links
  - Contextual status workflow (Pending → Approve / Reject; Approved → Mark Withdrawn)
  - Custom accessible confirmation dialogs (no browser `alert` / `confirm`)
  - Private internal admin notes saved directly to Firestore
  - 1-click CSV export of player registrations (excluding internal notes for privacy)

---

## 2. Project Structure

```text
Netaji Nagar Super League/
├── index.html                 # Public tournament landing page & registration
├── admin.html                 # Protected admin management dashboard
├── firestore.rules            # Production Firestore security rules
├── README.md                  # Setup & deployment guide
├── assets/
│   └── favicon.svg            # Custom football tournament trophy SVG emblem
├── css/
│   ├── styles.css             # Main design system, sports theme, variables, responsiveness
│   └── admin.css              # Admin layout, statistics cards, tables, modal styles
└── js/
    ├── config.js              # Central tournament configuration (fees, dates, contacts)
    ├── firebase-config.js     # Firebase configuration settings
    ├── firebase-service.js    # Firebase Auth & Firestore database operations
    ├── utils.js               # Validation, phone formatting, toasts, modals, CSV export
    ├── registration.js        # Public page UX, form validation, duplicate check
    ├── admin-auth.js          # Admin login and session state
    └── admin-dashboard.js     # Real-time stats, filters, position bars, status management
```

---

## 3. Firebase Setup Guide

Follow these steps to connect your own Firebase project:

### Step 1: Create a Firebase Project
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add project**.
3. Name your project (e.g. `nnsl-tournament`) and complete the creation wizard (Google Analytics is optional).

### Step 2: Register a Web Application
1. On your Firebase project overview page, click the **Web icon (`</>`)**.
2. Enter an app nickname (e.g., `nnsl-web`).
3. Click **Register app**.
4. You will see a `firebaseConfig` object with your credentials. Copy these keys.

### Step 3: Configure Credentials in Code
The Firebase credentials for project `nnsl-6557d` are already configured in `js/firebase-config.js`:

```javascript
export const firebaseConfig = {
    apiKey: "AIzaSyBEt0cfhXScfwk8VukYUh5dBdj-XodDXWo",
    authDomain: "nnsl-6557d.firebaseapp.com",
    projectId: "nnsl-6557d",
    storageBucket: "nnsl-6557d.firebasestorage.app",
    messagingSenderId: "340949229001",
    appId: "1:340949229001:web:287d064c31de578a4f5c18"
};
```

### Step 4: Enable Cloud Firestore
1. In the Firebase console sidebar, navigate to **Build > Firestore Database**.
2. Click **Create database** (if not already created).
3. Select your location and choose **Start in production mode**.

### Step 5: Enable Google Sign-In in Firebase Authentication
1. In the Firebase console sidebar, navigate to **Build > Authentication**.
2. Under the **Sign-in method** tab:
   - Click **Google** > Enable the toggle > Select your project support email > Click **Save**.
   - (Optional) Enable **Email/Password** as a backup method.
3. Under **Authentication > Settings > Authorized domains**, ensure your local domain (`localhost`, `127.0.0.1`) and your production hosting domain are listed.

### Step 6: First-Login Admin Assignment
- Navigate to `admin.html`.
- Click **Sign In with Google**.
- **The very first account that signs in will automatically be registered as the Primary Administrator** in the Firestore `admins` collection. Subsequent logins will only be granted access if they are recognized as an authorized administrator.

### Step 7: Deploy Firestore Security Rules
1. In the Firebase console, go to **Firestore Database > Rules**.
2. Replace the editor contents with the rules found in [`firestore.rules`](./firestore.rules).
3. Click **Publish**.

*These security rules enforce:*
- Public visitors can only create a registration if all fields are valid, `status` is forced to `pending`, and `adminNotes` is empty.
- Public visitors **cannot** read player lists, read individual player details, or update existing records.
- Only authenticated administrators can read all registrations, change player status, add internal notes, or delete records.

---

## 4. Running Locally

Because the platform uses modern ES Modules (`type="module"`), it should be served via a local web server:

### Option A: VS Code Live Server
- Install the **Live Server** extension in VS Code.
- Right-click `index.html` and click **Open with Live Server**.

### Option B: Node.js `npx serve`
```bash
npx serve .
```
Then visit `http://localhost:3000`.

### Option C: Python 3 HTTP Server
```bash
python -m http.server 8000
```
Then visit `http://localhost:8000`.

---

## 5. Deployment Options

### Deploying to Firebase Hosting (Recommended)
1. Install Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```
2. Log in and initialize:
   ```bash
   firebase login
   firebase init
   ```
   - Select **Hosting** and **Firestore (rules)**.
   - Set public directory to `.` (or current directory).
   - Configure as single-page app: **No**.
3. Deploy:
   ```bash
   firebase deploy
   ```

### Deploying to GitHub Pages / Vercel / Netlify
This repository consists of vanilla HTML, CSS, and JavaScript. You can directly connect your Git repository to Vercel, Netlify, or enable GitHub Pages under repository settings.

---

## 6. Central Tournament Configuration

To modify tournament details without touching layout code, edit `js/config.js`:

```javascript
export const tournamentConfig = {
    name: "Netaji Nagar Super League",
    shortName: "NNSL",
    teams: 4,
    tournamentPeriod: "Late November – Early December",
    feeMin: 1800,
    feeMax: 2250,
    feeType: "Per Team",
    techPartner: {
        name: "VMC Tech India",
        website: "https://www.vmctechindia.in"
    }
};
```
