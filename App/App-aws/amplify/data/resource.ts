import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

const schema = a.schema({
  // -----------------------
  // USER MODEL
  // -----------------------
  User: a
    .model({
      email: a.string().required(),
      name: a.string().required(),
      userType: a.enum(["PARENT", "CHILD"]),
      parentId: a.id(), // for children
      childIds: a.string().array(), // for parents
      familyCode: a.string(), // parent-generated
      trustedContacts: a.json(),
      phone: a.string(),
      isActive: a.boolean().default(true),
      createdAt: a.datetime(),
    })
    .authorization((allow) => [
      allow.owner(), // user can update own profile
      allow.authenticated().to(["read"]), // Simplified - implement family logic in resolvers
    ]),

  // -----------------------
  // LOCATION MODEL
  // -----------------------
  Location: a
    .model({
      userId: a.id().required(),
      latitude: a.float().required(),
      longitude: a.float().required(),
      accuracy: a.float(),
      timestamp: a.datetime().required(),
      speed: a.float(),
      heading: a.float(),
      owner: a.string(), // Required for owner-based auth
    })
    .authorization((allow) => [
      allow.owner(), // Default owner field
      allow.authenticated().to(['read']), // Parents can read - implement family logic in resolvers
    ])
    .secondaryIndexes((index) => [
      index("userId").sortKeys(["timestamp"]).queryField("locationsByUser"),
    ]),

  // -----------------------
  // GEOFENCE MODEL
  // -----------------------
  Geofence: a
    .model({
      parentId: a.id().required(), // only parent creates
      name: a.string().required(),
      centerLat: a.float().required(),
      centerLon: a.float().required(),
      radius: a.float().required(),
      isActive: a.boolean().default(true),
      childId: a.id(), // optional for per-child fence
      notifyOnEntry: a.boolean().default(true),
      notifyOnExit: a.boolean().default(true),
      createdAt: a.datetime(),
    })
    .authorization((allow) => [
      allow.owner(), // only parent can edit
      allow.authenticated().to(["read"]), // parent dashboard needs to read
    ])
    .secondaryIndexes((index) => [
      index("parentId").sortKeys(["createdAt"]).queryField("geofencesByParent"),
    ]),

  // -----------------------
  // ALERT MODEL
  // -----------------------
  Alert: a
    .model({
      userId: a.id().required(), // child
      parentId: a.id().required(), // parent receiving alert
      type: a.enum(["PANIC", "GEOFENCE_ENTRY", "GEOFENCE_EXIT", "LOW_BATTERY"]),
      location: a.json(),
      geofenceId: a.id(),
      geofenceName: a.string(),
      message: a.string(),
      isRead: a.boolean().default(false),
      timestamp: a.datetime().required(),
    })
    .authorization((allow) => [
      allow.authenticated(), // parent must read alerts, child can trigger alerts
    ])
    .secondaryIndexes((index) => [
      index("parentId").sortKeys(["timestamp"]).queryField("alertsByParent"),
    ]),

  // -----------------------
  // GEOFENCE STATE (PRIVATE)
  // -----------------------
  GeofenceState: a
    .model({
      userId: a.id().required(),
      geofenceId: a.id().required(),
      isInside: a.boolean().required(),
      lastChecked: a.datetime().required(),
    })
    .authorization((allow) => [
      allow.authenticated(), // backend + parent read is allowed
    ]),

  // ---------------------------------------------------
  // CUSTOM MUTATIONS
  // ---------------------------------------------------

  recordLocation: a
    .mutation()
    .arguments({
      latitude: a.float().required(),
      longitude: a.float().required(),
      accuracy: a.float(),
      timestamp: a.datetime().required(),
    })
    .returns(a.ref("Location"))
    .authorization((allow) => [allow.authenticated()])
    .handler(a.handler.function("locationProcessor")),

  triggerPanic: a
    .mutation()
    .arguments({
      latitude: a.float().required(),
      longitude: a.float().required(),
      message: a.string(),
    })
    .returns(a.ref("Alert"))
    .authorization((allow) => [allow.authenticated()])
    .handler(a.handler.function("panicHandler")),

  setupGeofence: a
    .mutation()
    .arguments({
      name: a.string().required(),
      centerLat: a.float().required(),
      centerLon: a.float().required(),
      radius: a.float().required(),
      childId: a.id(),
    })
    .returns(a.ref("Geofence"))
    .authorization((allow) => [allow.authenticated()])
    .handler(a.handler.function("createGeofenceHandler")),

  // ---------------------------------------------------
  // CUSTOM QUERIES
  // ---------------------------------------------------

  getLocationHistory: a
    .query()
    .arguments({
      userId: a.id().required(),
      startTime: a.datetime().required(),
      endTime: a.datetime().required(),
    })
    .returns(a.ref("Location").array())
    .authorization((allow) => [allow.authenticated()])
    .handler(a.handler.function("locationHistoryResolver")),

  getChildrenLocations: a
    .query()
    .arguments({
      childIds: a.id().array().required(),
    })
    .returns(a.ref("Location").array())
    .authorization((allow) => [allow.authenticated()])
    .handler(a.handler.function("childrenLocationsResolver")),

  // ---------------------------------------------------
  // USER MANAGEMENT MUTATIONS
  // ---------------------------------------------------
  
  registerUser: a
    .mutation()
    .arguments({
      email: a.string().required(),
      name: a.string().required(),
      userType: a.string().required(),
      phone: a.string(),
      profilePhoto: a.string(),
    })
    .returns(a.json())
    .authorization((allow) => [allow.authenticated()])
    .handler(a.handler.function("userManagement")),

  updateUserProfile: a
    .mutation()
    .arguments({
      id: a.string().required(),
      name: a.string(),
      phone: a.string(),
      profilePhoto: a.string(),
      childIds: a.string().array(),
    })
    .returns(a.json())
    .authorization((allow) => [allow.authenticated()])
    .handler(a.handler.function("userManagement")),

  createChildUser: a
    .mutation()
    .arguments({
      name: a.string().required(),
      parentId: a.string().required(),
      parentEmail: a.string().required(),
      age: a.integer(),
    })
    .returns(a.json())
    .authorization((allow) => [allow.authenticated()])
    .handler(a.handler.function("userManagement")),

  deactivateChild: a
    .mutation()
    .arguments({
      childId: a.string().required(),
    })
    .returns(a.json())
    .authorization((allow) => [allow.authenticated()])
    .handler(a.handler.function("userManagement")),

  getUserWithChildren: a
    .query()
    .arguments({
      userId: a.string().required(),
    })
    .returns(a.json())
    .authorization((allow) => [allow.authenticated()])
    .handler(a.handler.function("userManagement")),

  // ---------------------------------------------------
  // SUBSCRIPTIONS
  // ---------------------------------------------------
  // Note: Amplify Gen 2 auto-generates subscriptions for models
  // Custom subscriptions for real-time updates are handled via model subscriptions
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "userPool",
  },
});
