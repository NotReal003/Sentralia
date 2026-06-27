const express = require('express');
const router = express.Router();
const axios = require('axios');
const Request = require('../../models/Request');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const User = require('../../models/User');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { google } = require('googleapis');
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first'); 


const genAI = process.env.GEMINI_KEY ? new GoogleGenerativeAI(process.env.GEMINI_KEY) : null;

async function runGemini(prompt) {
  if (!genAI) throw new Error('GEMINI_KEY not configured');
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text().trim();
}

router.post('/generate', async (req, res) => {
  return res.status(503).json({ success: false, error: "maintenance", message: "This route is in maintenance" });
  const user = await req.user;
  if (!user || (!user.admin && !user.staff)) {
    return res.status(403).json({ message: 'Unauthorized' });
  }

  const { request } = req.body;
  const prompt = `You're an admin reviewing this request: ${JSON.stringify(request)}. Suggest a professional review message.`;

  try {
    const suggestion = await runGemini(prompt);
    res.json({ suggestion });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'AI generation failed' });
  }
});

router.post('/analyze', async (req, res) => {
  return res.status(503).json({ success: false, error: "maintenance", message: "This route is in maintenance" });
  const user = await req.user;
  if (!user || (!user.admin && !user.staff)) {
    return res.status(403).json({ message: 'Unauthorized' });
  }

  const { request } = req.body;
  const prompt = `Summarize this request in 1 sentence and recommend a status (APPROVED or DENIED only):\n${JSON.stringify(request)}`;

  try {
    const output = await runGemini(prompt);
    const lines = output.split('\n');
    const summary = lines[0] || output;
    const recommendation = lines.find(line => line.includes('APPROVED') || line.includes('DENIED')) || '';
    res.json({ summary, recommendation: recommendation.trim() });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'AI summary failed' });
  }
});

router.post('/rephrase', async (req, res) => {
  return res.status(503).json({ success: false, error: "maintenance", message: "This route is in maintenance" });
  const user = await req.user;
  if (!user || (!user.admin && !user.staff)) {
    return res.status(403).json({ message: 'Unauthorized' });
  }

  const { message, style } = req.body;
  const prompt = `Rewrite the following message in a ${style} tone:\n\n"${message}"`;

  try {
    const rephrased = await runGemini(prompt);
    res.json({ rephrased });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Tone rephrase failed' });
  }
});

router.post('/chat', async (req, res) => {
  return res.status(503).json({ success: false, error: "maintenance", message: "This route is in maintenance" });
  const user = await req.user;
  if (!user || (!user.admin && !user.staff)) {
    return res.status(403).json({ message: 'Unauthorized' });
  }

  const { prompt, request } = req.body;
  const fullPrompt = `This is a request: ${JSON.stringify(request)}\n\nNow answer the following question from an admin's perspective:\n${prompt}`;

  try {
    const responseText = await runGemini(fullPrompt);
    res.json({ response: responseText });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'AI failed to respond.' });
  }
});

router.delete('/user/:userId', async (req, res) => {
  const user = await req.user;

  if (!user) {
  return res.status(401).json({ code: 0, message: 'Unauthorized' });
}

  if (!(user.owner)) {
    return res.status(403).json({ code: 0, message: 'You do not have permission to delete a user.' });
  }
  
  const gdprKey = req.headers['x-gdpr-key'];
  if (!gdprKey || gdprKey !== process.env.GDPR_DELETE_KEY) {
    return res.status(403).json({ code: 0, message: 'GDPR deletion requires an extra verification step.' });
  }

  try {
    const { userId } = req.params;

    const targetUser = await User.findOne({ id: userId });
    if (!targetUser) {
      return res.status(404).json({ code: 0, message: 'User not found.' });
    }

    await User.deleteOne({ id: userId });

    await Request.deleteMany({ id: userId });

    res.status(200).json({ message: 'User and related requests deleted successfully (GDPR).' });
  } catch (error) {
    console.error('Error while deleting user and requests:', error);
    res.status(500).json({ message: 'Failed to delete user. Please try again later.' });
  }
});

router.get('/requests', async (req, res) => {
  const user = await req.user;

  if (!user) {
    return res.status(401).json({ code: 0, message: 'Unauthorized' });
  }

  try {
    if (user.admin === true || user.staff === true) {
      const allRequests = await Request.find();
      return res.status(200).json(allRequests);
    } else {
      return res.status(403).json({ code: 0, message: 'You do not have permission to view these requests.' });
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Failed to fetch requests. Please try again later.' });
  }
});

router.delete('/:requestId', async (req, res) => {
  const user = await req.user;

  if (!user) {
    return res.status(401).json({ code: 0, message: 'Unauthorized' });
  }
    if (user.admin === true) {
      user.isAdmin = true;
    }

  if (!user.isAdmin) {
    return res.status(403).json({ code: 0, message: 'You do not have permission to delete this request.' });
  }

  try {
    const { requestId } = req.params;
    const request = await Request.findByIdAndDelete(requestId);

    if (!request) {
      return res.status(404).json({ code: 0, message: 'Request not found.' });
    }

    res.status(200).json({ message: 'Request deleted successfully.' });
  } catch (error) {
    console.error('Error while deleting request:');
    res.status(500).json({ message: 'Failed to delete request. Please try again later.' });
  }
});

router.delete('/requests/:userId', async (req, res) => {
  const user = await req.user;

  if (!user) {
    return res.status(401).json({ code: 0, message: 'Unauthorized' });
  }
  if (user.admin === true) {
    user.isAdmin = true;
  }

  if (!user.isAdmin) {
    return res.status(403).json({ code: 0, message: 'You do not have permission to delete these requests.' });
  }

  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ code: 0, message: 'Invalid user ID.' });
    }

    const deleteResult = await Request.deleteMany({ id: userId });

    if (deleteResult.deletedCount === 0) {
      return res.status(404).json({ code: 0, message: 'No requests found for this user.' });
    }

    res.status(200).json({ message: `Successfully deleted ${deleteResult.deletedCount} requests for user.` });
  } catch (error) {
    console.error('Error while deleting requests:', error);
    res.status(500).json({ message: 'Failed to delete requests. Please try again later.' });
  }
});

router.patch('/:requestId', async (req, res) => {
  const user = await req.user;
  const { requestId } = req.params;
  const { status } = req.body;
  let { reviewMessage } = req.body;

  if (!['APPROVED', 'DENIED', 'PENDING', 'CANCELLED', 'RESOLVED', 'ESCALATED'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status given' });
  }

  if (!user) {
    return res.status(401).json({ code: 0, message: 'Unauthorized' });
  }

  if (user.staff === true || user.admin === true) {
    user.isAdmin = true;
  }

  if (!user.isAdmin) {
    return res.status(403).json({ code: 0, message: 'You do not have permission to manage this request.' });
  }

  try {
    const request = await Request.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    const requestUser = await User.findOne({ id: request.id });
    if (!requestUser) {
      return res.status(404).json({ message: 'Request user not found' });
    }

    if (request.status === 'PENDING' && request.status === status) {
      return res.status(400).json({ message: `This request is already ${request.status}!` });
    }

    request.status = status;
    request.reviewed = true;
    if (reviewMessage) {
      request.reviewMessage = reviewMessage;
    }
    if (status === 'ESCALATED') {
      request.escalated = true;
    }
    if (status !== 'ESCALATED') {
      request.escalated = false;
    }
    await request.save();

    const messageContent =
      requestUser.authType === 'discord'
        ? `Hey <@${request.id}>! Your request has been updated :)\nCheck your request here: https://request.notreal003.org/requestdetail?id=${request._id}`
        : `Hey ${requestUser.displayName}! Your request has been updated :)\nThe request can be found here: https://request.notreal003.org/requestdetail?id=${request._id}`;

    const webhookUrl = process.env.WEB_TOKEN;
    const discordMessage = { content: messageContent };

    await axios.post(webhookUrl, discordMessage).catch(err => {
      console.error('Failed to send Discord notification:', err);
    });

    res.status(200).json({ message: `Request successfully updated to ${request.status}!` });
  } catch (error) {
    console.error('Error updating request:', error);
    res.status(500).json({ message: 'There was an error while updating the request. Please try again later.' });
  }
});

router.get('/requests/:requestId', async (req, res) => {
  const user = await req.user;

  if (!user) {
    return res.status(401).json({ code: 0, message: 'Unauthorized' });
  }

  try {
    const { requestId } = req.params;
    const request = await Request.findById(requestId);

    if (!request) {
      return res.status(404).json({ message: 'This request not found' });
    }

    if (user.admin === true || user.staff === true) {
      return res.status(200).json(request);
    } else {
      return res.status(403).json({ code: 0, message: 'You do not have permission to view this request.' });
    }
  } catch (error) {
    console.error('Error fetching request:');
    res.status(500).json({ message: 'Failed to fetch request. Please try again later.' });
  }
});



const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    type: 'OAuth2',
    user: process.env.EMAIL,
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    refreshToken: process.env.GMAIL_REFRESH_TOKEN
  }
});



const formatForEmail = (input) => {
  return input ? input.replace(/\n/g, '<br>') : '';
};
const getStatusMeta = (status) => {
  const s = status ? status.toUpperCase() : 'PENDING';
  
  const colors = {
    green:  '#22c55e', // APPROVED, RESOLVED
    red:    '#ef4444', // DENIED
    orange: '#f97316', // ESCALATED
    blue:   '#6366f1', // PENDING, CANCELLED
  };

  let color;
  switch (s) {
    case 'APPROVED':
    case 'RESOLVED':
      color = colors.green;
      break;
    case 'DENIED':
      color = colors.red;
      break;
    case 'ESCALATED':
      color = colors.orange;
      break;
    case 'PENDING':
    case 'CANCELLED':
    default:
      color = colors.blue;
      break;
  }

  return {
    color: color,
    bgTint: `${color}26`, 
    glow: `linear-gradient(180deg, ${color}40 0%, rgba(17, 17, 17, 0) 100%)`
  };
};

router.post('/send/email', async (req, res) => {
  const { requestId } = req.body;
  const user = await req.user;

  if (!user) return res.status(401).json({ code: 0, message: 'Unauthorized' });
  
  const isAdmin = user.owner || user.staff || user.admin;
  if (!isAdmin) return res.status(403).json({ code: 0, message: 'Permission denied.' });

  try {
    const myRequest = await Request.findById(requestId);
    const myUser = await User.findOne({ id: myRequest.id });
    
    if (!myRequest || !myUser) return res.status(404).json({ message: 'Not found.' });

    const templatePath = path.join(__dirname, 'send.html');
    let htmlTemplate = fs.readFileSync(templatePath, 'utf-8');
    
    const reviewMessageFormatted = myRequest.reviewMessage 
      ? myRequest.reviewMessage.replace(/\n/g, '<br>') 
      : '';

    const meta = getStatusMeta(myRequest.status);

    htmlTemplate = htmlTemplate
      .replace('{{username}}', myUser.displayName)
      .replace(/{{requestId}}/g, requestId)       // Used for Links
      .replace('{{id}}', requestId)     // Used for Display ID
      .replace('{{reviewMessage}}', reviewMessageFormatted || "No review message provided.")
      .replace('{{status}}', myRequest.status)
      .replace(/{{requestName}}/g, myRequest.typeName) // Preserved as requested
      .replace(/{{typeName}}/g, myRequest.type)    // Preserved as requested
      .replace(/{{statusColor}}/g, meta.color)
      .replace(/{{statusBg}}/g, meta.bgTint)
      .replace(/{{statusGlow}}/g, meta.glow);

    const oAuth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      "https://developers.google.com/oauthplayground"
    );
    oAuth2Client.setCredentials({ refresh_token: process.env.GMAIL_REFRESH_TOKEN });

    const mailBuildTransport = nodemailer.createTransport({
      streamTransport: true,
      buffer: true,
      newline: 'windows'
    });

    const mailOptions = {
      from: '"Sentralia Requests" <noreply.notreal003@gmail.com>',
      to: myUser.email,
      subject: `Update on your ${myRequest.typeName} request`,
      html: htmlTemplate,
    };

    const info = await mailBuildTransport.sendMail(mailOptions);

    const encodedMessage = info.message.toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });
    
    await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw: encodedMessage },
    });

    res.status(200).json({ message: 'Email sent successfully!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error sending email' });
  }
});

module.exports = router;
