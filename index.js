const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const port = 3000;

const cooldowns = new Map();

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

app.post('/sendreact', (req, res) => {
    const { link, type, cookie } = req.body;
    const senderID = 'some_unique_identifier'; // Use session or token to identify the user

    if (cooldowns.has(senderID)) {
        const cooldown = cooldowns.get(senderID);
        const timeLeft = (cooldown - Date.now()) / 1000;
        return res.json({ error: `Please wait ${timeLeft.toFixed(1)} more seconds before reusing the sendreact command.` });
    }

    cooldowns.set(senderID, Date.now() + 50000); // Cooldown for 50 seconds (50000 milliseconds)

    setTimeout(() => {
        cooldowns.delete(senderID);
    }, 50000);

    const url = "https://flikers.net/android/android_get_react.php";
    const payload = {
        post_id: link,
        react_type: type,
        version: "v1.7"
    };
    const headers = {
        'User-Agent': "Dalvik/2.1.0 (Linux; U; Android 12; V2134 Build/SP1A.210812.003)",
        'Connection': "Keep-Alive",
        'Accept-Encoding': "gzip",
        'Content-Type': "application/json",
        'Cookie': cookie
    };

    axios.post(url, payload, { headers })
        .then(response => {
            const data = response.data;
            if (data.message) {
                res.json({ message: data.message });
            } else {
                res.json({ error: 'Unknown error occurred' });
            }
        })
        .catch(error => {
            if (error.response && error.response.status === 403) {
                res.json({ cookieError: true });
            } else {
                res.json({ error: 'An error occurred while sending the reaction. Please try again later.' });
            }
        });
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
