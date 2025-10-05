// server.js (Node.js Express Proxy Server)

const express = require('express');
const axios = require('axios');
const cors = require('cors');

// --- Express App Initialization ---
const app = express();
const PORT = 3000; // Node.js server port

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- Configuration ---
// The URL for the Python Flask server.
const FLASK_SERVER_URL = 'http://127.0.0.1:5000/generate'; // Flask server port

// --- API Endpoint Definition ---
// This endpoint acts as a proxy for all requests to the Gemini API via Flask.
app.post('/ask-gemini', async (req, res) => {
    try {
        const { query } = req.body;

        if (!query) {
            return res.status(400).json({ error: "The 'query' field is required." });
        }

        console.log(`[Node.js] Received query from React: "${query}"`);
        console.log(`[Node.js] Forwarding to Flask server at ${FLASK_SERVER_URL}...`);

        // Send the query to the Flask server using Axios
        const flaskResponse = await axios.post(FLASK_SERVER_URL, {
            query: query
        });

        console.log('[Node.js] Received response from Flask. Sending back to React.');

        // Flask's response should be { "response": "..." }
        res.status(200).json(flaskResponse.data);

    } catch (error) {
        console.error('[Node.js] Error in /ask-gemini proxy:', error.message);
        
        if (error.response) {
            // Error response from Flask (e.g., 400 or 500 from Flask's try-except)
            res.status(error.response.status).json({
                error: 'An error occurred with the Python service.',
                details: error.response.data
            });
        } else if (error.request) {
            // Flask server is not running
            res.status(503).json({ error: 'The Python service is unavailable. Is the Flask server running on port 5000?' });
        } else {
            res.status(500).json({ error: 'An internal server error occurred.' });
        }
    }
});

// --- Server Start ---
app.listen(PORT, () => {
    console.log(`Node.js Express server is running on http://localhost:${PORT}`);
    console.log('Ready to receive requests from the React frontend.');
});