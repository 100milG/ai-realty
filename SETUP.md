# 🛠️ Local Machine Setup Guide

Follow this guide to configure and run the **AI Realty Platform** on your local workstation.

---

## 📋 Prerequisites

Ensure you have the following installed on your machine:
*   **Node.js** (v18.0.0 or higher) — [Download](https://nodejs.org/)
*   **PostgreSQL** (v14.0.0 or higher) — [Download](https://www.postgresql.org/)
*   **Git** — [Download](https://git-scm.com/)

---

## 🚀 Step-by-Step Installation

### Step 1: Database Initialization
1.  Open your PostgreSQL shell (`psql`) or database GUI manager (e.g., pgAdmin, DBeaver, TablePlus).
2.  Execute the following command to create a clean database:
    ```sql
    CREATE DATABASE ai_realty;
    ```

### Step 2: Backend Configuration
1.  Navigate into the `server` directory:
    ```bash
    cd server
    ```
2.  Duplicate the environment template file:
    ```bash
    cp .env.example .env
    ```
3.  Open the newly created `server/.env` and update the connection URL and JWT secret:
    ```env
    PORT=5000
    DATABASE_URL="postgresql://postgres:YOUR_PG_PASSWORD@localhost:5432/ai_realty?schema=public"
    JWT_SECRET="generate_a_secure_random_string_here"
    ```
    > [!IMPORTANT]
    > Replace `YOUR_PG_PASSWORD` with the actual password for your local PostgreSQL `postgres` user.

### Step 3: Backend Node Dependencies & Migration
1.  Install backend packages:
    ```bash
    npm install
    ```
2.  Compile schema models and run migrations to build the tables:
    ```bash
    npm run prisma:generate
    npm run prisma:migrate
    ```
3.  Seed the database with default personas, mocked active listings, geocoded locality metadata, and inquiry records:
    ```bash
    npm run seed
    ```

### Step 4: Frontend Workspace Setup
1.  Navigate back to the project root directory:
    ```bash
    cd ..
    ```
2.  Install frontend dependencies:
    ```bash
    npm install
    ```

---

## 💻 Running the Applications Locally

You will need **two terminal tabs/windows** running at the same time to work locally.

### Terminal 1: Express API Server
Navigate to the `server` directory and start the hot-reloading server:
```bash
cd server
npm run dev
```
*   The API server will listen at: `http://localhost:5000`
*   Verify server health: `http://localhost:5000/api/health`

### Terminal 2: React Vite Development Server
From the project root directory, run the Vite asset bundler:
```bash
npm run dev
```
*   The Vite local server will start, typically at: `http://localhost:5173`
*   Open the link in your browser to view the application.

---

## 🔑 Default Accounts (Quick-Login)

When you access the login screen, you can click the quick-login shortcut buttons at the bottom of the form, or manually type the following credentials:

| Role | Email Address | Password | Functionality |
| :--- | :--- | :--- | :--- |
| **Customer** | `priya@example.com` | `password123` | Search properties, save favorites, chat with agents & AI |
| **Subagent** | `raj@example.com` | `password123` | Post/update listings, manage leads, update profiles |
| **Admin** | `admin@example.com` | `password123` | Moderate properties, verify agents, audit chat logs |
| **Testing Subagent** | `agent_testing@example.com` | `password123` | Upload KYC documents, check geocoding |

---

## 🧪 Manual Verification Plan

Verify that your installation is fully functional by checking these core mechanisms:

1.  **Dynamic Loading:** Open `http://localhost:5173/`. Ensure the featured properties section is loaded dynamically from the PostgreSQL database (it should not show empty cards).
2.  **Geocoding Check:** Log in as Raj (Subagent). Navigate to **Property Management** -> **Add New Property**. Type a real address (e.g., `1600 Amphitheatre Pkwy, Mountain View`). Select the suggested location to ensure map latitude and longitude fields fill in automatically. Save the property.
3.  **Role Guard (RBAC):** While logged in as Priya (Customer), attempt to navigate to `http://localhost:5173/admin/dashboard` in the address bar. Verify that the application redirects you back to the customer dashboard automatically.
