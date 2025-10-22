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

// CORS Configuration
app.use(cors({
  origin: [
    'https://sbkfrontend.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));
app.use(helmet({
  crossOriginResourcePolicy: false
}));

// Flask server URL
const FLASK_SERVER_URL = process.env.FLASK_URL || 'https://sbk-flask.vercel.app/generate';

// Database connection state (for connection reuse in serverless)
let isDBConnected = false;

// Initialize database connection with connection reuse
const initDB = async () => {
  if (!isDBConnected) {
    try {
      await connectDB();
      isDBConnected = true;
      console.log('✅ MongoDB connected');
    } catch (error) {
      console.error('❌ MongoDB connection error:', error.message);
      // Don't throw error to prevent function crash
    }
  }
};

// ===== ROOT ROUTE =====
app.get("/", async (req, res) => {
  try {
    await initDB();
    res.status(200).json({
      status: 'OK',
      message: 'SBK Backend Server is running',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      endpoints: {
        root: 'GET /',
        health: 'GET /health',
        gemini: 'POST /ask-gemini',
        user: '/api/user/*'
      }
    });
  } catch (error) {
    console.error('Root route error:', error);
    res.status(500).json({ 
      error: 'Server error', 
      message: error.message 
    });
  }
});

// ===== HEALTH CHECK =====
app.get('/health', async (req, res) => {
  try {
    await initDB();
    res.status(200).json({ 
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: isDBConnected ? 'connected' : 'disconnected',
      flask_url: FLASK_SERVER_URL
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'unhealthy', 
      error: error.message 
    });
  }
});

// ===== GEMINI AI PROXY ENDPOINT =====
app.post('/ask-gemini', async (req, res) => {
  try {
    await initDB();
    
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ 
        error: "Missing 'query' field in request body" 
      });
    }

    console.log(`[Gemini API] Processing query (${query.length} chars)`);

    const flaskResponse = await axios.post(FLASK_SERVER_URL, {
      query: query
    }, {
      timeout: 30000,
      headers: { 
        'Content-Type': 'application/json'
      }
    });

    console.log('[Gemini API] ✅ Response received');
    res.status(200).json(flaskResponse.data);

  } catch (error) {
    console.error('[Gemini API] ❌ Error:', error.message);
    
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
        message: 'Could not connect to Flask server',
        flask_url: FLASK_SERVER_URL
      });
    } else if (error.code === 'ECONNABORTED') {
      // Timeout
      return res.status(504).json({
        error: 'Request timeout',
        message: 'Flask server took too long to respond'
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
// Initialize DB before user routes
app.use('/api/user', async (req, res, next) => {
  await initDB();
  next();
}, userRouter);

// ===== 404 HANDLER =====
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method,
    availableRoutes: ['/', '/health', '/ask-gemini', '/api/user/*']
  });
});

// ===== ERROR HANDLER =====
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err.stack);
  res.status(err.status || 500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// ===== START SERVER (Local Development Only) =====
if (process.env.VERCEL !== '1' && process.env.NODE_ENV !== 'production') {
  connectDB().then(() => {
    isDBConnected = true;
    app.listen(PORT, () => {
      console.log('=================================');
      console.log(`✅ Server running: http://localhost:${PORT}`);
      console.log(`✅ MongoDB: Connected`);
      console.log(`✅ Flask URL: ${FLASK_SERVER_URL}`);
      console.log('=================================');
    });
  }).catch((error) => {
    console.error('❌ Startup Error:', error);
    process.exit(1);
  });
}

// Export for Vercel serverless functions
export default app;