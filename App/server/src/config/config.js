import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

class Config {
  constructor() {
    // Environment
    this.NODE_ENV = process.env.NODE_ENV || 'development';
    this.PORT = parseInt(process.env.PORT) || 5000;
    
    // Database
    this.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/carenest';
    this.DB_NAME = process.env.DB_NAME || 'carenest';
    
    // JWT
    this.JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';
    this.JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';
    this.COOKIE_EXPIRE = parseInt(process.env.COOKIE_EXPIRE) || 7;
    
    // Email Configuration
    this.SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
    this.SMTP_PORT = parseInt(process.env.SMTP_PORT) || 587;
    this.SMTP_EMAIL = process.env.SMTP_EMAIL || '';
    this.SMTP_PASSWORD = process.env.SMTP_PASSWORD || '';
    
    // Twilio SMS Configuration
    this.TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || '';
    this.TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || '';
    this.TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER || '';
    
    this.AWS_REGION = process.env.AWS_REGION || 'us-east-1';
    this.AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID || '';
    this.AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY || '';
    this.SMS_PROVIDER = process.env.SMS_PROVIDER || 'twilio';
    
    // Application URL
    this.APP_URL = process.env.APP_URL || 'http://localhost:3000';
    
    // Rate Limiting
    this.RATE_LIMIT_WINDOW = parseInt(process.env.RATE_LIMIT_WINDOW) || 15;
    this.RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX) || 100;
    
    // Security
    this.CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';
    
    // Geofence Settings
    this.MAX_GEOFENCE_RADIUS = parseInt(process.env.MAX_GEOFENCE_RADIUS) || 10000;
    this.LOCATION_ACCURACY_THRESHOLD = parseInt(process.env.LOCATION_ACCURACY_THRESHOLD) || 100;
    this.LOCATION_AGE_THRESHOLD = parseInt(process.env.LOCATION_AGE_THRESHOLD) || 300000;
    
    // Panic Alert Settings
    this.PANIC_RATE_LIMIT = parseInt(process.env.PANIC_RATE_LIMIT) || 60000;
    
    // Validate required environment variables
    this.validateConfig();
  }
  
  validateConfig() {
    const requiredVars = {
      JWT_SECRET: this.JWT_SECRET,
      MONGODB_URI: this.MONGODB_URI
    };
    
    const missing = [];
    
    Object.entries(requiredVars).forEach(([key, value]) => {
      if (!value || (key === 'JWT_SECRET' && value === 'fallback-secret-key')) {
        missing.push(key);
      }
    });
    
    if (missing.length > 0) {
      if (this.NODE_ENV === 'production') {
        throw new Error(`Required environment variables missing: ${missing.join(', ')}`);
      }
    }
  }
  
  isDevelopment() {
    return this.NODE_ENV === 'development';
  }
  
  isProduction() {
    return this.NODE_ENV === 'production';
  }
  
  isTest() {
    return this.NODE_ENV === 'test';
  }
}

export const config = new Config();
export default config;