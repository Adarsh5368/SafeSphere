import type { Schema } from "../../data/resource";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

// Input validation functions
function validateCoordinates(latitude: number, longitude: number): void {
  if (latitude < -90 || latitude > 90) {
    throw new Error("Invalid latitude: must be between -90 and 90");
  }
  if (longitude < -180 || longitude > 180) {
    throw new Error("Invalid longitude: must be between -180 and 180");
  }
}

function validateLocationAge(timestamp: string): void {
  const locationAge = Date.now() - new Date(timestamp).getTime();
  if (locationAge > 300000) { // 5 minutes
    throw new Error("Location data too old");
  }
}

function validateAccuracy(accuracy?: number): void {
  if (accuracy && accuracy > 100) { // meters
    throw new Error("Location accuracy too low (>100m)");
  }
}

type Handler = Schema["recordLocation"]["functionHandler"];

export const handler: Handler = async (event) => {
  const { latitude, longitude, accuracy, timestamp } = event.arguments;
  let userId: string | undefined;

  if (event.identity && "sub" in event.identity) {
    userId = event.identity.sub;
  }

  if (!userId) {
    throw new Error("Unauthorized");
  }

  // Input validation
  validateCoordinates(latitude, longitude);
  validateLocationAge(timestamp ?? new Date().toISOString());
  validateAccuracy(accuracy ?? undefined);

  const location = {
    id: `${userId}-${Date.now()}`,
    userId,
    latitude,
    longitude,
    accuracy: accuracy ?? 0,
    timestamp: timestamp ?? new Date().toISOString(),
    speed: undefined,
    heading: undefined,
    owner: userId, // Required for owner-based auth
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const tableName = process.env.LOCATION_TABLE_NAME;
  if (!tableName) throw new Error("LOCATION_TABLE_NAME env var missing");

  await docClient.send(
    new PutCommand({
      TableName: tableName,
      Item: location,
    })
  );

  return location;
};
