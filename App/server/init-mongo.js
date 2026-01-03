// MongoDB initialization script for Docker

// Switch to carenest database
db = db.getSiblingDB('carenest');

// Create collections with validation
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['email', 'name', 'password', 'userType'],
      properties: {
        email: {
          bsonType: 'string',
          description: 'must be a string and is required'
        },
        name: {
          bsonType: 'string',
          description: 'must be a string and is required'
        },
        userType: {
          enum: ['PARENT', 'CHILD'],
          description: 'can only be PARENT or CHILD'
        }
      }
    }
  }
});

db.createCollection('locations');
db.createCollection('geofences');
db.createCollection('alerts');
db.createCollection('geofencestates');

// Create indexes for better performance
// User indexes
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "parentId": 1 });
db.users.createIndex({ "familyCode": 1 });
db.users.createIndex({ "userType": 1, "isActive": 1 });

// Location indexes
db.locations.createIndex({ "userId": 1, "timestamp": -1 });
db.locations.createIndex({ "timestamp": -1 });
db.locations.createIndex({ "createdAt": 1 }, { expireAfterSeconds: 2592000 }); // 30 days

// Geofence indexes
db.geofences.createIndex({ "parentId": 1, "createdAt": -1 });
db.geofences.createIndex({ "childId": 1 });
db.geofences.createIndex({ "isActive": 1 });

// Alert indexes
db.alerts.createIndex({ "parentId": 1, "timestamp": -1 });
db.alerts.createIndex({ "userId": 1, "timestamp": -1 });
db.alerts.createIndex({ "type": 1, "timestamp": -1 });
db.alerts.createIndex({ "isRead": 1, "parentId": 1 });
db.alerts.createIndex({ "createdAt": 1 }, { expireAfterSeconds: 7776000 }); // 90 days

// GeofenceState indexes
db.geofencestates.createIndex({ "userId": 1, "geofenceId": 1 }, { unique: true });
db.geofencestates.createIndex({ "lastChecked": -1 });
db.geofencestates.createIndex({ "createdAt": 1 }, { expireAfterSeconds: 2592000 }); // 30 days

console.log('CareNest database initialized successfully!');
console.log('Created collections: users, locations, geofences, alerts, geofencestates');
console.log('Created indexes for optimal performance');