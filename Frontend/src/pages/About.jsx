import React from 'react';
import { motion } from 'framer-motion';
import { FaCheckCircle, FaCogs, FaKey, FaBug, FaGithub, FaGoogle, FaDiscord, FaEnvelope, FaTerminal, FaUserShield } from 'react-icons/fa';

const Section = ({ title, icon, children }) => (
  <motion.section
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    viewport={{ once: true }}
    className="mb-16"
  >
    <h2 className="text-2xl font-semibold text-white flex items-center gap-2 mb-4">
      {icon && <span className="text-indigo-400">{icon}</span>} {title}
    </h2>
    <div className="bg-[#111] border border-[#222] rounded-xl p-5 text-gray-300 leading-relaxed">
      {children}
    </div>
  </motion.section>
);

const CodeBlock = ({ code }) => (
  <pre className="bg-[#0d0d0d] text-sm text-gray-200 p-4 rounded-lg border border-[#333] overflow-x-auto mt-4">
    <code>{code}</code>
  </pre>
);

const GuidePage = () => {
  return (
    <div className="min-h-screen bg-[#0b0b0b] px-6 py-12 text-white font-sans">
      <div className="max-w-5xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-4xl md:text-5xl font-bold text-white mb-8"
        >
          Request Management Portal-API Guide
        </motion.h1>

        <p className="text-gray-400 mb-12 text-lg">
          A step-by-step professional guide to deploy, configure, and use the NotReal003/API backend system.
        </p>

        <Section title="1. Overview" icon={<FaCogs />}>
          <p>
            A Node.js/Express API backend that enables user request management, OAuth2 authentication (Google, Discord, GitHub), admin roles, and audit logging using Discord webhooks.
          </p>
        </Section>

        <Section title="2. Prerequisites" icon={<FaCheckCircle />}>
          <ul className="list-disc list-inside space-y-1">
            <li>Node.js (v14+)</li>
            <li>npm (v6+)</li>
            <li>MongoDB (local or MongoDB Atlas)</li>
            <li>OAuth credentials: Google, Discord, GitHub (optional)</li>
            <li>Gmail account with App Password (if using email verification)</li>
            <li>Discord Webhook URLs</li>
          </ul>
        </Section>

        <Section title="3. .env Configuration" icon={<FaKey />}>
          <p>Example of required environment variables:</p>
          <CodeBlock
            code={`SESSION_SECRET=your_random_secret
PORT=3001
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/dbname
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_secret
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_secret
DISCORD_REDIRECT_URI=https://your.domain/auth/internal/discord
EMAIL=your_email@gmail.com
EPASS=your_email_app_password
ERROR_WEBHOOK=discord_webhook_url
USER_AUTH_WEBTOKEN=discord_auth_webhook
JWT_SECRET=your_jwt_secret
ADMIN_ID=admin_mongo_user_id`}
          />
        </Section>

        <Section title="4. Installation & Launch" icon={<FaTerminal />}>
          <CodeBlock
            code={`git clone https://github.com/NotReal003/API.git
cd API
npm install
cp .env.example .env  # or create it manually
# Edit .env and add values as shown above
npm start  # or use: npx nodemon index.js`}
          />
        </Section>

        <Section title="5. Authentication Workflows" icon={<FaGoogle />}>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Google:</strong> /auth/internal/google</li>
            <li><strong>Discord:</strong> /auth/internal/discord</li>
            <li><strong>GitHub:</strong> /auth/internal/github (disabled by default)</li>
            <li><strong>Email:</strong> /auth/internal/e-signin and /e-signup (disabled)</li>
          </ul>
        </Section>

        <Section title="6. API Structure & Endpoints" icon={<FaCogs />}>
          <ul className="list-disc list-inside space-y-1">
            <li>Main: /</li>
            <li>Auth: /auth/[provider]</li>
            <li>Admin Panel: /admins</li>
            <li>Role Management: /admins/staff</li>
            <li>Requests: /requests</li>
            <li>Users: /users</li>
          </ul>
        </Section>

        <Section title="7. Admin & Role Management" icon={<FaUserShield />}>
          <p>Admins can promote/demote users using secure endpoints:</p>
          <CodeBlock
            code={`PATCH /admins/staff/manage/{userId}/role
{
  "role": "admin" | "mod" | "user"
}`}
          />
        </Section>

        <Section title="8. Logging & Security" icon={<FaBug />}>
          <ul className="list-disc list-inside space-y-1">
            <li>Errors logged to <code>ERROR_WEBHOOK</code></li>
            <li>Auth events to <code>USER_AUTH_WEBTOKEN</code></li>
            <li>Keep all secrets safe and use HTTPS in production</li>
            <li>Use strong JWT and session secrets</li>
          </ul>
        </Section>

        <Section title="9. Contributor Guide" icon={<FaGithub />}>
          <ul className="list-disc list-inside space-y-1">
            <li>Use routers in <code>routes/</code> and follow Express/Mongoose best practices</li>
            <li>Update documentation when changing features</li>
            <li>Test endpoints before submitting pull requests</li>
          </ul>
        </Section>

        <Section title="10. References">
          <ul className="list-disc list-inside space-y-1 text-blue-400">
            <li> Interested in Request Management Portal? <a href="https://developers.google.com/identity/protocols/oauth2" target="_blank">Click here to purchase!!</a></li>
          </ul>
        </Section>
      </div>
    </div>
  );
};

export default GuidePage;
