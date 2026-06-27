# 🛠️ Sentralia

The **Sentralia** is a Open Source and Powerful, fullstack solution for managing user requests, role-based administration, and ticket workflows. Built using a modern React frontend and a Node.js/Express backend, it offers a professional-grade foundation for SaaS, internal teams, or client support systems.

---

## 🔍 Overview

Designed with security, scalability, and usability in mind, the system includes:

- 🌐 Full **React frontend** (SPA) with TailwindCSS  
- 🔒 Secure **Node.js + Express backend**  
- ☁️ MongoDB for request storage  
- 🔐 JWT + OAuth (Discord/Google) authentication  
- 🔔 Email notifications & Discord webhook logging  
- 🧑‍💼 Admin dashboards for user/request management  
- 📱 Responsive design for mobile and desktop  

---

## 🧠 Key Use Cases

- 🎫 Internal/external support ticketing  
- 🛠️ Workflow automation in startups or teams  
- 🧩 SaaS foundation for request-based portals  
- 🧑‍💼 Role-based approval systems  

---

## 📸 UI Previews

- [Screenshorts can be found here](https://support.notreal003.org/rmpsell.html#📸-ui-previews)

---

## 🧰 Tech Stack

| Layer       | Tools/Technologies                     |
|-------------|----------------------------------------|
| Frontend    | React, TailwindCSS, DaisyUI, Axios     |
| Backend     | Node.js, Express.js, Mongoose          |
| Database    | MongoDB Atlas                          |
| Auth        | Discord + Google OAuth, JWT            |
| Notifications | Nodemailer, Discord Webhooks        |
| UI/UX       | React Hot Toast, React Icons           |

---

## 🔐 Security & Architecture

- JWT-secured session auth  
- Admin-only protected routes  
- IP + device logging for login events  
- Role-based access control  
- Customizable `.env`-driven config  
- Webhook logs for errors and activity  

---

# 📦 Full Setup Guide — Sentralia

## 🧾 Prerequisites

- Node.js v14+  
- MongoDB Atlas or local MongoDB  
- Discord & Google OAuth apps  
- Gmail App Password (for email)  
- Discord Webhook URLs  

---

## ⚙️ Environment Variables

`.env` example for backend (`/API/.env`):

```env
# rename file to .env for production
SESSION_SECRET=your_secret
PORT=3001
MONGODB_URI=your_mongo_uri
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
GOOGLE_CLIENT_REDIRECT=https://your-domain.com/google/callback
DISCORD_CLIENT_ID=xxx
DISCORD_CLIENT_SECRET=xxx
DISCORD_REDIRECT_URI=https://your-domain.com/callback
EMAIL=your@gmail.com
EPASS=your_gmail_app_password
JWT_SECRET=strong_random_value
ADMIN_ID=admin_mongo_id
ERROR_WEBHOOK=discord-webhook-for-tracking-errorlogs
USER_AUTH_WEBTOKEN=https://discord.com/api/webhooks/…
WEB_LOGS=discord-webhook-for-all-api-logs
WEB_TOKEN=discord-webhook-for-request-update-notification
```

read about it at https://docs.notreal003.org

---

## 🚀 Backend Setup
```
cd API
npm install
cp .env.example .env
# Edit the .env file
npm start   # Or use: npx nodemon index.js
```

---

### 🔐 Auth Flows

- Provider	Endpoint	(files) Notes
- Discord	/auth/internal/discord	Live, fully tested
- Google	/auth/internal/google	Live, - fully supported
- GitHub	/auth/internal/github	Disabled (can enable in code)
- Email	/auth/internal/e-signin	OTP-based (disabled by default)
& more
---

### 📡 API Reference

- Method	Route	Description
- POST	/requests	Submit new request
- GET	/requests	Fetch user’s requests
- PUT	/requests/:id/status	Admin: update status
- PATCH	/admins/staff/manage/:userId/role	Assign admin roles
- PUT	/admins/staff/demote/:userId	Remove admin
- GET	/admin/requests	View all requests (admin)
- PUT	/admin/users/block	Block a user
& more
---

### 👑 Admin Panel
• Visit /admins — protected admin interface
• Promote via: 
```
PATCH /admins/staff/manage/{userId}/role
{
  "role": "admin"
}
```
(This will require owner permission)

---

## 🔧 Frontend Setup
```
cd Frontend
npm install
```
Create .env in /Requests:
```
REACT_APP_API=/api
REACT_APP_APIURL=fullapiurl(https://api.notreal003.org (for auth workflow)
CI=false
REACT_APP_DELETE_KEY=xxx (GDPR delete key as in BACKEND)
REACT_APP_MAIN_API=fullapiurl
```
Start app:
```
npm start     # Dev
npm run build # Production build
```

---

## 🎯 Features (Recap)

- 🔐 Discord/Google OAuth login.
- 🧾 Request forms: reports, support, applications.
- 🧑 User dashboard with history & statuses.
- 🧠 Admin panel for request/user management.
- 📧 Email alerts with review messages
- 💻 IP tracking and logs.
- 📱 Responsive UI across devices.

---

## 📞 Contact & Support

- 🌐 Live Site: request.notreal003.org
- 💬 Discord: [Join Discord Server](https://notreal003.org/discord)
- 📧 Email: noreply.notreal003@gmail.com

---
- Sentralia was known as Request Management Portal
