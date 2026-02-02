# 🖥️ LearnQuest Server - Backend API

This is the server-side repository for **LearnQuest**, built with Node.js, Express.js, and MongoDB. It handles authentication, course management, payment processing, and role-based access control.

🔗 **Live API URL:** `https://your-backend-live-link.com`

---

## 🛠️ Technology Stack
* **Runtime:** Node.js
* **Framework:** Express.js
* **Database:** MongoDB
* **Authentication:** JSON Web Tokens (JWT) & Firebase
* **Payments:** Stripe API

---

## 📡 API Endpoints Overview

### 🔐 Authentication
* `POST /jwt` - Generates access tokens for secure sessions.
* `POST /users` - Saves new user info to the database.

### 🎓 Course & Class Management
* `GET /classes` - Fetches all approved classes.
* `POST /classes` - Allows instructors to add new courses.
* `PATCH /classes/:id` - Updates class status or enrollment counts.

### 💳 Payments
* `POST /create-payment-intent` - Creates a Stripe payment intent.
* `POST /payments` - Records successful transactions in the database.

### 👨‍🏫 Instructor & Admin Tools
* `POST /applyforTeaching` - User application for teacher role.
* `POST /assignments` - Instructors create assignments for students.
* `POST /submitAssignments` - Students submit completed tasks.

---

## ⚙️ Environment Variables
To run this locally, create a `.env` file in the root directory and add:
```env
DB_USER=your_db_username
DB_PASS=your_db_password
ACCESS_TOKEN_SECRET=your_jwt_secret
STRIPE_SECRET_KEY=your_stripe_secret