import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import AppError from '../utils/appError.js';
import config from '../config/config.js';

// Security headers
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https:'],
      scriptSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
});

// CORS configuration
export const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = config.CORS_ORIGIN.split(',');
    
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'Pragma'
  ]
};

// Request logging
export const requestLogger = (req, res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.originalUrl;
  const ip = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('User-Agent') || '';
  
  next();
};

// Request size limiting
export const bodySizeLimit = '10mb';

// Compression middleware
export const compressionMiddleware = compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6,
  threshold: 1024
});

// API key middleware (if needed for external integrations)
export const apiKeyAuth = (req, res, next) => {
  const apiKey = req.header('X-API-Key');
  const validApiKeys = config.API_KEYS ? config.API_KEYS.split(',') : [];
  
  if (validApiKeys.length === 0) {
    return next(); // No API keys configured, skip validation
  }
  
  if (!apiKey || !validApiKeys.includes(apiKey)) {
    return next(new AppError('Invalid or missing API key', 401));
  }
  
  next();
};

// Health check bypass for monitoring
export const healthCheckBypass = (req, res, next) => {
  if (req.path === '/health' || req.path === '/api/health') {
    return res.status(200).json({
      status: 'success',
      message: 'Server is healthy',
      timestamp: new Date().toISOString(),
      environment: config.NODE_ENV
    });
  }
  next();
};