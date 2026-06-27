# Sentralia Backend:

Read about ENV file at https://docs.notreal003.org

## ⚙️ Environment Variables

`.env` example for backend (`/Backend/.env`):

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
