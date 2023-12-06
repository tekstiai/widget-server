const express = require("express");
const axios = require("axios");
const helmet = require("helmet");
const cors = require("cors");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(express.json());

let cachedToken = {
  value: null,
  expiry: null,
};

async function fetchAccessToken() {
  try {
    const params = new URLSearchParams();
    params.append("grant_type", "client_credentials");
    params.append("client_id", process.env.CLIENT_ID);
    params.append("client_secret", process.env.CLIENT_SECRET);
    params.append("scope", "https://graph.microsoft.com/.default");

    const response = await axios.post(process.env.TOKEN_ENDPOINT, params, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    const expiresIn = response.data.expires_in;
    cachedToken = {
      value: response.data.access_token,
      expiry: new Date(new Date().getTime() + expiresIn * 1000),
    };
  } catch (error) {
    console.error("Error fetching token:", error);
    throw new Error("Error fetching token");
  }
}

app.get("/getAccessToken", async (req, res) => {
  try {
    if (!cachedToken.value || new Date() >= cachedToken.expiry) {
      await fetchAccessToken();
    }
    res.json({ accessToken: cachedToken.value });
  } catch (error) {
    console.error("Error in /getAccessToken:", error.message);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/relayQuestion", async (req, res) => {
  const { apiUrl, organisationKey, questionData } = req.body;
  try {
    if (!cachedToken.value || new Date() >= cachedToken.expiry) {
      await fetchAccessToken();
    }

    if (!cachedToken.value) {
      res.status(500).send("Failed to fetch access token");
      return;
    }

    const response = await axios.post(
      `${apiUrl}/question?apiKey=` + organisationKey,
      questionData,
      {
        headers: {
          "Content-Type": "application/json",
          "X-Access-Token": `${cachedToken.value}`,
          Accept: "application/json",
        },
      }
    );

    res.send(response.data);
  } catch (error) {
    console.error("Failed to relay question", error);
    res.status(500).send("Failed to relay question");
  }
});

if (process.env.NODE_ENV === "development") {
  // Development-specific HTTPS setup
  const https = require("https");
  const fs = require("fs");

  const credentials = {
    key: fs.readFileSync(process.env.SSL_KEY_FILE),
    cert: fs.readFileSync(process.env.SSL_CRT_FILE),
    rejectUnauthorized: false,
  };

  const httpsServer = https.createServer(credentials, app);
  httpsServer.listen(port, () => {
    console.log(`HTTPS Server running on port ${port}`);
  });
} else {
  app.listen(port, () => {
    console.log(`HTTP Server running on port ${port}`);
  });
}
