# LegacyVault - Secure Digital Inheritance & Emergency Continuity Platform

LegacyVault is an API-driven, component-oriented secure inheritance platform allowing users to deposit confidential credentials, passwords, and private files. When prolonged user inactivity is detected, a verification flow triggers, permitting designated nominees to request access, subject to administrator approval.

---

## Technical Stack

* **Frontend:** React, React Router, Redux Toolkit, Axios, Tailwind CSS v4, Lucide Icons, Framer Motion.
* **Backend:** Node.js, Express.js (ES Modules), MongoDB, Mongoose, JWT, AES-256-GCM Encryption, Multer, Node-cron.
* **Email Service:** Axios calling Brevo (Sendinblue) SMTP API.

---

## Core Security Features

1. **AES-256-GCM Encryption:** All sensitive vault text and document files are encrypted in-memory before disk persistence. The initialization vector (IV) and authentication tag are stored with the encrypted data.
2. **Private File Storage:** Uploaded documents are saved under a non-public folder (`Backend/uploads/`) with hashed filenames.
3. **Controlled Asset Release:** Access requires validating a nominee mapping, asset assignment under active policy, trigger event, pending access request, and explicit administrator approval. Mass decryption or full vault dumps are strictly blocked.
4. **Platform Auditing:** All login/logout, CRUD, decrypts, and downloads log actor, action, resource, IP, and user-agent metadata in `AuditLog` collection.

---

## Directory Structure

```text
d:/LegacyVault/
├── Backend/
│   ├── uploads/               # Encrypted document files
│   ├── src/
│   │   ├── config/            # DB, env, and SMTP settings
│   │   ├── models/            # Mongoose schemas (User, Asset, etc.)
│   │   ├── services/          # Business & crypto logic (Encryption, Audit)
│   │   ├── middleware/        # Authenticate, authorize, multer, rate-limit
│   │   ├── controllers/       # Controller routing endpoints
│   │   ├── routes/            # REST API mappings
│   │   ├── jobs/              # node-cron inactivity pulse checker
│   │   ├── utils/             # Async and token helpers
│   │   └── server.js          # App bootstrapper
│   └── package.json
└── Frontend/
    ├── src/
    │   ├── app/               # Redux store configuration
    │   ├── services/          # apiClient Axios instances
    │   ├── features/          # Redux slices (auth, assets, admin)
    │   ├── layouts/           # Responsive navigation frames
    │   ├── components/common/ # Reusable UI components
    │   ├── pages/             # Auth, User, Nominee, and Admin panels
    │   ├── routes/            # Route guarding and mappings
    │   └── App.jsx            # Entry router bindings
    └── package.json
```

---

## Installation & Setup

### 1. Database Setup
Ensure you have a MongoDB instance active. Copy `Backend/.env.example` to `Backend/.env` and configure:
```env
MONGO_URI=mongodb+srv://your_username:your_password@cluster0.net/melodify
JWT_SECRET=your_secret_jwt_sign_key
ENCRYPTION_KEY=your_aes_32_character_encryption_key
PORT=5000
CLIENT_URL=http://localhost:5173
BREVO_API_KEY=your_brevo_key
MAIL_FROM=no-reply@legacyvault.com
MAIL_FROM_NAME=LegacyVault
```

### 2. Launch Backend Server
```bash
cd Backend
npm install
npm run dev
```
The server will run on `http://localhost:5000`.

### 3. Launch Frontend Client
```bash
cd Frontend
npm install
npm run dev
```
The web app will run on `http://localhost:5173`.

---

## End-to-End Test Runner

To execute the programmatic integration verification showing registering, asset encryption, nominee mapping, policy trigger, simulated inactivity, admin approval, and secure decryption:
```bash
cd Backend
node src/testFlow.js
```
This runs the full workflow in isolation and outputs logging details to verify compliance.
