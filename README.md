# AI Realty Platform

Welcome to the **AI Realty Platform**—a modern, end-to-end real estate portal designed to simplify property matching and connect buyers with real estate subagents. The application features a dynamic, fully-featured user interface divided into targeted roles (Customer, Subagent, and Admin), complete with AI assistance and secure chat portals.

The repository is organized as a monorepo containing a **React + TypeScript + Vite** frontend at the root and an **Express + Node.js + Prisma (PostgreSQL)** backend in the `server` directory.

---

## 🚀 Key Features

The platform is designed around three distinct user personas, each with a dedicated dashboard:

### 1. Customer Portal
*   **Smart Property Search:** Filter and search properties with map location data, pricing, and details without losing layout context.
*   **Saved Properties:** Save favorite listings to track price and status changes.
*   **AI Real Estate Assistant:** Chat directly with an interactive AI bot to search for properties based on natural language preferences.
*   **Direct Messaging:** Contact dedicated subagents for specific properties. Features a unified chat portal that shows all your conversations in one place.

### 2. Subagent (Realtor) Portal
*   **Property Management:** Create, update (edit status/details), and archive/delete property listings.
*   **Lead Tracking:** View interested customers and click leads to open direct chat lines.
*   **KYC Verification:** Submit licensing credentials (license numbers, region, etc.) for admin review.
*   **Agent Profile Settings:** Directly edit profile details (name, email, phone) and securely update passwords.

### 3. Admin Portal
*   **Moderation Dashboard:** Review, approve, or reject new property listings before they go live.
*   **Subagent Onboarding:** Review submitted KYC documents and verify realtor profiles.
*   **Lead Visibility:** Oversee system-wide leads, tracking how customer inquiries are distributed.
*   **Chat Monitoring:** Audit chat transcripts between customers, subagents, and the AI helper for compliance.

---

## 🛠️ Technology Stack

*   **Frontend:** React 18, React Router v7, Vite, Tailwind CSS v4, Lucide Icons, Framer Motion, Radix UI primitives.
*   **Backend:** Node.js, Express, TypeScript, JWT (JSON Web Tokens) for authentication, Bcrypt for password security.
*   **Database & ORM:** PostgreSQL database with Prisma ORM.

---

## 📁 Repository Structure

```text
├── server/                     # Backend API & Database
│   ├── prisma/                 # Prisma Schema & Migrations
│   ├── src/
│   │   ├── routes/             # Express API Endpoints
│   │   ├── middlewares/        # Authentication & Role Guards
│   │   ├── db.ts               # Prisma Client Initializer
│   │   ├── index.ts            # Express App entry point
│   │   └── seed.ts             # Database seeding script
│   ├── tsconfig.json
│   └── package.json
│
├── src/                        # Frontend Application
│   ├── app/
│   │   ├── components/         # Shared UI components
│   │   ├── layouts/            # Sidebar Navigation & Layouts
│   │   ├── pages/              # Customer, Subagent, and Admin views
│   │   └── routes.tsx          # Client-side react-router routes
│   ├── assets/                 # Icons & Static Images
│   └── main.tsx
│
├── package.json                # Frontend/Root package
├── vite.config.ts              # Vite Bundler & Proxy Configuration
└── README.md
```

---

## 💻 Local Machine Setup Guide

Follow these steps to get both the frontend and backend running on your local machine.

### Prerequisites
Make sure you have the following installed on your machine:
*   [Node.js](https://nodejs.org/) (v18 or higher recommended)
*   [PostgreSQL](https://www.postgresql.org/) (running locally or hosted)

---

### Step 1: Clone & Install Dependencies

1. Clone this repository to your computer.
2. Open a terminal in the root directory of the project and install the frontend dependencies:
   ```bash
   npm install
   ```
3. Change directory to `server` and install the backend dependencies:
   ```bash
   cd server
   npm install
   ```

---

### Step 2: Configure Environment Variables

1. Inside the `server` directory, locate or create a `.env` file. A default `.env` template is provided below:
   ```env
   # Database connection string (adjust credentials for your local PG server)
   DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/ai_realty?schema=public"

   # Secret key used for signing JWT tokens
   JWT_SECRET="your_secure_jwt_random_secret_string"

   # Port the Express server will listen on
   PORT=5000
   ```
2. Replace `postgres:YOUR_PASSWORD` with your local PostgreSQL username and password.

---

### Step 3: Run Database Migrations & Seeding

Still inside the `server` directory, run the database migrations and populate it with mock data:

1. **Run Prisma Migrations** to create the tables in your database:
   ```bash
   npm run prisma:migrate
   ```
2. **Generate Prisma Client:**
   ```bash
   npm run prisma:generate
   ```
3. **Seed the Database** with mock users, properties, leads, and localities:
   ```bash
   npm run seed
   ```

---

### Step 4: Start the Servers

You will need two separate terminal windows (or split terminals) running simultaneously.

#### 1. Start the Backend Server (Terminal 1)
Inside the `server` directory:
```bash
npm run dev
```
*   The server will start at `http://localhost:5000`.
*   You can verify it is healthy by visiting: `http://localhost:5000/api/health`.

#### 2. Start the Frontend Server (Terminal 2)
In the project's root directory:
```bash
npm run dev
```
*   The Vite server will start up.
*   Open your browser and navigate to `http://localhost:5174` (or the port specified in your terminal).

---

## 🔑 Default Accounts (For Testing)

The database seed script generates pre-configured accounts representing each persona. Use the password `password123` to log in:

| Role | Email | Password | Purpose |
| :--- | :--- | :--- | :--- |
| **Customer** | `sarah@example.com` | `password123` | Search properties, chat with AI/Agents, save listings. |
| **Subagent** | `john@example.com` | `password123` | Manage listings, track active leads, update settings. |
| **Admin** | `admin@example.com` | `password123` | Moderation, approve users, inspect chat audit logs. |

---

## 🌐 Port Forwarding / Remote Tunneling

as i was forwarding my ports for testing, i have enabled port tunneling. you can disable it by changing `allowedHosts: true` to `allowedHosts: false` inside `vite.config.ts`

If you run the Vite server through a tunneling agent (like `localtunnel` or `ngrok`) to test on mobile devices or share progress, you may receive a **"Blocked request"** warning because of Vite's host checking security.

To prevent this, Vite is pre-configured with `allowedHosts: true` inside `vite.config.ts`, ensuring that third-party tunnel hosts (e.g., `*.loca.lt`) can securely communicate with your development server.