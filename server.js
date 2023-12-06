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

const clientID = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const tokenEndpoint = process.env.TOKEN_ENDPOINT;

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
        res.status(500).send('Internal Server Error');
    }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
