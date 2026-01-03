# CareNest Server

A Node.js Express server that mocks AWS Amplify backend functionality for the CareNest family safety application.

## Features

### 🔐 Authentication & Authorization
- JWT-based authentication with session cookies
- Role-based access control (Parent/Child)
- Password hashing with bcrypt
- Family code system for linking accounts
- Rate limiting for security

### 📍 Location Services
- Real-time location tracking
- Location history with pagination
- Geospatial validation and accuracy checks
- Automatic cleanup of old location data

### 🚧 Geofencing
- Create and manage circular geofences
- Real-time geofence entry/exit detection
- Parent-child specific geofences
- Haversine distance calculations

### 🚨 Alert System
- Panic button functionality
- Geofence violation alerts
- Multi-channel notifications (Email & SMS)
- Alert statistics and management

### 👨‍👩‍👧‍👦 Family Management
- Parent-child account relationships
- Family dashboard with real-time data
- Trusted contact management
- User activity summaries

## Tech Stack

- **Runtime**: Node.js with ES modules
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT + bcrypt
- **Notifications**: Nodemailer (Email) + Twilio (SMS)
- **Validation**: express-validator
- **Security**: Helmet, CORS, rate limiting
- **Development**: Nodemon for hot reloading

## Installation

1. **Navigate to server directory**:
   ```bash
   cd server
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Setup environment variables**:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your configuration:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/carenest
   JWT_SECRET=your-super-secret-jwt-key
   JWT_EXPIRE=7d
   
   # Email Configuration
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_EMAIL=your-email@gmail.com
   SMTP_PASSWORD=your-app-password
   
   # Twilio SMS Configuration
   TWILIO_ACCOUNT_SID=your-twilio-account-sid
   TWILIO_AUTH_TOKEN=your-twilio-auth-token
   TWILIO_PHONE_NUMBER=+1234567890
   ```

4. **Start MongoDB**:
   Ensure MongoDB is running locally or use MongoDB Atlas

5. **Run the server**:
   ```bash
   npm start
   ```

## API Endpoints

### Authentication
| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/api/auth/signup` | Register new user | Public |
| POST | `/api/auth/login` | Login user | Public |
| POST | `/api/auth/logout` | Logout user | Public |
| GET | `/api/auth/me` | Get current user | Auth |
| PATCH | `/api/auth/updateMe` | Update profile | Auth |
| POST | `/api/auth/createChild` | Create child account | Parent |
| POST | `/api/auth/joinFamily` | Join family | Child |

### Location Tracking
| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/api/locations` | Record location | Child |
| POST | `/api/locations/children` | Get children locations | Parent |
| GET | `/api/locations/history/:userId` | Get location history | Owner/Parent |
| GET | `/api/locations/current/:userId` | Get current location | Owner/Parent |

### Geofences
| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/api/geofences` | Create geofence | Parent |
| GET | `/api/geofences` | List geofences | Parent |
| GET | `/api/geofences/:id` | Get geofence | Owner |
| PATCH | `/api/geofences/:id` | Update geofence | Parent |
| DELETE | `/api/geofences/:id` | Delete geofence | Parent |
| GET | `/api/geofences/child/:childId` | Get child geofences | Parent/Child |

### Alerts
| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/api/alerts/panic` | Trigger panic alert | Child |
| GET | `/api/alerts` | Get alerts | Parent |
| GET | `/api/alerts/recent` | Get recent alerts | Parent |
| GET | `/api/alerts/stats` | Get alert statistics | Parent |
| PATCH | `/api/alerts/:id` | Mark alert as read | Parent |

### Users
| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/users/profile` | Get user profile | Auth |
| GET | `/api/users/dashboard` | Get dashboard data | Auth |
| GET | `/api/users/family` | Get family members | Auth |
| PATCH | `/api/users/trustedContacts` | Update trusted contacts | Parent |

## Development

### Project Structure
```
server/
├── src/
│   ├── controllers/     # Route handlers
│   ├── middleware/      # Custom middleware
│   ├── models/         # MongoDB models
│   ├── routes/         # Express routes
│   ├── services/       # Business logic
│   ├── utils/          # Helper functions
│   └── index.js        # Main server file
├── package.json
├── .env.example
└── README.md
```

### Scripts
- `npm start`: Start server with nodemon
- `npm run dev`: Alias for start
- `npm run build`: No build step needed

### Environment Variables
| Variable | Description | Default |
|----------|-------------|----------|
| `NODE_ENV` | Environment | development |
| `PORT` | Server port | 5000 |
| `MONGODB_URI` | MongoDB connection | mongodb://localhost:27017/carenest |
| `JWT_SECRET` | JWT signing secret | Required |
| `JWT_EXPIRE` | Token expiration | 7d |
| `SMTP_HOST` | Email host | smtp.gmail.com |
| `SMTP_EMAIL` | Email address | Required |
| `SMTP_PASSWORD` | Email password | Required |
| `TWILIO_ACCOUNT_SID` | Twilio Account SID | Optional (uses mock) |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token | Optional (uses mock) |
| `TWILIO_PHONE_NUMBER` | Twilio Phone Number | Optional (uses mock) |
| `APP_URL` | Application URL | http://localhost:3000 |

## Data Models

### User
- Email, name, password
- User type (PARENT/CHILD)
- Family relationships
- Trusted contacts
- Profile information

### Location
- User ID, coordinates
- Timestamp, accuracy
- Speed, heading (optional)
- Auto-expires after 30 days

### Geofence
- Parent ID, name
- Center coordinates, radius
- Child-specific or general
- Notification settings

### Alert
- User, parent, type
- Location, message
- Geofence reference
- Read status

### GeofenceState
- User-geofence tracking
- Inside/outside state
- Transition timestamps

## Security Features

- **Authentication**: JWT tokens with HTTP-only cookies
- **Authorization**: Role-based access control
- **Rate Limiting**: Configurable per endpoint
- **Input Validation**: Comprehensive validation rules
- **Password Security**: bcrypt hashing
- **CORS**: Configurable origins
- **Headers**: Security headers with Helmet
- **Error Handling**: No sensitive data exposure

## Notification Services

### Email Notifications
The server uses Nodemailer for email delivery:
- Welcome emails with professional templates
- Panic alert notifications with location details
- Geofence breach alerts
- Automatic fallback to mock mode if SMTP not configured

### SMS Notifications (Twilio)
Real SMS notifications via Twilio:
- Immediate panic alerts to parents and trusted contacts
- Geofence entry/exit notifications
- Professional and caring message templates
- Automatic fallback to mock mode if Twilio not configured

**Setting up Twilio**:
1. Sign up at [Twilio Console](https://console.twilio.com/)
2. Get your Account SID and Auth Token
3. Purchase a Twilio phone number
4. Add credentials to `.env` file
5. Verify phone numbers in development mode

**Note**: Both email and SMS services automatically use mock mode in development if credentials are not provided, logging all messages to console for testing

### Database (MongoDB vs DynamoDB)
MongoDB replaces DynamoDB with:
- Mongoose schemas with validation
- Indexes for performance
- TTL for automatic cleanup
- Atomic operations for consistency

## Testing

You can test the API using:

1. **Postman/Insomnia**: Import the endpoints
2. **curl**: Command line testing
3. **Frontend**: Connect your React app

Example login request:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"parent@example.com","password":"password123"}'
```

## Production Deployment

1. Set `NODE_ENV=production`
2. Use a proper JWT secret
3. Configure MongoDB Atlas
4. Set up real SMTP/SNS
5. Use HTTPS
6. Configure proper CORS origins
7. Set up monitoring and logging

## Contributing

1. Follow the existing code structure
2. Add proper error handling
3. Include input validation
4. Update documentation
5. Test your changes

## License

MIT License - see LICENSE file for details