import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  QueryCommand,
  PutCommand,
  GetCommand,
} from "@aws-sdk/lib-dynamodb";
import { DynamoDBStreamEvent } from "aws-lambda";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

// Haversine formula
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export const handler = async (event: DynamoDBStreamEvent) => {
  for (const record of event.Records) {
    if (record.eventName !== "INSERT") continue;

    const location = record.dynamodb?.NewImage;
    if (!location) continue;

    const userId = location.userId?.S;
    const latitude = parseFloat(location.latitude?.N || "0");
    const longitude = parseFloat(location.longitude?.N || "0");

    if (!userId) continue;

    // 1. Get user's parentId
    const userResult = await docClient.send(
      new GetCommand({
        TableName: process.env.USER_TABLE_NAME,
        Key: { id: userId },
      })
    );

    const parentId = userResult.Item?.parentId;
    if (!parentId) continue;

    // 2. Get all geofences
    const geofencesResult = await docClient.send(
      new QueryCommand({
        TableName: process.env.GEOFENCE_TABLE_NAME,
        IndexName: "geofencesByParent", // Match schema definition
        KeyConditionExpression: "parentId = :parentId",
        ExpressionAttributeValues: {
          ":parentId": parentId,
        },
      })
    );

    const geofences = geofencesResult.Items || [];

    // 3. Evaluate geofences
    for (const geofence of geofences) {
      if (!geofence.isActive) continue;

      const centerLat = parseFloat(geofence.centerLat);
      const centerLon = parseFloat(geofence.centerLon);

      const distance = calculateDistance(
        latitude,
        longitude,
        centerLat,
        centerLon
      );

      const isInside = distance <= geofence.radius;

      // 4. Fetch previous state
      const stateResult = await docClient.send(
        new GetCommand({
          TableName: process.env.GEOFENCE_STATE_TABLE_NAME,
          Key: {
            userId,
            geofenceId: geofence.id,
          },
        })
      );

      const previousState = stateResult.Item;
      const wasInside = previousState?.isInside || false;

      // 5. Update geofence state
      await docClient.send(
        new PutCommand({
          TableName: process.env.GEOFENCE_STATE_TABLE_NAME,
          Item: {
            userId,
            geofenceId: geofence.id,
            isInside,
            lastChecked: new Date().toISOString(),
          },
        })
      );

      // 6. Detect change
      let alertType = null;

      if (!wasInside && isInside && geofence.notifyOnEntry) {
        alertType = "GEOFENCE_ENTRY";
      } else if (wasInside && !isInside && geofence.notifyOnExit) {
        alertType = "GEOFENCE_EXIT";
      }

      // 7. If changed, create alert
      if (alertType) {
        await docClient.send(
          new PutCommand({
            TableName: process.env.ALERT_TABLE_NAME,
            Item: {
              id: `${userId}-${Date.now()}`,
              userId,
              parentId,
              type: alertType,
              location: { latitude, longitude },
              geofenceId: geofence.id,
              geofenceName: geofence.name,
              message: `Child ${
                alertType === "GEOFENCE_ENTRY" ? "entered" : "left"
              } ${geofence.name}`,
              isRead: false,
              timestamp: new Date().toISOString(),
            },
          })
        );
      }
    }
  }
};
