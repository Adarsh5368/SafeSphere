import mongoose from 'mongoose';
import dotenv from 'dotenv';
import config from '../config/config.js';

dotenv.config();

class Database {
  constructor() {
    this.connection = null;
  }

  async connect() {
    if (this.connection) return this.connection;

    try {
      const mongoUri = config.MONGODB_URI || 'mongodb://localhost:27017/carenest';
      console.log(`🔄 Connecting to MongoDB at: ${mongoUri}`);
      
      this.connection = await mongoose.connect(mongoUri, {
        maxPoolSize: 10
      });

      console.log('✅ MongoDB connected successfully!');
      console.log(`📊 Database: ${mongoose.connection.name}`);
      console.log(`🔗 Host: ${mongoose.connection.host}:${mongoose.connection.port}`);

      mongoose.connection.on('error', (err) => console.error('MongoDB connection error:', err));
      mongoose.connection.on('disconnected', () => console.log('📤 MongoDB disconnected'));

      process.on('SIGINT', this.gracefulClose.bind(this));
      process.on('SIGTERM', this.gracefulClose.bind(this));

      return this.connection;
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error.message);
      process.exit(1);
    }
  }

  async gracefulClose() {
    if (this.connection) {
      await mongoose.connection.close();
    }
  }

  isConnected() {
    return mongoose.connection.readyState === 1;
  }
}

const database = new Database();
export default database;
