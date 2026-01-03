import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import morgan from 'morgan';

import config from './config/config.js';
import database from './utils/database.js';
import globalErrorHandler from './middleware/errorHandler.js';
import apiRoutes from './routes/index.js';

import { corsOptions, securityHeaders, compressionMiddleware } from './middleware/security.js';

const app = express();
const httpServer = createServer(app);

// Setup Socket.io with CORS
const io = new Server(httpServer, {
  cors: {
    origin: config.CORS_ORIGIN.split(','),
    credentials: true,
    methods: ['GET', 'POST']
  }
});

// Make io accessible to routes
app.set('io', io);

// Socket.io connection handling
io.on('connection', (socket) => {
  // Join room based on user type
  socket.on('join', (data) => {
    const { userId, userType } = data;
    if (userId) {
      socket.join(`user:${userId}`);
    }
  });
  
  // Join family room for parents
  socket.on('join-family', (data) => {
    const { familyCode } = data;
    if (familyCode) {
      socket.join(`family:${familyCode}`);
    }
  });
  
  socket.on('disconnect', () => {
    // Handle disconnection
  });
});

app.set('trust proxy', 1);

app.use(cors(corsOptions));
app.use(securityHeaders);
app.use(compressionMiddleware);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

if (config.isDevelopment()) {
  app.use(morgan('dev'));
}

app.use('/api', apiRoutes);

app.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Welcome to CareNest API',
    version: '1.0.0',
    environment: config.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

app.use(globalErrorHandler);

app.all('*', (req, res) => {
  res.status(404).json({
    status: 'fail',
    message: `Route ${req.originalUrl} not found`
  });
});

const startServer = async () => {
  try {
    await database.connect();
    
    httpServer.listen(config.PORT, () => {
      console.log(`CareNest server running on port ${config.PORT}`);
      console.log(`Environment: ${config.NODE_ENV}`);
      console.log(`WebSocket server enabled`);
      console.log(`API Documentation: http://localhost:${config.PORT}/api/docs`);
      console.log(`Health Check: http://localhost:${config.PORT}/api/health`);
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal) => {
      console.log(`Received ${signal}. Shutting down gracefully...`);
      
      io.close(() => {
        console.log('WebSocket server closed');
      });
      
      httpServer.close(async () => {
        console.log('HTTP server closed');
        
        try {
          await database.gracefulClose();
          console.log('Database connection closed');
          process.exit(0);
        } catch (error) {
          console.error('Error during graceful shutdown:', error);
          process.exit(1);
        }
      });

      // Force close after 10 seconds
      setTimeout(() => {
        console.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
