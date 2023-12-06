const express = require('express');
const axios = require('axios');
const helmet = require('helmet');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000; // Use environment variable for port

app.use(helmet()); // Security middleware to set various HTTP headers
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Middleware to parse JSON bodies

let cachedToken = {
    value: null,
    expiry: null
};

async function fetchAccessToken() {
    try {
        const params = new URLSearchParams();
        params.append('grant_type', 'client_credentials');
        params.append('client_id', process.env.CLIENT_ID);
        params.append('client_secret', process.env.CLIENT_SECRET);
        params.append('scope', 'https://graph.microsoft.com/.default');

        const response = await axios.post(process.env.TOKEN_ENDPOINT, params, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        const expiresIn = response.data.expires_in;
        cachedToken = {
            value: response.data.access_token,
            expiry: new Date(new Date().getTime() + expiresIn * 1000) // Setting the expiry time
        };
    } catch (error) {
        console.error('Error fetching token:', error);
        throw new Error('Error fetching token');
    }
}

app.get('/getAccessToken', async (req, res) => {
    try {
        console.log('Cached token:', cachedToken)
        if (!cachedToken.value || new Date() >= cachedToken.expiry) {
            await fetchAccessToken();
        }
        res.json({ accessToken: cachedToken.value });
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
