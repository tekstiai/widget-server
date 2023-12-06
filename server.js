const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
const port = 3000;

const clientID = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const tokenEndpoint = 'https://login.microsoftonline.com/7a90723c-edc7-4879-9051-7d724504de18/oauth2/v2.0/token';

app.get('/getAccessToken', async (req, res) => {
    try {
        const params = new URLSearchParams();
        params.append('grant_type', 'client_credentials');
        params.append('client_id', clientID);
        params.append('client_secret', clientSecret);
        params.append('scope', 'https://graph.microsoft.com/.default');

        const response = await axios.post(tokenEndpoint, params, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        res.json({ accessToken: response.data.access_token });
    } catch (error) {
        console.error('Error fetching token:', error);
        res.status(500).send('Error fetching token');
    }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
