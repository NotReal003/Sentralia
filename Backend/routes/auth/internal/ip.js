const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken'); // Ensure jwt is imported
const router = express.Router();
const User = require('../../../models/User');

const discordWebhookUrl = process.env.USER_AUTH_WEBTOKEN;

router.get('/', async (req, res, next) => {
    try {
        const token = req.query.callback;

        if (!token) {
            return res.status(400).send("We're sorry, there was a problem while processing. You can close this window and try again!");
        }

        const userIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

        const timestamp = new Date().toISOString();

        const userAgent = req.headers['user-agent'];

        let discordId = 'N/A';
        let username = 'N/A';

        jwt.verify(token, process.env.JWT_SECRET, async (err, decodedToken) => {
            if (err) {
                return res.status(403).json({ message: 'A: Forbidden' });
            }

            const userResponse = await User.findOne({ id: decodedToken.id });
            if (userResponse) {
                discordId = userResponse.id;
                username = userResponse.username;
            }

            const embed = {
                title: "User Authentication Details",
                description: "User details during authentication",
                color: 7506394, // Color of the embed in decimal (hex #7277f3)
                fields: [
                    { name: "User Username", value: username, inline: true },
                    { name: "IP Address", value: userIp, inline: true },
                    { name: "User Discord ID", value: discordId, inline: true },
                    { name: "Timestamp", value: timestamp, inline: true },
                    { name: "User-Agent", value: userAgent, inline: true },
                ],
                footer: { text: "Security Event" }
            };

            try {
                await axios.post(discordWebhookUrl, {
                    embeds: [embed]
                });
            } catch (error) {
                console.error('Error sending data to Discord webhook:', error.message);
                next(error);
                return res.status(500).send("We're sorry, there was a problem while processing. You can close this window and try again!");
            }

            res.status(200).send("Authentication successful! You can close this window.");
        });
    } catch (error) {
        console.error('Unexpected error:', error.message);
        res.status(500).send("We're sorry, there was a problem while processing. You can close this window and try again!");
    }
});

module.exports = router;
