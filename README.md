# 🍱 Smart Campus Mess Management System

A production-ready digital campus mess food ordering and credit management platform that eliminates physical token queues with real-time digital ordering, atomic credit transactions, role-based dashboards, and live order status tracking.

---

## 🌟 Key Features

### 1. 🎓 Student Experience
- **Strict VIT Domain Validation**: Student registration and sign-in strictly restricted to `@vitstudent.ac.in` email addresses on both frontend and backend.
- **Dual Authentication**:
  - 📧 **Campus Email & Password**
  - 📱 **Mobile OTP via Twilio SMS** (6-digit verification code with 5-minute expiry & rate limiting).
- **9,000 Monthly Credits Allowance**: Automatically initialized every month with low balance alerts (<500 credits).
- **Interactive Digital Menu**: Filter by Breakfast, Lunch, Snacks, Dinner, and Beverages with live stock quantities.
- **Atomic Order Placement**: Deducts credits and decrements stock in a single ACID transaction with unique pickup tokens (e.g., `TK-3584`).
- **Real-Time Order Tracking**: 5-step visual stepper (`Pending` ➔ `Accepted` ➔ `Preparing` ➔ `Ready` ➔ `Completed`).
- **Instant Order Cancellation**: Cancel while `Pending` with instant credit refund and inventory restoration.
- **Credit Transaction Ledger**: Transparent audit history of all meal debits, refunds, and monthly allowances.

### 2. 👨‍🍳 Chef / Mess Staff Dashboard
- **Live Kitchen Queue**: Real-time incoming order stream with pickup tokens, student details, and items.
- **Status Progression Controls**: Move orders smoothly from `Accept` ➔ `Start Cooking` ➔ `Mark Ready` ➔ `Complete`.
- **Quick Stock Availability Toggler**: 1-click In Stock / Sold Out toggle and portion adjustment (+5 / -5).

### 3. 👑 Admin Portal
- **Campus Analytics Dashboard**: Orders today, credits consumed today, active students, and top 5 ordered dishes leaderboard.
- **Menu Items Manager**: Full CRUD for food catalog (name, category, credit price, stock, active status).
- **Student Credits Management**: View balances, 1-click monthly reset (9,000 credits), and manual credit adjustments.
- **Audit Logs**: Immutable system-wide order records and credit transactions log.

---

## 🏗️ Pure Java Architecture (Review 2)

- **Frontend (`frontend/`)**: **JavaFX 22 Desktop Application** ([`SmartMessFXApp.java`](file:///Users/rohit/.gemini/antigravity/scratch/smart-campus-mess/frontend/src/main/java/com/smartmess/gui/SmartMessFXApp.java))
- **Backend (`backend/`)**: **Java 22 & Java Servlets** ([`javax.servlet.http.HttpServlet`](file:///Users/rohit/.gemini/antigravity/scratch/smart-campus-mess/backend/src/main/java/com/smartmess/servlet/))
- **Database Engine**: **PostgreSQL SQL Database** (Neon Cloud Serverless)
- **Database API Connector**: **Pure JDBC API** (`java.sql.Connection`, `PreparedStatement`, ACID transactions with `commit()` and `rollback()`)
- **Legacy Web Stack**: Original React 18 & Node.js code safely archived in `legacy-javascript-web/`

---

## ☕ How to Run the Java Full Stack

### 1. Launch the JavaFX Frontend GUI:
```bash
cd frontend
bash run.sh
```
*Launches the JavaFX desktop application. If the backend servlet container is not yet running, the desktop app automatically starts an embedded servlet server in the background so everything works immediately out of the box!*

### 2. Launch the Java Servlets Backend:
```bash
cd backend
bash run.sh        # Starts Java Servlet Container on port 8080
bash run.sh test   # Runs automated Review 2 test suite
```

### 3. Active Java Servlet Endpoints (port 8080):
- `POST http://localhost:8080/api/java/auth` → Handled by `AuthServlet`
- `GET  http://localhost:8080/api/java/menu` → Handled by `MenuServlet`
- `POST http://localhost:8080/api/java/order` → Handled by `OrderServlet`
- `GET  http://localhost:8080/api/java/kitchen` → Handled by `KitchenQueueServlet`
- `GET  http://localhost:8080/api/java/history` → Handled by `OrderHistoryServlet`


---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18+)
- npm

### 1. Clone the Repository
```bash
git clone https://github.com/kundurohit775-cmyk/smart-campus-mess.git
cd smart-campus-mess
```

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your DATABASE_URL, BETTER_AUTH_SECRET, and TWILIO credentials
npm run dev
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Demo Credentials (1-Click Switcher on Login Page)

| Role | Email | Password | Access / Role |
|:---:|:---:|:---:|:---:|
| 🎓 **Student** | `student@vitstudent.ac.in` | `password123` | 9,000 Monthly Credits & Digital Ordering |
| 🧑‍🍳 **Chef** | `<chef-email>` *(Configured in `CHEF_EMAIL` env)* | `password123` | Kitchen Queue & Stock Toggler |
| 👑 **Admin** | `<admin-email>` *(Configured in `ADMIN_EMAIL` env)* | `password123` | Full Campus Administration & Analytics |

---

## 🔒 Security & Privacy
All secrets, API keys, database credentials, and `.env` files are excluded from git tracking via `.gitignore`. Refer to `backend/.env.example` for environment variable templates.
