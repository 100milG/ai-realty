# Setup Guide


## 🛠️ Prerequisites

 * **Node.js** (v18.0.0 or higher) - [Download Node.js](https://nodejs.org/)
* **PostgreSQL** (v14.0.0 or higher) - [Download PostgreSQL](https://www.postgresql.org/)
 
---

## 🚀 Step-by-Step Installation

### 1. Configure the Database
1. Open your PostgreSQL terminal (`psql`) or database manager (like PgAdmin or DBeaver).
2. Create a new database named `ai_realty`:
   ```sql
   CREATE DATABASE ai_realty;
   ```

### 2. Configure Backend Environment
1. Navigate to the `server/` directory:
   ```bash
   cd server
   ```
2. Copy the `.env.example` template to a new file named `.env`:
   ```bash
   cp .env.example .env
   ```
3. Open `server/.env` and update the `DATABASE_URL` with your local PostgreSQL password:
   ```env
   DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/ai_realty?schema=public"
   ```

### 3. Install Backend Dependencies & Sync DB Schema
1. Install node dependencies for the Express backend:
   ```bash
   npm install
   ```
2. Generate the local **Prisma Client** and push the database schema:
   ```bash
   npx prisma generate
   npx prisma db push
   ```
3. Run the database seed script to populate mock properties, agents, active inquiries, chat histories, and settings matching the development workspace state:
   ```bash
   npm run seed
   ```

### 4. Install Frontend Dependencies
1. Navigate back to the workspace root directory:
   ```bash
   cd ..
   ```
2. Install client dependencies:
   ```bash
   npm install
   ```

---

## 💻 Running the Application

To run the application, you need to start both the frontend Vite dev server and the backend Express dev server.

### Start the Backend Server
1. Navigate to the `server/` folder:
   ```bash
   cd server
   ```
2. Start the backend:
   ```bash
   npm run dev
   ```
   *The backend server will launch and listen on **`http://localhost:5000`**.*

### Start the Frontend Client
1. Open a new terminal tab and navigate to the project root directory.
2. Start the client:
   ```bash
   npm run dev
   ```
   *The client dev server will launch and listen on **`http://localhost:5173`** (or **`http://localhost:5174`**).*

---

## 🔑 Development Credentials (Quick-Login)

When you open **`http://localhost:5173/`** in your browser, click **Sign in** in the top right. You can quickly log in using the development shortcuts at the bottom of the login form, or use the email/password combinations below:

* **Customer Portal Evaluation:**
  * **Email:** `sarah@example.com`
  * **Password:** `password123`
* **Subagent Portal Evaluation:**
  * **Email:** `john@example.com`
  * **Password:** `password123`
* **Admin Portal Evaluation:**
  * **Email:** `admin@example.com`
  * **Password:** `password123`

---

## 🧪 Verification Plan

To confirm the platform is set up correctly, check the following flows:
1. **Landing Page:** Open `http://localhost:5173/`. You should see the **Featured Properties** section load active listings dynamically queried from your database rather than static variables.
2. **Subagent Form Geocoding:** Log in as John Doe (Subagent), go to **Property Management** -> **Add New Property**. Under the address field, search for a location (e.g. `1600 Amphitheatre Pkwy`). Select the geocoded suggestion and verify that the latitude/longitude coordinates are captured. Submit the form and check that it redirects to the listings table.
3. **Role Validation (RBAC):** While logged in as Customer (Sarah), try navigating to `http://localhost:5173/admin/dashboard` in the address bar. Verify that you are immediately redirected back to the customer dashboard.
