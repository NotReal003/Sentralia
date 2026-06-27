const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const { google } = require('googleapis');

async function sendRequestEmail(request, user, getStatusMeta) {
  const templatePath = path.join(__dirname, '../templates/send.html');

  let htmlTemplate = fs.readFileSync(templatePath, 'utf8');

  const meta = getStatusMeta(request.status);

  htmlTemplate = htmlTemplate
    .replace('{{username}}', user.displayName || user.username)
    .replace(/{{requestId}}/g, request._id.toString())
    .replace('{{id}}', request._id.toString())
    .replace('{{reviewMessage}}', request.reviewMessage || '')
    .replace('{{status}}', request.status)
    .replace(/{{requestName}}/g, request.typeName)
    .replace(/{{typeName}}/g, request.type)
    .replace(/{{statusColor}}/g, meta.color)
    .replace(/{{statusBg}}/g, meta.bgTint)
    .replace(/{{statusGlow}}/g, meta.glow);

  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'https://developers.google.com/oauthplayground'
  );

  oAuth2Client.setCredentials({
    refresh_token: process.env.GMAIL_REFRESH_TOKEN
  });

  const transport = nodemailer.createTransport({
    streamTransport: true,
    buffer: true,
    newline: 'windows'
  });

  const info = await transport.sendMail({
    from: '"Sentralia Requests" <noreply.notreal003@gmail.com>',
    to: user.email,
    subject: `Update on your ${request.typeName} request`,
    html: htmlTemplate
  });

  const encodedMessage = info.message
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const gmail = google.gmail({
    version: 'v1',
    auth: oAuth2Client
  });

  await gmail.users.messages.send({
    userId: 'me',
    requestBody: {
      raw: encodedMessage
    }
  });
}

module.exports = sendRequestEmail;