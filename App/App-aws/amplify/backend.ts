import { defineBackend } from "@aws-amplify/backend";
import { auth } from "./auth/resource";
import { data } from "./data/resource";
import { storage } from "./storage/resource";
import { locationProcessor } from "./functions/location-processor/resource";
import { geofenceEvaluator } from "./functions/geofence-evaluator/resource";
import { panicHandler } from "./functions/panic-handler/resource";
import { notificationDispatcher } from "./functions/notification-dispatcher/resource";
import { childrenLocationsResolver } from "./functions/children-locations-resolver/resource";
import { locationHistoryResolver } from "./functions/location-history-resolver/resource";
import { createGeofenceHandler } from "./functions/create-geofence-handler/resource";
import { userManagement } from "./functions/user-management/resource";
import { PolicyStatement } from "aws-cdk-lib/aws-iam";
import { StartingPosition, EventSourceMapping } from "aws-cdk-lib/aws-lambda";

const backend = defineBackend({
  auth,
  data,
  storage,
  locationProcessor,
  geofenceEvaluator,
  panicHandler,
  notificationDispatcher,
  childrenLocationsResolver,
  locationHistoryResolver,
  createGeofenceHandler,
  userManagement,
});
// Grant DynamoDB permissions
const locationTable = backend.data.resources.tables["Location"];
const geofenceTable = backend.data.resources.tables["Geofence"];
const alertTable = backend.data.resources.tables["Alert"];
const userTable = backend.data.resources.tables["User"];
const geofenceStateTable = backend.data.resources.tables["GeofenceState"];

// Add environment variables to all functions
const tableEnvVars = {
  LOCATION_TABLE_NAME: locationTable.tableName,
  GEOFENCE_TABLE_NAME: geofenceTable.tableName,
  ALERT_TABLE_NAME: alertTable.tableName,
  USER_TABLE_NAME: userTable.tableName,
  GEOFENCE_STATE_TABLE_NAME: geofenceStateTable.tableName,
};

// Location Processor
Object.entries(tableEnvVars).forEach(([key, value]) => {
  backend.locationProcessor.addEnvironment(key, value);
});

// Geofence Evaluator 
Object.entries(tableEnvVars).forEach(([key, value]) => {
  backend.geofenceEvaluator.addEnvironment(key, value);
});

// Panic Handler
Object.entries(tableEnvVars).forEach(([key, value]) => {
  backend.panicHandler.addEnvironment(key, value);
});

// Notification Dispatcher
Object.entries(tableEnvVars).forEach(([key, value]) => {
  backend.notificationDispatcher.addEnvironment(key, value);
});

// Children Locations Resolver
Object.entries(tableEnvVars).forEach(([key, value]) => {
  backend.childrenLocationsResolver.addEnvironment(key, value);
});

// Location History Resolver
Object.entries(tableEnvVars).forEach(([key, value]) => {
  backend.locationHistoryResolver.addEnvironment(key, value);
});
// Create Geofence Handler
Object.entries(tableEnvVars).forEach(([key, value]) => {
  backend.createGeofenceHandler.addEnvironment(key, value);
});

// User Management
Object.entries(tableEnvVars).forEach(([key, value]) => {
  backend.userManagement.addEnvironment(key, value);
});

// Add Cognito User Pool ID to User Management function
backend.userManagement.addEnvironment('AMPLIFY_AUTH_USERPOOL_ID', backend.auth.resources.userPool.userPoolId);

// Location Processor permissions
backend.locationProcessor.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: ["dynamodb:PutItem", "dynamodb:GetItem", "dynamodb:Query"],
    resources: [locationTable.tableArn, `${locationTable.tableArn}/index/*`],
  })
);
// Geofence Evaluator permissions
backend.geofenceEvaluator.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: ["dynamodb:GetItem", "dynamodb:Query", "dynamodb:PutItem"],
    resources: [
      geofenceTable.tableArn,
      `${geofenceTable.tableArn}/index/*`,
      alertTable.tableArn,
      locationTable.tableArn,
      userTable.tableArn,
      geofenceStateTable.tableArn,
    ],
  })
);
// Geofence Evaluator DynamoDB Streams permissions
backend.geofenceEvaluator.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: [
      "dynamodb:GetRecords",
      "dynamodb:GetShardIterator", 
      "dynamodb:DescribeStream",
      "dynamodb:ListStreams"
    ],
    resources: [
      `${locationTable.tableArn}/stream/*`,
      locationTable.tableArn, // Also allow table access for stream operations
    ],
  })
);
// Panic Handler permissions
backend.panicHandler.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: ["dynamodb:PutItem", "dynamodb:GetItem", "sns:Publish"],
    resources: [alertTable.tableArn, userTable.tableArn, "*"],
  })
);
// Notification Dispatcher permissions
backend.notificationDispatcher.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: ["sns:Publish", "dynamodb:GetItem"],
    resources: [userTable.tableArn, "*"],
  })
);
// Children Locations Resolver permissions
backend.childrenLocationsResolver.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: ["dynamodb:GetItem", "dynamodb:Query"],
    resources: [userTable.tableArn, locationTable.tableArn, `${locationTable.tableArn}/index/*`],
  })
);
// Location History Resolver permissions
backend.locationHistoryResolver.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: ["dynamodb:GetItem", "dynamodb:Query"],
    resources: [userTable.tableArn, locationTable.tableArn, `${locationTable.tableArn}/index/*`],
  })
);
// Create Geofence Handler permissions
backend.createGeofenceHandler.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: ["dynamodb:GetItem", "dynamodb:PutItem"],
    resources: [userTable.tableArn, geofenceTable.tableArn],
  })
);

// User Management permissions
backend.userManagement.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: ["dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:UpdateItem", "dynamodb:Query"],
    resources: [userTable.tableArn, `${userTable.tableArn}/index/*`],
  })
);

backend.userManagement.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: [
      "cognito-idp:AdminCreateUser",
      "cognito-idp:AdminSetUserPassword",
      "cognito-idp:AdminGetUser",
      "cognito-idp:AdminUpdateUserAttributes"
    ],
    resources: [`arn:aws:cognito-idp:*:*:userpool/*`],
  })
);

// Add DynamoDB Stream trigger for geofence evaluation
new EventSourceMapping(
  backend.geofenceEvaluator.resources.lambda.stack,
  "LocationStreamTrigger",
  {
    target: backend.geofenceEvaluator.resources.lambda,
    eventSourceArn: locationTable.tableStreamArn,
    startingPosition: StartingPosition.LATEST,
    batchSize: 10,
  }
);
