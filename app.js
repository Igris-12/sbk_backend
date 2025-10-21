const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS Configuration
app.use(cors({
  origin: [
    'https://sbkfrontend.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000'
  ],
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true
}));

app.use(express.json());

const FLASK_SERVER_URL = process.env.FLASK_URL || 'https://sbk-flask.vercel.app/generate';

// ✅ ROOT ROUTE - MUST BE FIRST
app.get('/', (req, res) => {
    res.status(200).json({ 
        status: 'OK',
        message: 'Node.js proxy server is running',
        timestamp: new Date().toISOString(),
        endpoints: {
            gemini: 'POST /ask-gemini',
            health: 'GET /health'
        }
    });
});

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'healthy' });
});

// Gemini proxy endpoint
app.post('/ask-gemini', async (req, res) => {
    try {
        const { query } = req.body;

        if (!query) {
            return res.status(400).json({ 
                error: "Missing 'query' field" 
            });
        }

        console.log(`[Node] Query: "${query}"`);

        const flaskResponse = await axios.post(FLASK_SERVER_URL, {
            query: query
        }, {
            timeout: 30000,
            headers: { 'Content-Type': 'application/json' }
        });

        res.status(200).json(flaskResponse.data);

    } catch (error) {
        console.error('[Node] Error:', error.message);
        
        if (error.response) {
            return res.status(error.response.status).json({
                error: 'Flask API error',
                details: error.response.data
            });
        } else if (error.request) {
            return res.status(503).json({ 
                error: 'Flask service unavailable'
            });
        } else {
            return res.status(500).json({ 
                error: 'Internal server error',
                message: error.message
            });
        }
    }
});

// Export for Vercel
module.exports = app;
