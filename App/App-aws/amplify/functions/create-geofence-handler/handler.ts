import type { Schema } from "../../data/resource";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, GetCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

// Validation functions
function validateCoordinates(centerLat: number, centerLon: number): void {
  if (centerLat < -90 || centerLat > 90) {
    throw new Error("Invalid centerLat: must be between -90 and 90");
  }
  if (centerLon < -180 || centerLon > 180) {
    throw new Error("Invalid centerLon: must be between -180 and 180");
  }
}

function validateRadius(radius: number): void {
  if (radius <= 0 || radius > 10000) { // Max 10km radius
    throw new Error("Invalid radius: must be between 0 and 10000 meters");
  }
}

type Handler = Schema["setupGeofence"]["functionHandler"];

export const handler: Handler = async (event) => {
  const { name, centerLat, centerLon, radius, childId } = event.arguments;

  // Extract user identity
  let parentId: string | undefined;
  if (event.identity && "sub" in event.identity) {
    parentId = event.identity.sub;
  }

  if (!parentId) {
    throw new Error("Unauthorized");
  }

  // Input validation
  validateCoordinates(centerLat, centerLon);
  validateRadius(radius);

  // Validate that the user is a parent
  const userResult = await docClient.send(
    new GetCommand({
      TableName: process.env.USER_TABLE_NAME!,
      Key: { id: parentId },
    })
  );

  const user = userResult.Item;
  if (!user || user.userType !== 'PARENT') {
    throw new Error("Only parents can create geofences");
  }

  // If childId is specified, validate it's the parent's child
  if (childId) {
    const childResult = await docClient.send(
      new GetCommand({
        TableName: process.env.USER_TABLE_NAME!,
        Key: { id: childId },
      })
    );

    const child = childResult.Item;
    if (!child || child.parentId !== parentId || child.userType !== 'CHILD') {
      throw new Error("Invalid childId: not your child or doesn't exist");
    }
  }

  // Create the geofence
  const geofence = {
    id: `geofence-${parentId}-${Date.now()}`,
    parentId,
    name,
    centerLat,
    centerLon,
    radius,
    isActive: true,
    childId: childId || undefined,
    notifyOnEntry: true,
    notifyOnExit: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await docClient.send(
    new PutCommand({
      TableName: process.env.GEOFENCE_TABLE_NAME!,
      Item: geofence,
    })
  );

  return geofence;
};