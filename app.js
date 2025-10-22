// const express = require('express');
// const axios = require('axios');
// const cors = require('cors');

// const app = express();
// const PORT = process.env.PORT || 3000;

// // CORS Configuration
// app.use(cors({
//   origin: [
//     'https://sbkfrontend.vercel.app',
//     'http://localhost:5173',
//     'http://localhost:3000'
//   ],
//   methods: ['GET', 'POST', 'OPTIONS'],
//   credentials: true
// }));

// app.use(express.json());

// const FLASK_SERVER_URL = process.env.FLASK_URL || 'https://sbk-flask.vercel.app/generate' || 'http://localhost:5000';

// // ✅ ROOT ROUTE - MUST BE FIRST
// app.get('/', (req, res) => {
//     res.status(200).json({ 
//         status: 'OK',
//         message: 'Node.js proxy server is running',
//         timestamp: new Date().toISOString(),
//         endpoints: {
//             gemini: 'POST /ask-gemini',
//             health: 'GET /health'
//         }
//     });
// });

// // Health check
// app.get('/health', (req, res) => {
//     res.status(200).json({ status: 'healthy' });
// });

// // Gemini proxy endpoint
// app.post('/ask-gemini', async (req, res) => {
//     try {
//         const { query } = req.body;

//         if (!query) {
//             return res.status(400).json({ 
//                 error: "Missing 'query' field" 
//             });
//         }

//         console.log(`[Node] Query: "${query}"`);

//         const flaskResponse = await axios.post(FLASK_SERVER_URL, {
//             query: query
//         }, {
//             timeout: 30000,
//             headers: { 'Content-Type': 'application/json' }
//         });

//         res.status(200).json(flaskResponse.data);

//     } catch (error) {
//         console.error('[Node] Error:', error.message);
        
//         if (error.response) {
//             return res.status(error.response.status).json({
//                 error: 'Flask API error',
//                 details: error.response.data
//             });
//         } else if (error.request) {
//             return res.status(503).json({ 
//                 error: 'Flask service unavailable'
//             });
//         } else {
//             return res.status(500).json({ 
//                 error: 'Internal server error',
//                 message: error.message
//             });
//         }
//     }
// });
// //Use Only when working on localHost
// // app.listen(PORT, () => {
// //   console.log(`Node.js server listening on http://localhost:${PORT}`);
// // });

// // Export for Vercel
// module.exports = app;


import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import helmet from 'helmet';
import axios from 'axios';
import connectDB from './config/connectDb.js';
import userRouter from './route/user.route.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// CORS Configuration - Allow multiple origins
app.use(cors({
  origin: [
    'https://sbkfrontend.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000',
    '*'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));
app.use(helmet({
  crossOriginResourcePolicy: false
}));

// Flask server URL for Gemini API
const FLASK_SERVER_URL = process.env.FLASK_URL || 'https://sbk-flask.vercel.app/generate' || 'http://localhost:5000';

// ===== ROOT ROUTE =====
app.get("/", (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Server is running on port ' + PORT,
    timestamp: new Date().toISOString(),
    endpoints: {
      root: 'GET /',
      health: 'GET /health',
      gemini: 'POST /ask-gemini',
      user: '/api/user/*'
    }
  });
});

// ===== HEALTH CHECK =====
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: 'connected'
  });
});

// ===== GEMINI AI PROXY ENDPOINT =====
app.post('/ask-gemini', async (req, res) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ 
        error: "Missing 'query' field in request body" 
      });
    }

    console.log(`[Gemini API] Query received: "${query.substring(0, 100)}..."`);

    const flaskResponse = await axios.post(FLASK_SERVER_URL, {
      query: query
    }, {
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' }
    });

    console.log('[Gemini API] Response received successfully');
    res.status(200).json(flaskResponse.data);

  } catch (error) {
    console.error('[Gemini API] Error:', error.message);
    
    if (error.response) {
      // Flask server responded with error
      return res.status(error.response.status).json({
        error: 'Flask API error',
        details: error.response.data,
        message: error.message
      });
    } else if (error.request) {
      // Flask server didn't respond
      return res.status(503).json({ 
        error: 'Flask service unavailable',
        message: 'Could not connect to Flask server'
      });
    } else {
      // Other errors
      return res.status(500).json({ 
        error: 'Internal server error',
        message: error.message
      });
    }
  }
});

// ===== API ROUTES =====
app.use('/api/user', userRouter);

// ===== 404 HANDLER =====
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// ===== ERROR HANDLER =====
app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// ===== START SERVER =====
// Connect to MongoDB first, then start server
connectDB().then(() => {
  // Only start server if not in Vercel serverless environment
  if (process.env.VERCEL !== '1') {
    app.listen(PORT, () => {
      console.log(`✅ Server is running on http://localhost:${PORT}`);
      console.log(`✅ MongoDB connected`);
      console.log(`✅ Flask server URL: ${FLASK_SERVER_URL}`);
    });
  }
}).catch((error) => {
  console.error('❌ MongoDB connection failed:', error);
  process.exit(1);
});

// Export for Vercel serverless
export default app;